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
      HIGH: "bg-danger",
      MEDIUM: "bg-warning text-dark",
      LOW: "bg-success"
    };
    return badges[severity] || "bg-secondary";
  };

  const exportToPDF = () => {
    const dataToExport = filteredIncidents.length > 0 ? filteredIncidents : incidents;
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
    
    const excelData = dataToExport.map(inc => ({
      'ID': inc.id,
      'Fecha y Hora': formatDateTime(inc.dateTime),
      'Severidad': inc.severity,
      'Incidente': inc.incident,
      'Reportado Por': inc.reportedBy || ''
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    const colWidths = [
      { wch: 5 },
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
    <div className="container mt-4">
      {alert && (
        <AlertNotification
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h2 className="mb-0">🚨 Incidentes de Seguridad</h2>
        
        <div className="d-flex gap-2 flex-wrap">
          <div className="btn-group" role="group">
            <button 
              className="btn btn-success btn-sm"
              onClick={exportToExcel}
              disabled={incidents.length === 0}
              title="Exportar a Excel"
            >
              📊 Excel
            </button>
            <button 
              className="btn btn-danger btn-sm"
              onClick={exportToPDF}
              disabled={incidents.length === 0}
              title="Exportar a PDF"
            >
              📄 PDF
            </button>
          </div>

          <button className="btn btn-primary" onClick={handleNew}>
            ➕ Nuevo Incidente
          </button>
        </div>
      </div>

      <div className="mb-3">
        <div className="input-group">
          <span className="input-group-text bg-primary text-white">
            🔍
          </span>
          <input
            type="text"
            className="form-control"
            placeholder="Buscar por incidente, severidad o reportado por..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
          />
          {searchTerm && (
            <button 
              className="btn btn-outline-secondary" 
              type="button"
              onClick={() => handleSearch("")}
              title="Limpiar búsqueda"
            >
              ✖
            </button>
          )}
        </div>
        {searchTerm && (
          <small className="text-muted">
            Mostrando {filteredIncidents.length} de {incidents.length} incidentes
          </small>
        )}
      </div>

      {loading && <div className="alert alert-info">Cargando incidentes...</div>}

      {!loading && (
        <div className="table-responsive">
          <table className="table table-striped table-bordered">
            <thead className="table-dark">
              <tr>
                <th>ID</th>
                <th>Título</th>
                <th>Fecha y Hora</th>
                <th>Severidad</th>
                <th>Incidente</th>
                <th>Reportado Por</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {filteredIncidents.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center">
                    {searchTerm ? "No se encontraron incidentes con ese criterio" : "No hay incidentes registrados"}
                  </td>
                </tr>
              ) : (
                filteredIncidents.map((inc) => (
                  <tr key={inc.id}>
                    <td>{inc.id}</td>
                    <td><strong>{inc.title}</strong></td>
                    <td>{formatDateTime(inc.dateTime)}</td>
                    <td>
                      <span className={`badge ${getSeverityBadge(inc.severity)}`}>
                        {inc.severity}
                      </span>
                    </td>
                    <td>{inc.incident}</td>
                    <td>{inc.reportedBy || "—"}</td>
                    <td className="text-end" style={{ whiteSpace: "nowrap" }}>
                      <button
                        className="btn btn-warning btn-sm me-2 px-2 py-1"
                        onClick={() => handleEdit(inc)}
                        style={{ fontSize: "0.75rem" }}
                      >
                        ✏️ Editar
                      </button>
                      <button
                        className="btn btn-danger btn-sm px-2 py-1"
                        onClick={() => openDeleteModal(inc)}
                        style={{ fontSize: "0.75rem" }}
                      >
                        🗑️ Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <SecurityIncidentForm
          incident={selectedIncident}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}

      {showDeleteModal && incidentToDelete && (
        <div className="modal fade show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}} onClick={() => setShowDeleteModal(false)}>
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title">⚠️ Confirmar Eliminación</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowDeleteModal(false)}></button>
              </div>
              <div className="modal-body text-center py-4">
                <p className="mb-2">¿Estás seguro de eliminar este incidente?</p>
                <p className="fs-6 fw-bold text-danger mb-2">
                  {incidentToDelete.incident}
                </p>
                <p className="text-muted small">Esta acción no se puede deshacer</p>
              </div>
              <div className="modal-footer justify-content-center">
                <button type="button" className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
                  Cancelar
                </button>
                <button type="button" className="btn btn-danger" onClick={handleDelete}>
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