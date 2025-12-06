import React, { useState, useEffect } from "react";
import { scheduleService } from "../../services/scheduleService";
import ScheduleForm from "./ScheduleForm";
import AlertNotification from "../Areas/AlertNotification";

const ScheduleList = () => {
  const [schedules, setSchedules] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [scheduleToDelete, setScheduleToDelete] = useState(null);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    loadSchedules();
  }, []);

  const showAlert = (type, message) => {
    setAlert({ type, message });
  };

  const loadSchedules = async () => {
    setLoading(true);
    try {
      const response = await scheduleService.getAll();
      setSchedules(response.data);
    } catch (error) {
      console.error("Error al cargar horarios:", error);
      showAlert("danger", "Error al cargar horarios");
    } finally {
      setLoading(false);
    }
  };

  const openDeleteModal = (schedule) => {
    setScheduleToDelete(schedule);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    try {
      await scheduleService.delete(scheduleToDelete.id);
      setShowDeleteModal(false);
      setScheduleToDelete(null);
      showAlert("success", "Horario eliminado correctamente");
      loadSchedules();
    } catch (error) {
      console.error("Error:", error);
      showAlert("danger", "Error al eliminar horario");
    }
  };

  const handleEdit = (schedule) => {
    setSelectedSchedule(schedule);
    setShowModal(true);
  };

  const handleNew = () => {
    setSelectedSchedule(null);
    setShowModal(true);
  };

  const handleSave = (isEdit) => {
    setShowModal(false);
    setSelectedSchedule(null);
    showAlert("success", isEdit ? "Horario actualizado correctamente" : "Horario creado correctamente");
    loadSchedules();
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
                <i className="bi bi-clock-fill me-2"></i>
                Gestión de Horarios
              </h2>
              <p className="text-muted mb-0">{schedules.length} horarios registrados</p>
            </div>

            <div>
              <button className="btn btn-primary d-flex align-items-center" onClick={handleNew}>
                <i className="bi bi-plus-circle me-2"></i>
                Nuevo Horario
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
              Cargando horarios...
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
                  Gestión de Horarios
                </h5>
                <div>
                  <button className="btn btn-primary btn-sm d-flex align-items-center" onClick={handleNew}>
                    <i className="bi bi-plus-circle me-2"></i>
                    Nuevo Horario
                  </button>
                </div>
              </div>

              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover table-bordered align-middle mb-0">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-muted">ID</th>
                        <th className="py-3 text-muted text-center">Hora de Inicio</th>
                        <th className="py-3 text-muted text-center">Hora de Fin</th>
                        <th className="py-3 d-none d-lg-table-cell text-muted text-center">Fecha Creación</th>
                        <th className="py-3 text-end pe-4 text-muted">Acciones</th>
                      </tr>
                    </thead>

                    <tbody>
                      {schedules.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="text-center py-5 text-muted">
                            <i className="bi bi-inbox fs-1 d-block mb-2"></i>
                            No hay horarios registrados
                          </td>
                        </tr>
                      ) : (
                        schedules.map((s) => (
                          <tr key={s.id}>
                            <td className="px-4">
                              <span className="badge bg-secondary">#{s.id}</span>
                            </td>
                            <td className="text-center">
                              <span className="badge bg-success">
                                <i className="bi bi-clock me-1"></i>
                                {s.startTime}
                              </span>
                            </td>
                            <td className="text-center">
                              <span className="badge bg-danger">
                                <i className="bi bi-clock-fill me-1"></i>
                                {s.endTime}
                              </span>
                            </td>
                            <td className="text-center d-none d-lg-table-cell">
                              <span className="text-muted">
                                {formatDate(s.createdAt)}
                              </span>
                            </td>
                            <td className="text-end pe-4">
                              <div className="d-flex justify-content-end gap-2">
                                <button
                                  className="btn btn-warning btn-sm"
                                  onClick={() => handleEdit(s)}
                                  title="Editar"
                                >
                                  <i className="bi bi-pencil"></i>
                                </button>
                                <button
                                  className="btn btn-danger btn-sm"
                                  onClick={() => openDeleteModal(s)}
                                  title="Eliminar"
                                >
                                  <i className="bi bi-trash"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
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
                  <i className={`bi ${selectedSchedule ? 'bi-pencil-square' : 'bi-plus-circle'} me-2`}></i>
                  {selectedSchedule ? 'Editar Horario' : 'Nuevo Horario'}
                </h5>
              </div>
              <div className="card-body">
                <ScheduleForm
                  schedule={selectedSchedule}
                  onClose={() => {
                    setShowModal(false);
                    setSelectedSchedule(null);
                  }}
                  onSave={handleSave}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Delete */}
      {showDeleteModal && scheduleToDelete && (
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
                <p className="mb-2">¿Estás seguro de eliminar este horario?</p>
                <p className="fs-5 fw-bold text-danger mb-2">
                  {scheduleToDelete.startTime} - {scheduleToDelete.endTime}
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

export default ScheduleList;