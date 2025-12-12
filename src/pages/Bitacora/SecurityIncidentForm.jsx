import React, { useState, useEffect } from "react";
import { securityIncidentService } from "../../services/securityIncidentService";
import { userService } from "../../services/userService";

const SecurityIncidentForm = ({ incident, onClose, onSave }) => {
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    severity: "",
    incident: "",
    reportedBy: "" // Add reportedBy to the form data
  });

  useEffect(() => {
    if (incident) {
      // Modo Edición: Cargar datos del incidente existente
      setFormData({
        title: incident.title ?? "",
        severity: incident.severity ?? "",
        incident: incident.incident ?? "",
      reportedBy: incident.reportedBy || userService.getUserData().fullName || '' // ✅ CAMBIO AQUÍ
      });
    } else {
      // Modo Creación: Solo establecer quién reporta
      const userData = userService.getUserData();
    setFormData(prev => ({ ...prev, reportedBy: userData.fullName || '' })); // ✅ CAMBIO AQUÍ
    }
  }, [incident]); // La dependencia es correcta

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    

    try {
      if (incident) {
        await securityIncidentService.update(incident.id, formData);
      } else {
        await securityIncidentService.create(formData);
      }
      onSave(!!incident);
    } catch (error) {
      console.error("Error:", error);
      alert("Error al guardar incidente");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="modal-backdrop fade show" 
        onClick={onClose}
        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      ></div>

      {/* Modal */}
      <div className="modal fade show d-block" tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            
            {/* Header */}
            <div className="modal-header bg-primary text-white">
              <h5 className="modal-title">
                <i className={`bi ${incident ? "bi-pencil-square" : "bi-plus-circle"} me-2`}></i>
                {incident ? "Editar Incidente" : "Nuevo Incidente"}
              </h5>
              <button 
                type="button" 
                className="btn-close btn-close-white" 
                onClick={onClose}
              ></button>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                
                <div className="mb-3">
                  <label className="form-label fw-bold">
                    <i className="bi bi-bookmark me-2 text-info"></i>
                    Título *
                  </label>
                  <input
                    type="text"
                    name="title"
                    className="form-control"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Ej: Intento de ingreso no autorizado"
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-bold">
                    <i className="bi bi-exclamation-triangle me-2 text-warning"></i>
                    Severidad *
                  </label>
                  <select
                    name="severity"
                    className="form-select"
                    value={formData.severity}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Seleccione severidad</option>
                    <option value="HIGH">🔴 Alta (HIGH)</option>
                    <option value="MEDIUM">🟡 Media (MEDIUM)</option>
                    <option value="LOW">🟢 Baja (LOW)</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-bold">
                    <i className="bi bi-file-text me-2 text-primary"></i>
                    Descripción del Incidente *
                  </label>
                  <textarea
                    name="incident"
                    className="form-control"
                    rows="5"
                    value={formData.incident}
                    onChange={handleChange}
                    placeholder="Describa detalladamente el incidente de seguridad..."
                    required
                  />
                </div>

                <div className="alert alert-info d-flex align-items-start" role="alert">
                <i className="bi bi-info-circle me-2 mt-1"></i>
                  <div>
                    <strong>Nota:</strong> La fecha/hora y el usuario que reporta se registrarán automáticamente.
                  </div>
                </div>

              </div>

              {/* Footer */}
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={onClose}
                >
                  <i className="bi bi-x-circle me-2"></i>
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-circle me-2"></i>
                      {incident ? "Actualizar" : "Guardar"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default SecurityIncidentForm;