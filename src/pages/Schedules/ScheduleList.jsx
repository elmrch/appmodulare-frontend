import React, { useState, useEffect } from "react";
import { scheduleService } from "../../services/scheduleService";
import ScheduleForm from "./ScheduleForm";
import AlertNotification from "../Areas/AlertNotification";

// ✅ FUNCIÓN PARA FORMATEAR FECHAS SIN PROBLEMAS DE ZONA HORARIA
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
        <h1 className="h3 mb-0 text-gray-800">Gestión de Horarios</h1>
        <div className="d-flex gap-2">
          <button 
            className=" d-sm-inline-block btn btn-sm btn-primary shadow-sm" 
            onClick={handleNew}
          >
            <i className="bi bi-plus-circle text-white-50 me-1"></i> Nuevo Horario
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="card shadow mb-4">
          <div className="card-body text-center py-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
            <p className="text-muted mt-2 mb-0">Cargando horarios...</p>
          </div>
        </div>
      )}

      {/* DataTales Example */}
      {!loading && (
        <div className="card shadow mb-4">
          <div className="card-header py-3">
            <h6 className="m-0 font-weight-bold text-primary">Listado de Horarios</h6>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table" id="dataTable" width="100%" cellSpacing="0">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Hora de Inicio</th>
                    <th>Hora de Fin</th>
                    <th className="d-none d-xl-table-cell">Fecha Creación</th>
                    <th>Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {schedules.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-4 text-muted">
                        <i className="bi bi-inbox fs-1 d-block mb-2"></i>
                        No hay horarios registrados
                      </td>
                    </tr>
                  ) : (
                    schedules.map((s) => (
                      <tr key={s.id}>
                        <td>{s.id}</td>
                        <td>
                          <span className="">
                            {s.startTime}
                          </span>
                        </td>
                        <td>
                          <span className="">
                            {s.endTime}
                          </span>
                        </td>
                        <td className="d-none d-xl-table-cell">
                          {formatDateSafe(s.createdAt)}
                        </td>
                        <td>
                          <button 
                            className="btn btn-warning btn-sm me-1"
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
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Formulario de creación/edición */}
      {showModal && (
        <div className="card shadow mb-4">
          <div className="card-header py-3">
            <h6 className="m-0 font-weight-bold text-primary">
              {selectedSchedule ? 'Editar Horario' : 'Nuevo Horario'}
            </h6>
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
      )}

      {/* Modal Delete */}
      {showDeleteModal && scheduleToDelete && (
        <div 
          className="modal fade show d-block" 
          style={{backgroundColor: 'rgba(0,0,0,0.5)'}} 
          onClick={() => setShowDeleteModal(false)}
          tabIndex="-1"
        >
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">¿Eliminar Horario?</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowDeleteModal(false)}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                <p>¿Estás seguro de eliminar el horario <strong>"{scheduleToDelete.startTime} - {scheduleToDelete.endTime}"</strong>?</p>
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

export default ScheduleList;