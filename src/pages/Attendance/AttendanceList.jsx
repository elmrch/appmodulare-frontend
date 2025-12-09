import React, { useState, useEffect } from "react";
import { attendanceService } from "../../services/attendanceService";
import AlertNotification from "../Areas/AlertNotification";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import './Attendance.css';

const AttendanceList = () => {
  const [attendance, setAttendance] = useState([]);
  const [filteredAttendance, setFilteredAttendance] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [attendanceToDelete, setAttendanceToDelete] = useState(null);
  //pagination
  const [currentPage, setCurrentPage] = useState(1);
const [itemsPerPage] = useState(8); 

  useEffect(() => {
    loadAttendance();
  }, []);

  const showAlert = (type, message) => {
    setAlert({ type, message });
  };

  const loadAttendance = async () => {
    setLoading(true);
    try {
      const res = await attendanceService.getAll();
      setAttendance(res.data);
      setFilteredAttendance(res.data);
    } catch (error) {
      console.error("Error al cargar asistencias:", error);
      showAlert("danger", "Error al cargar asistencias");
    } finally {
      setLoading(false);
    }
  };
  const handleSearch = (value) => {
    setSearchTerm(value);
      setCurrentPage(1);


    if (value.trim() === "") {
      setFilteredAttendance(attendance);
      return;
    }

    const term = value.toLowerCase().trim();
    const filtered = attendance.filter((a) => {
      const fullName = `${a.firstName} ${a.lastName}`.toLowerCase();
      const dni = a.dni?.toLowerCase() || "";
      const date = a.date?.toLowerCase() || "";
      const status = a.status?.toLowerCase() || "";

      return (
        fullName.includes(term) ||
        dni.includes(term) ||
        date.includes(term) ||
        status.includes(term)
      );
    });

    setFilteredAttendance(filtered);
  };

  // Cálculos de paginación
const indexOfLastItem = currentPage * itemsPerPage;
const indexOfFirstItem = indexOfLastItem - itemsPerPage;
const currentItems = filteredAttendance.slice(indexOfFirstItem, indexOfLastItem);
const totalPages = Math.ceil(filteredAttendance.length / itemsPerPage);


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
  const openDeleteModal = (attendanceRecord) => {
    setAttendanceToDelete(attendanceRecord);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    try {
      await attendanceService.delete(attendanceToDelete.id);
      setShowDeleteModal(false);
      setAttendanceToDelete(null);
      showAlert("success", "Registro de asistencia eliminado correctamente");
      loadAttendance();
    } catch (error) {
      console.error("Error:", error);
      showAlert("danger", "Error al eliminar registro de asistencia");
    }
  };

  // Exportar a PDF
  const exportToPDF = async () => {
    const dataToExport = filteredAttendance.length > 0 ? filteredAttendance : attendance;
    if (dataToExport.length === 0) {
      showAlert("warning", "No hay datos para exportar");
      return;
    }

    const doc = new jsPDF('l', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Cargar el logo
    const logo = "/src/assets/img/favicon_1.png";
    const imgData = await fetch(logo)
      .then(res => res.blob())
      .then(blob => new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      }));

    // Encabezado del PDF
    doc.addImage(imgData, 'PNG', 10, 8, 15, 15);
    doc.setFont("helvetica", "bold");
    doc.setTextColor("#ff1d4d"); // Color corporativo
    doc.setFontSize(16);
    doc.text("MODULARE AREQUIPA SAC", 30, 18);
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.setFont("helvetica", "normal");
    doc.text("Reporte de Asistencias", 30, 24);

    // Tabla
    const headers = ["ID", "EMPLEADO", "DNI", "FECHA", "ENTRADA", "SALIDA", "HORAS", "ESTADO", "UBICACIÓN"];
    const colWidths = [10, 55, 22, 22, 22, 22, 20, 25, 30];
    const startY = 35;
    const startX = 10;
    const lineHeight = 8;

    // Dibujar encabezados de la tabla
    doc.setFillColor("#ff1d4d"); // Color corporativo para el fondo del header
    doc.setDrawColor(200);
    doc.setLineWidth(0.3);
    let xPos = startX;

    headers.forEach((header, i) => {
      doc.rect(xPos, startY, colWidths[i], lineHeight, "FD");
      xPos += colWidths[i];
    });

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255); // Texto blanco
    xPos = startX;

    headers.forEach((header, i) => {
      const textWidth = doc.getTextWidth(header);
      const textX = xPos + (colWidths[i] - textWidth) / 2;
      doc.text(header, textX, startY + 5.5);
      xPos += colWidths[i];
    });

    // Dibujar filas de datos
    let yPos = startY + lineHeight;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(8.5);

    dataToExport.forEach((a, index) => {
      if (yPos > pageHeight - 20) { // Salto de página
        doc.addPage();
        yPos = 20; // Reiniciar Y en la nueva página
      }

      // Alternar color de filas
      if (index % 2 === 0) {
        doc.setFillColor(255, 255, 255);
      } else {
        doc.setFillColor(240, 240, 240);
      }

      xPos = startX;
      headers.forEach((_, i) => {
        doc.rect(xPos, yPos, colWidths[i], lineHeight, "FD");
        xPos += colWidths[i];
      });

      const rowData = [
        String(a.id),
        `${a.firstName} ${a.lastName}`,
        a.dni || "—",
        formatDateSafe(a.date),
        formatTime(a.checkIn),
        formatTime(a.checkOut),
        a.totalHoursFormatted || "—",
        a.status || "—",
        getLocationStatus(a)
      ];

      xPos = startX;
      rowData.forEach((cell, i) => {
        doc.text(cell, xPos + 2, yPos + 5.5);
        xPos += colWidths[i];
      });

      yPos += lineHeight;
    });
    
    // Pie de página
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Página ${i} de ${totalPages} - Total de registros: ${dataToExport.length}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }
    
    doc.save(`Reporte-Asistencias_${new Date().toISOString().split('T')[0]}.pdf`);
    showAlert("success", "PDF generado correctamente");
  };

  // Exportar a Excel
  const exportToExcel = () => {
    const dataToExport = filteredAttendance.length > 0 ? filteredAttendance : attendance;
    if (dataToExport.length === 0) {
      showAlert("warning", "No hay datos para exportar");
      return;
    }
    
    const excelData = dataToExport.map(a => ({
      'ID': a.id,
      'Nombre': a.firstName,
      'Apellido': a.lastName,
      'DNI': a.dni || '',
      'Fecha': formatDateSafe(a.date),
      'Entrada': a.checkIn ? formatTime(a.checkIn) : '',
      'Salida': a.checkOut ? formatTime(a.checkOut) : '',
      'Horas Trabajadas': a.totalHoursFormatted || '',
      'Estado': a.status || '',
      'Ubicación': getLocationStatus(a),
      'Distancia (m)': a.distanceFromOffice ? Math.round(a.distanceFromOffice) : '',
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    const colWidths = [
      { wch: 5 }, { wch: 15 }, { wch: 15 }, { wch: 12 },
      { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
      { wch: 15 }, { wch: 15 }, { wch: 12 }
    ];
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, "Asistencias");
    XLSX.writeFile(wb, `Asistencias_${new Date().toISOString().split('T')[0]}.xlsx`);
    showAlert("success", "Excel generado correctamente");
  };

  // Funciones auxiliares
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

  const formatTime = (timeString) => {
    if (!timeString) return "—";
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return "—";
    }
  };

  const getLocationStatus = (attendance) => {
    if (!attendance.checkInLatitude || !attendance.checkInLongitude) {
      return "Sin GPS";
    }
    return attendance.locationValid ? "Válida" : "Fuera de ubicación";
  };

  const getStatusBadge = (status) => {
    if (!status) return <span className="badge bg-secondary">Sin estado</span>;

    const statusUpper = status.toUpperCase();
    if (statusUpper === "PUNTUAL") {
      return <span className="badge bg-success">PUNTUAL</span>;
    } else if (statusUpper === "TARDE") {
      return <span className="badge bg-danger">TARDE</span>;
    } else if (statusUpper === "FUERA_DE_UBICACION" || statusUpper === "FUERA DE UBICACIÓN") {
      return <span className="badge bg-warning text-dark">FUERA DE UBICACIÓN</span>;
    }
    return <span className="badge bg-secondary">{status}</span>;
  };

  const getLocationBadge = (attendance) => {
    if (!attendance.checkInLatitude || !attendance.checkInLongitude) {
      return <span className="badge bg-secondary">Sin GPS</span>;
    }
    
    if (attendance.locationValid) {
      return <span className="badge bg-success">Válida</span>;
    } else {
      return <span className="badge bg-danger">Fuera</span>;
    }
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
        <h1 className="h3 mb-0 text-gray-800">Historial de Asistencias</h1>
        <div className="d-flex gap-2">
          <button 
            className=" d-sm-inline-block btn btn-sm btn-success shadow-sm"
            onClick={exportToExcel}
            disabled={attendance.length === 0}
          >
            <i className="bi bi-file-earmark-excel text-white-50 me-1"></i> Excel
          </button>
          <button 
            className=" d-sm-inline-block btn btn-sm btn-danger shadow-sm"
            onClick={exportToPDF}
            disabled={attendance.length === 0}
          >
            <i className="bi bi-file-earmark-pdf text-white-50 me-1"></i> PDF
          </button>
        </div>
      </div>

      {/* Search Card */}
      <div className="card shadow mb-4">

        
      </div>

      {/* Loading */}
      {loading && (
        <div className="card shadow mb-4">
          <div className="card-body text-center py-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
            <p className="text-muted mt-2 mb-0">Cargando asistencias...</p>
          </div>
        </div>
      )}

      {/* DataTales Example */}
      {!loading && (
        <div className="card shadow mb-4">
<div className="card-body">
          <div className="input-group">
            <span className="input-group-text">
              <i className="bi bi-search"></i>
            </span>
            <input
              type="text"
              className="form-control input-sm"
              placeholder="Buscar por nombre, DNI, fecha o estado..."
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
              Mostrando {filteredAttendance.length} de {attendance.length} registros
            </small>
          )}
        </div>
          
          <div className="card-body">
            <div className="table-responsive">
              <table className="table" id="dataTable" width="100%" cellSpacing="0">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Empleado</th>
                    <th className="d-md-table-cell">DNI</th>
                    <th className=" d-lg-table-cell">Fecha</th>
                    <th className=" d-lg-table-cell">Entrada</th>
                    <th className=" d-lg-table-cell">Salida</th>
                    <th className=" d-xl-table-cell">Horas</th>
                    <th>Estado</th>
                    <th className=" d-xl-table-cell">Ubicación</th>
                    <th>Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredAttendance.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="text-center py-4 text-muted">
                        <i className="bi bi-inbox fs-1 d-block mb-2"></i>
                        {searchTerm ? 'No se encontraron registros' : 'No hay asistencias registradas'}
                      </td>
                    </tr>
                  ) : (
                    currentItems.map((a) => (
                      <tr key={a.id}>
                        <td>{a.id}</td>
                        <td>
                          <strong>{a.firstName} {a.lastName}</strong>
                        </td>
                        <td className=" d-md-table-cell">
                          {a.dni || "—"}
                        </td>
                        <td className=" d-lg-table-cell">
                          {formatDateSafe(a.date)}
                        </td>
                        <td className="d-lg-table-cell">
                          {a.checkIn ? formatTime(a.checkIn) : "—"}
                        </td>
                        <td className=" d-lg-table-cell">
                          {a.checkOut ? formatTime(a.checkOut) : "—"}
                        </td>
                        <td className=" d-xl-table-cell">
                          {a.totalHoursFormatted || "—"}
                        </td>
                        <td>
                          {getStatusBadge(a.status)}
                        </td>
                        <td className=" d-xl-table-cell">
                          {getLocationBadge(a)}
                        </td>
                        <td>
                          <button 
                            className="btn btn-danger btn-sm"
                            onClick={() => openDeleteModal(a)}
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
{filteredAttendance.length > 0 && totalPages > 1 && (
  <div className="d-flex justify-content-between align-items-center mt-3">
    <div className="text-muted small">
      Mostrando {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, filteredAttendance.length)} de {filteredAttendance.length} registros
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
      {showDeleteModal && attendanceToDelete && (
        <div 
          className="modal fade show d-block" 
          style={{backgroundColor: 'rgba(0,0,0,0.5)'}} 
          onClick={() => setShowDeleteModal(false)}
          tabIndex="-1"
        >
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">¿Eliminar Registro?</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowDeleteModal(false)}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                <p>¿Estás seguro de eliminar el registro de asistencia de <strong>"{attendanceToDelete.firstName} {attendanceToDelete.lastName}"</strong> del día <strong>{formatDateSafe(attendanceToDelete.date)}</strong>?</p>
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

export default AttendanceList;