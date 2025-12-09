import React, { useState, useEffect } from "react";
import { securityIncidentService } from "../../services/securityIncidentService";
import SecurityIncidentForm from "./SecurityIncidentForm";
import AlertNotification from "../Areas/AlertNotification";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";

const formatDateTime = (dateString) => {
  if (!dateString) return "—";
  
  try {
    const date = new Date(dateString);
    return date.toLocaleString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return "—";
  }
};

const SecurityIncidentList = () => {
  const [incidents, setIncidents] = useState([]);
  const [filteredIncidents, setFilteredIncidents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [incidentToDelete, setIncidentToDelete] = useState(null);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(3);

  useEffect(() => {
    loadIncidents();
  }, []);

  const showAlert = (type, message) => {
    setAlert({ type, message });
  };

  const loadIncidents = async () => {
    setLoading(true);
    try {
      const response = await securityIncidentService.getAll();
      setIncidents(response.data);
      setFilteredIncidents(response.data);
    } catch (error) {
      console.error("Error al cargar incidentes:", error);
      showAlert("danger", "Error al cargar incidentes");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset a la primera página al buscar
    
    if (value.trim() === "") {
      setFilteredIncidents(incidents);
      return;
    }

    const searchLower = value.toLowerCase().trim();
    const filtered = incidents.filter(inc => {
      const title = inc.title?.toLowerCase() || "";
      const incident = inc.incident?.toLowerCase() || "";
      const severity = inc.severity?.toLowerCase() || "";
      const reportedBy = inc.reportedBy?.toLowerCase() || "";
      const description = inc.description?.toLowerCase() || "";
      
      return title.includes(searchLower) ||
             incident.includes(searchLower) || 
             severity.includes(searchLower) || 
             reportedBy.includes(searchLower) ||
             description.includes(searchLower);
    });

    setFilteredIncidents(filtered);
  };

  // Cálculos de paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredIncidents.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredIncidents.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handlePrevious = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  // Generar números de página
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

  const openDeleteModal = (incident) => {
    setIncidentToDelete(incident);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    try {
      await securityIncidentService.delete(incidentToDelete.id);
      setShowDeleteModal(false);
      setIncidentToDelete(null);
      showAlert("success", "Incidente eliminado correctamente");
      loadIncidents();
    } catch (error) {
      console.error("Error:", error);
      showAlert("danger", "Error al eliminar incidente");
    }
  };

  const handleEdit = (incident) => {
    setSelectedIncident(incident);
    setShowModal(true);
  };

  const handleNew = () => {
    setSelectedIncident(null);
    setShowModal(true);
  };

  const handleSave = (isEdit) => {
    setShowModal(false);
    setSelectedIncident(null);
    showAlert("success", isEdit ? "Incidente actualizado correctamente" : "Incidente creado correctamente");
    loadIncidents();
  };

  const getSeverityBadge = (severity) => {
    const badges = {
      HIGH: { class: "bg-danger", icon: "bi-exclamation-octagon-fill", text: "ALTA" },
      MEDIUM: { class: "bg-warning text-dark", icon: "bi-exclamation-triangle-fill", text: "MEDIA" },
      LOW: { class: "bg-success", icon: "bi-info-circle-fill", text: "BAJA" }
    };
    return badges[severity] || { class: "bg-secondary", icon: "bi-question-circle", text: severity };
  };

  const exportToPDF = () => {
    const dataToExport = filteredIncidents.length > 0 ? filteredIncidents : incidents;
    
    if (dataToExport.length === 0) {
      showAlert("warning", "No hay datos para exportar");
      return;
    }

    const doc = new jsPDF('l', 'mm', 'a4');
    
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text("INCIDENTES DE SEGURIDAD", 148, 15, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generado: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 148, 22, { align: 'center' });
    
    doc.setLineWidth(0.5);
    doc.setDrawColor(52, 73, 94);
    doc.line(10, 25, 287, 25);
    
    let yPos = 35;
    const lineHeight = 8;
    const leftMargin = 10;
    
    dataToExport.forEach((inc, index) => {
      if (yPos > 190) {
        doc.addPage();
        yPos = 20;
      }
      
      if (index % 2 === 0) {
        doc.setFillColor(245, 245, 245);
        doc.rect(leftMargin, yPos - 6, 277, lineHeight * 4, 'F');
      }
      
      doc.setFontSize(12);
      doc.setTextColor(52, 73, 94);
      doc.setFont(undefined, 'bold');
      doc.text(`${inc.id}. ${inc.incident}`, leftMargin + 2, yPos);
      
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(80, 80, 80);
      
      yPos += lineHeight;
      
      doc.text(`Severidad: ${inc.severity}`, leftMargin + 2, yPos);
      doc.text(`Reportado por: ${inc.reportedBy || "—"}`, leftMargin + 80, yPos);
      doc.text(`Fecha: ${formatDateTime(inc.dateTime)}`, leftMargin + 180, yPos);
      
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
        `Página ${i} de ${pageCount} - Total de incidentes: ${dataToExport.length}`,
        148,
        200,
        { align: 'center' }
      );
    }
    
    doc.save(`Incidentes_Seguridad_${new Date().toISOString().split('T')[0]}.pdf`);
    showAlert("success", "PDF generado correctamente");
  };

  const exportToExcel = () => {
    const dataToExport = filteredIncidents.length > 0 ? filteredIncidents : incidents;
    
    if (dataToExport.length === 0) {
      showAlert("warning", "No hay datos para exportar");
      return;
    }

    const excelData = dataToExport.map(inc => ({
      'ID': inc.id,
      'Título': inc.title,
      'Fecha y Hora': formatDateTime(inc.dateTime),
      'Severidad': inc.severity,
      'Incidente': inc.incident,
      'Reportado Por': inc.reportedBy || ''
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    const colWidths = [
      { wch: 5 },
      { wch: 25 },
      { wch: 20 },
      { wch: 12 },
      { wch: 50 },
      { wch: 20 }
    ];
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, "Incidentes");
    XLSX.writeFile(wb, `Incidentes_Seguridad_${new Date().toISOString().split('T')[0]}.xlsx`);
    showAlert("success", "Excel generado correctamente");
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

      <div className="d-sm-flex align-items-center justify-content-between mb-4">
        <h1 className="h3 mb-0 text-gray-800">Incidentes de Seguridad</h1>
        <div className="d-flex gap-2">
          <button 
            className=" d-sm-inline-block btn btn-sm btn-success shadow-sm"
            onClick={exportToExcel}
            disabled={incidents.length === 0}
          >
            <i className="bi bi-file-earmark-excel text-white-50 me-1"></i> Excel
          </button>
          <button 
            className=" d-sm-inline-block btn btn-sm btn-danger shadow-sm"
            onClick={exportToPDF}
            disabled={incidents.length === 0}
          >
            <i className="bi bi-file-earmark-pdf text-white-50 me-1"></i> PDF
          </button>
          <button 
            className=" d-sm-inline-block btn btn-sm btn-primary shadow-sm" 
            onClick={handleNew}
          >
            <i className="bi bi-plus-circle text-white-50 me-1"></i> Nuevo Incidente
          </button>
        </div>
      </div>

      {loading && (
        <div className="card shadow mb-4">
          <div className="card-body text-center py-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
            <p className="text-muted mt-2 mb-0">Cargando incidentes...</p>
          </div>
        </div>
      )}

      {!loading && (
        <>
          <div className="card shadow mb-4">
            <div className="card-body">
              <div className="input-group">
                <span className="input-group-text">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control input-sm"
                  placeholder="Buscar por incidente, severidad o reportado por..."
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
                  Mostrando {filteredIncidents.length} de {incidents.length} incidentes
                </small>
              )}
            </div>
          </div>

          <div className="card shadow mb-4">
            <div className="card-body">
              <div className="table-responsive">
                <table className="table" id="dataTable" width="100%" cellSpacing="0">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Título</th>
                      <th className=" d-md-table-cell">Fecha y Hora</th>
                      <th>Severidad</th>
                      <th className=" d-lg-table-cell">Incidente</th>
                      <th className=" d-xl-table-cell">Reportado Por</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredIncidents.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center py-4 text-muted">
                          <i className="bi bi-inbox fs-1 d-block mb-2"></i>
                          {searchTerm ? 'No se encontraron incidentes' : 'No hay incidentes registrados'}
                        </td>
                      </tr>
                    ) : (
                      currentItems.map((inc) => {
                        const severityInfo = getSeverityBadge(inc.severity);
                        return (
                          <tr key={inc.id}>
                            <td>{inc.id}</td>
                            <td>{inc.title}</td>
                            <td className=" d-md-table-cell">
                              {formatDateTime(inc.dateTime)}
                            </td>
                            <td>
                              <span className={`badge ${severityInfo.class}`}>
                                <i className={`${severityInfo.icon} me-1`}></i>
                                {severityInfo.text}
                              </span>
                            </td>
                            <td className=" d-lg-table-cell">
                              {inc.incident}
                            </td>
                            <td className=" d-xl-table-cell">
                              {inc.reportedBy || "—"}
                            </td>
                            <td>
                              <button 
                                className="btn btn-warning btn-sm me-1"
                                onClick={() => handleEdit(inc)}
                                title="Editar"
                              >
                                <i className="bi bi-pencil"></i>
                              </button>
                              <button 
                                className="btn btn-danger btn-sm"
                                onClick={() => openDeleteModal(inc)}
                                title="Eliminar"
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              {filteredIncidents.length > 0 && totalPages > 1 && (
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <div className="text-muted small">
                    Mostrando {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, filteredIncidents.length)} de {filteredIncidents.length} registros
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
        </>
      )}

      {showModal && (
        <div className="card shadow mb-4">
          <div className="card-header py-3">
            <h6 className="m-0 font-weight-bold text-primary">
              {selectedIncident ? 'Editar Incidente' : 'Nuevo Incidente'}
            </h6>
          </div>
          <div className="card-body">
            <SecurityIncidentForm 
              incident={selectedIncident} 
              onClose={() => {
                setShowModal(false);
                setSelectedIncident(null);
              }}
              onSave={handleSave}
            />
          </div>
        </div>
      )}

      {showDeleteModal && incidentToDelete && (
        <div 
          className="modal fade show d-block" 
          style={{backgroundColor: 'rgba(0,0,0,0.5)'}} 
          onClick={() => setShowDeleteModal(false)}
          tabIndex="-1"
        >
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">¿Eliminar Incidente?</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowDeleteModal(false)}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                <p>¿Estás seguro de eliminar el incidente <strong>{incidentToDelete.incident}</strong>?</p>
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

export default SecurityIncidentList;