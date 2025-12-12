import React, { useState, useEffect } from "react";
import { visitService } from "../../services/visitService";
import AlertNotification from "../Areas/AlertNotification";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";

const formatDateSafe = (dateString) => {
  if (!dateString) return "—";
  
  if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}/)) {
    const [year, month, day] = dateString.split('T')[0].split('-');
    return `${day}/${month}/${year}`;
  }
  
  try {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('es-PE');
  } catch {
    return "—";
  }
};

const VisitList = () => {
  const [visits, setVisits] = useState([]);
  const [filteredVisits, setFilteredVisits] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [visitToDelete, setVisitToDelete] = useState(null);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
const [itemsPerPage] = useState(8); 

  useEffect(() => {
    loadVisits();
    const interval = setInterval(() => {
      loadVisits();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const showAlert = (type, message) => {
    setAlert({ type, message });
  };

  const loadVisits = async () => {
    setLoading(true);
    try {
      const res = await visitService.getAll();
      setVisits(res.data);
      setFilteredVisits(res.data);
    } catch (error) {
      console.error("Error al cargar visitas:", error);
      showAlert("danger", "Error al cargar visitas");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
      setCurrentPage(1); 
    
    if (value.trim() === "") {
      setFilteredVisits(visits);
      return;
    }

    const searchLower = value.toLowerCase().trim();
    const filtered = visits.filter(v => {
      const fullName = v.fullName?.toLowerCase() || "";
      const dni = v.dni?.toLowerCase() || "";
      const company = v.company?.toLowerCase() || "";
      const reason = v.reason?.toLowerCase() || "";
      const date = v.date?.toLowerCase() || "";
      
      return fullName.includes(searchLower) ||
             dni.includes(searchLower) ||
             company.includes(searchLower) ||
             reason.includes(searchLower) ||
             date.includes(searchLower);
    });

    setFilteredVisits(filtered);
  };
// Cálculos de paginación
const indexOfLastItem = currentPage * itemsPerPage;
const indexOfFirstItem = indexOfLastItem - itemsPerPage;
const currentItems = filteredVisits.slice(indexOfFirstItem, indexOfLastItem);
const totalPages = Math.ceil(filteredVisits.length / itemsPerPage);

const handlePageChange = (pageNumber) => {
  setCurrentPage(pageNumber);
};

const handlePrevious = () => {
  if (currentPage > 1) setCurrentPage(currentPage - 1);
};

const handleNext = () => {
  if (currentPage < totalPages) setCurrentPage(currentPage + 1);
};

// Generar números de página con puntos suspensivos
const getPageNumbers = () => {
  const pageNumbers = [];
  const maxVisiblePages = 5;
  
  if (totalPages <= maxVisiblePages) {
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }
  } else {
    if (currentPage <= 3) {
      for (let i = 1; i <= 4; i++) {
        pageNumbers.push(i);
      }
      pageNumbers.push('...');
      pageNumbers.push(totalPages);
    } else if (currentPage >= totalPages - 2) {
      pageNumbers.push(1);
      pageNumbers.push('...');
      for (let i = totalPages - 3; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      pageNumbers.push(1);
      pageNumbers.push('...');
      for (let i = currentPage - 1; i <= currentPage + 1; i++) {
        pageNumbers.push(i);
      }
      pageNumbers.push('...');
      pageNumbers.push(totalPages);
    }
  }
  
  return pageNumbers;
};
  const openDeleteModal = (visit) => {
    setVisitToDelete(visit);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    try {
      await visitService.delete(visitToDelete.id);
      setShowDeleteModal(false);
      setVisitToDelete(null);
      showAlert("success", "Visita eliminada correctamente");
      loadVisits();
    } catch (error) {
      console.error("Error:", error);
      showAlert("danger", "Error al eliminar visita");
    }
  };

  // Exportar a PDF
  const exportToPDF = () => {
    const dataToExport = filteredVisits.length > 0 ? filteredVisits : visits;
    const doc = new jsPDF('l', 'mm', 'a4');
    
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text("REGISTRO DE VISITAS", 148, 15, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generado: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 148, 22, { align: 'center' });
    
    doc.setLineWidth(0.5);
    doc.setDrawColor(52, 73, 94);
    doc.line(10, 25, 287, 25);
    
    let yPos = 35;
    const lineHeight = 8;
    const leftMargin = 10;
    
    dataToExport.forEach((v, index) => {
      if (yPos > 190) {
        doc.addPage();
        yPos = 20;
      }
      
      if (index % 2 === 0) {
        doc.setFillColor(245, 245, 245);
        doc.rect(leftMargin, yPos - 6, 277, lineHeight * 5, 'F');
      }
      
      doc.setFontSize(12);
      doc.setTextColor(52, 73, 94);
      doc.setFont(undefined, 'bold');
      doc.text(`${v.id}. ${v.fullName}`, leftMargin + 2, yPos);
      
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(80, 80, 80);
      
      yPos += lineHeight;
      
      doc.text(`DNI: ${v.dni || "—"}`, leftMargin + 2, yPos);
      doc.text(`Empresa: ${v.company || "—"}`, leftMargin + 2, yPos + lineHeight);
      
      doc.text(`Motivo: ${v.reason || "—"}`, leftMargin + 80, yPos);
      doc.text(`Fecha: ${formatDateSafe(v.date)}`, leftMargin + 80, yPos + lineHeight);
      
      doc.text(`Ingreso: ${v.checkIn ? formatTime(v.checkIn) : "—"}`, leftMargin + 150, yPos);
      doc.text(`Salida: ${v.checkOut ? formatTime(v.checkOut) : "—"}`, leftMargin + 150, yPos + lineHeight);
      
      doc.text(`Estado: ${v.status || "—"}`, leftMargin + 220, yPos);
      
      yPos += lineHeight * 2 + 5;
      
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.1);
      doc.line(leftMargin, yPos - 3, 287, yPos - 3);
    });
    
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Página ${i} de ${pageCount} - Total de visitas: ${dataToExport.length}`,
        148,
        200,
        { align: 'center' }
      );
    }
    
    doc.save(`Visitas_${new Date().toISOString().split('T')[0]}.pdf`);
    showAlert("success", "PDF generado correctamente");
  };

  // Exportar a Excel
  const exportToExcel = () => {
    const dataToExport = filteredVisits.length > 0 ? filteredVisits : visits;
    
    const excelData = dataToExport.map(v => ({
      'ID': v.id,
      'Visitante': v.fullName,
      'DNI': v.dni,
      'Empresa': v.company,
      'Motivo': v.reason,
      'Fecha': formatDateSafe(v.date),
      'Ingreso': v.checkIn ? formatTime(v.checkIn) : '',
      'Salida': v.checkOut ? formatTime(v.checkOut) : '',
      'Estado': v.status || ''
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    const colWidths = [
      { wch: 5 }, { wch: 20 }, { wch: 12 }, { wch: 20 },
      { wch: 25 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 15 }
    ];
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, "Visitas");
    XLSX.writeFile(wb, `Visitas_${new Date().toISOString().split('T')[0]}.xlsx`);
    showAlert("success", "Excel generado correctamente");
  };

  // Funciones auxiliares
  const formatTime = (timeString) => {
    if (!timeString) return "—";
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return "—";
    }
  };

  const getStatusBadge = (status) => {
    if (!status) return <span className="badge bg-secondary">Sin estado</span>;

    const statusUpper = status.toUpperCase();
    if (statusUpper === "EN VISITA") {
      return <span className="badge bg-success">EN VISITA</span>;
    } else if (statusUpper === "FINALIZADA") {
      return <span className="badge bg-info text-dark">FINALIZADA</span>;
    } else if (statusUpper === "PENDIENTE") {
      return <span className="badge bg-warning text-dark">PENDIENTE</span>;
    }
    return <span className="badge bg-secondary">{status}</span>;
  };

  return (
    <div className="container-fluid">
      {/* Alert */}
      {alert && (
        <AlertNotification
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Page Heading */}
      <div className="d-sm-flex align-items-center justify-content-between mb-4">
        <h1 className="h3 mb-0 text-gray-800">Registro de Visitas</h1>
        <div className="d-flex gap-2">
          <button 
            className=" d-sm-inline-block btn btn-sm btn-success shadow-sm"
            onClick={exportToExcel}
            disabled={visits.length === 0}
          >
            <i className="bi bi-file-earmark-excel text-white-50 me-1"></i> Excel
          </button>
          <button 
            className="d-sm-inline-block btn btn-sm btn-danger shadow-sm"
            onClick={exportToPDF}
            disabled={visits.length === 0}
          >
            <i className="bi bi-file-earmark-pdf text-white-50 me-1"></i> PDF
          </button>
        </div>
      </div>

      {/* Search Card */}
      <div className="card shadow mb-4">

        <div className="card-body">
          <div className="input-group">
            <span className="input-group-text">
              <i className="bi bi-search"></i>
            </span>
            <input
              type="text"
              className="form-control input-sm"
              placeholder="Buscar por nombre, DNI, empresa, motivo o fecha..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
            />
            {searchTerm && (
              <button 
                className="btn btn-outline-secondary" 
                type="button"
                onClick={() => handleSearch("")}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            )}
          </div>
          {searchTerm && (
            <small className="text-muted d-block mt-2">
              Mostrando {filteredVisits.length} de {visits.length} visitas
            </small>
          )}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="card shadow mb-4">
          <div className="card-body text-center py-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
            <p className="text-muted mt-2 mb-0">Cargando visitas...</p>
          </div>
        </div>
      )}

      {/* DataTales Example */}
      {!loading && (
        <div className="card shadow mb-4">

          <div className="card-body">
            <div className="table-responsive">
              <table className="table" id="dataTable" width="100%" cellSpacing="0">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Visitante</th>
                    <th className=" d-md-table-cell">DNI</th>
                    <th className="d-lg-table-cell">Empresa</th>
                    <th className=" d-lg-table-cell">Motivo</th>
                    <th className=" d-xl-table-cell">Fecha</th>
                    <th className=" d-xl-table-cell">Ingreso</th>
                    <th className=" d-xl-table-cell">Salida</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredVisits.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="text-center py-4 text-muted">
                        <i className="bi bi-inbox fs-1 d-block mb-2"></i>
                        {searchTerm ? 'No se encontraron visitas' : 'No hay visitas registradas'}
                      </td>
                    </tr>
                  ) : (
                    currentItems.map((v) => (
                      <tr key={v.id}>
                        <td>{v.id}</td>
                        <td>
                          <strong>{v.fullName}</strong>
                        </td>
                        <td className="d-md-table-cell">
                          {v.dni || "—"}
                        </td>
                        <td className=" d-lg-table-cell">
                          {v.company || "—"}
                        </td>
                        <td className=" d-lg-table-cell">
                          {v.reason ? (
                            <span className="text-truncate d-inline-block" style={{maxWidth: '200px'}}>
                              {v.reason}
                            </span>
                          ) : "—"}
                        </td>
                        <td className=" d-xl-table-cell">
                          {formatDateSafe(v.date)}
                        </td>
                        <td className=" d-xl-table-cell">
                          {v.checkIn ? formatTime(v.checkIn) : "—"}
                        </td>
                        <td className=" d-xl-table-cell">
                          {v.checkOut ? formatTime(v.checkOut) : "—"}
                        </td>
                        <td>
                          {getStatusBadge(v.status)}
                        </td>
                        <td>
                          <button 
                            className="btn btn-danger btn-sm"
                            onClick={() => openDeleteModal(v)}
                            title="Eliminar"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              {/* Paginación */}
{filteredVisits.length > 0 && totalPages > 1 && (
  <div className="d-flex justify-content-between align-items-center mt-3">
    <div className="text-muted small">
      Mostrando {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, filteredVisits.length)} de {filteredVisits.length} registros
    </div>
    
    <nav aria-label="Navegación de páginas">
      <ul className="pagination mb-0">
        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
          <button 
            className="page-link" 
            onClick={handlePrevious}
            disabled={currentPage === 1}
            aria-label="Anterior"
          >
            <span aria-hidden="true">&laquo;</span>
          </button>
        </li>
        
        {getPageNumbers().map((pageNum, index) => (
          pageNum === '...' ? (
            <li key={`ellipsis-${index}`} className="page-item disabled">
              <span className="page-link">...</span>
            </li>
          ) : (
            <li 
              key={pageNum} 
              className={`page-item ${currentPage === pageNum ? 'active' : ''}`}
            >
              <button 
                className="page-link" 
                onClick={() => handlePageChange(pageNum)}
              >
                {pageNum}
              </button>
            </li>
          )
        ))}
        
        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
          <button 
            className="page-link" 
            onClick={handleNext}
            disabled={currentPage === totalPages}
            aria-label="Siguiente"
          >
            <span aria-hidden="true">&raquo;</span>
          </button>
        </li>
      </ul>
    </nav>
  </div>
)}
            </div>
          </div>
        </div>
      )}

      {/* Modal Delete */}
      {showDeleteModal && visitToDelete && (
        <div 
          className="modal fade show d-block" 
          style={{backgroundColor: 'rgba(0,0,0,0.5)'}} 
          onClick={() => setShowDeleteModal(false)}
          tabIndex="-1"
        >
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">¿Eliminar Visita?</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowDeleteModal(false)}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                <p>¿Estás seguro de eliminar la visita de <strong>"{visitToDelete.fullName}"</strong> ({visitToDelete.company || 'Sin empresa'}) del día <strong>{formatDateSafe(visitToDelete.date)}</strong>?</p>
                <p className="text-muted small">Esta acción no se puede deshacer.</p>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancelar
                </button>
                <button 
                  type="button" 
                  className="btn btn-danger" 
                  onClick={handleDelete}
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisitList;