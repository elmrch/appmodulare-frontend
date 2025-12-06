import React, { useState, useEffect } from "react";
import { securityIncidentService } from "../../services/securityIncidentService";
import SecurityIncidentForm from "./SecurityIncidentForm";
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
    const date = new Date(dateString);
    return new Date(dateString).toLocaleDateString('es-PE');
  } catch {
    return "—";
  }
};

const formatDateTime = (dateString) => {
  if (!dateString) return "—";
  
  try {
    const date = new Date(dateString);
    return date.toLocaleString('es-PE');
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
      
      return title.includes(searchLower) ||
             incident.includes(searchLower) || 
             severity.includes(searchLower) || 
             reportedBy.includes(searchLower);
    });

    setFilteredIncidents(filtered);
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
    <div className="container-fluid px-4 py-4">
      {/* Alert */}
      {alert && (
        <div className="row mb-3">
          <div className="col-12">
            <AlertNotification
              type={alert.type}
              message={alert.message}
              onClose={() => setAlert(null)}
            />
          </div>
        </div>
      )}

      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
            <div>
              <h2 className="mb-2 fw-bold">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                Incidentes de Seguridad
              </h2>
              <p className="text-muted mb-0">
                {filteredIncidents.length} incidentes registrados
              </p>
            </div>

            <div className="d-flex gap-2">
              <button
                className="btn btn-success d-flex align-items-center"
                onClick={exportToExcel}
                disabled={incidents.length === 0}
              >
                <i className="bi bi-file-earmark-excel me-2"></i>
                Exportar Excel
              </button>

              <button
                className="btn btn-danger d-flex align-items-center"
                onClick={exportToPDF}
                disabled={incidents.length === 0}
              >
                <i className="bi bi-file-earmark-pdf me-2"></i>
                Exportar PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="row">
          <div className="col-12">
            <div className="alert alert-info d-flex align-items-center" role="alert">
              <div className="spinner-border spinner-border-sm me-2" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
              Cargando incidentes...
            </div>
          </div>
        </div>
      )}

      {!loading && (
        <div className="row">
          <div className="col-12">
            <div className="card shadow-sm border border-secondary">
              <div className="card-header bg-secondary text-white py-3 d-flex justify-content-between align-items-center">
                <h5 className="mb-0 d-flex align-items-center fw-bold">
                  Gestión de Incidentes
                </h5>
                <div className="d-flex align-items-center gap-2">
                  <div className="position-relative" style={{ minWidth: "300px" }}>
                    <i
                      className="bi bi-search position-absolute"
                      style={{
                        left: "10px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#6c757d",
                      }}
                    ></i>
                    <input
                      type="text"
                      className="form-control form-control-sm ps-5"
                      placeholder="Buscar por incidente, severidad o reportado por..."
                      value={searchTerm}
                      onChange={(e) => handleSearch(e.target.value)}
                      style={{ paddingRight: searchTerm ? "35px" : "10px" }}
                    />
                    {searchTerm && (
                      <button
                        className="btn btn-link position-absolute p-0"
                        style={{
                          right: "10px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: "#6c757d",
                        }}
                        onClick={() => handleSearch("")}
                      >
                        <i className="bi bi-x-circle"></i>
                      </button>
                    )}
                  </div>
                  <button className="btn btn-primary btn-sm d-flex align-items-center" onClick={handleNew}>
                    <i className="bi bi-plus-circle me-2"></i>
                    Nuevo
                  </button>
                </div>
              </div>

              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover table-bordered align-middle mb-0">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-muted">ID</th>
                        <th className="py-3 text-muted">Título</th>
                        <th className="py-3 d-none d-lg-table-cell text-muted text-center">Fecha y Hora</th>
                        <th className="py-3 text-muted text-center">Severidad</th>
                        <th className="py-3 d-none d-md-table-cell text-muted">Incidente</th>
                        <th className="py-3 d-none d-xl-table-cell text-muted">Reportado Por</th>
                        <th className="py-3 text-end pe-4 text-muted">Acciones</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredIncidents.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="text-center py-5 text-muted">
                            <i className="bi bi-inbox fs-1 d-block mb-2"></i>
                            {searchTerm
                              ? "No se encontraron coincidencias"
                              : "No hay incidentes registrados"}
                          </td>
                        </tr>
                      ) : (
                        filteredIncidents.map((inc) => {
                          const severityInfo = getSeverityBadge(inc.severity);
                          return (
                            <tr key={inc.id}>
                              <td className="px-4">
                                <span className="badge bg-secondary">#{inc.id}</span>
                              </td>
                              <td>
                                <strong className="text-dark">{inc.title}</strong>
                              </td>
                              <td className="text-center d-none d-lg-table-cell">
                                <span className="text-muted small">
                                  {formatDateTime(inc.dateTime)}
                                </span>
                              </td>
                              <td className="text-center">
                                <span className={`badge ${severityInfo.class}`}>
                                  <i className={`bi ${severityInfo.icon} me-1`}></i>
                                  {severityInfo.text}
                                </span>
                              </td>
                              <td className="d-none d-md-table-cell">
                                {inc.incident}
                              </td>
                              <td className="d-none d-xl-table-cell">
                                {inc.reportedBy || "—"}
                              </td>
                              <td className="text-end pe-4">
                                <div className="d-flex justify-content-end gap-2">
                                  <button
                                    className="btn btn-warning btn-sm"
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
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Formulario de creación/edición */}
      {showModal && (
        <div className="row mb-4 mt-4">
          <div className="col-12">
            <div className="card shadow-sm border border-primary">
              <div className="card-header bg-primary text-white py-3">
                <h5 className="mb-0 d-flex align-items-center fw-bold">
                  <i className={`bi ${selectedIncident ? 'bi-pencil-square' : 'bi-plus-circle'} me-2`}></i>
                  {selectedIncident ? 'Editar Incidente' : 'Nuevo Incidente'}
                </h5>
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
          </div>
        </div>
      )}

      {/* Modal Delete */}
      {showDeleteModal && incidentToDelete && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={() => setShowDeleteModal(false)}
          tabIndex="-1"
        >
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title d-flex align-items-center">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  Confirmar Eliminación
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowDeleteModal(false)}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body text-center py-4">
                <p className="mb-2">¿Estás seguro de eliminar este incidente?</p>
                <p className="fs-5 fw-bold text-danger mb-2">
                  {incidentToDelete.incident}
                </p>
                <p className="text-muted small mb-0">Esta acción no se puede deshacer</p>
              </div>
              <div className="modal-footer justify-content-center gap-2">
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
                  <i className="bi bi-trash me-1"></i>
                  Sí, Eliminar
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