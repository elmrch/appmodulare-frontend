import React, { useState, useEffect } from "react";
import { scheduleService } from "../../services/scheduleService";
import ScheduleForm from "./ScheduleForm";
import "./ScheduleList.css"

const ScheduleList = () => {
  const [schedules, setSchedules] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    setLoading(true);
    try {
      const response = await scheduleService.getAll();
      setSchedules(response.data);
    } catch (error) {
      console.error("Error al cargar horarios:", error);
      alert("Error al cargar horarios");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("¿Eliminar este horario?")) {
      try {
        await scheduleService.delete(id);
        alert("Horario eliminado");
        loadSchedules();
      } catch (error) {
        console.error("Error:", error);
        alert("Error al eliminar");
      }
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

  const handleSave = () => {
    setShowModal(false);
    setSelectedSchedule(null);
    loadSchedules();
  };

return (
  <div className="attendance-container">
    {/* Header */}
    <div className="attendance-header">
      <div>
        <h2 className="page-title">
          <i className="bi bi-clock-fill"></i>
          Gestión de Horarios
        </h2>
        <p className="page-subtitle">{schedules.length} horarios registrados</p>
      </div>
      
      <div className="header-actions">
        <button className="btn btn-primary" onClick={handleNew}>
          <i className="bi bi-plus-circle me-1"></i>
          Nuevo Horario
        </button>
      </div>
    </div>

    {/* Loading */}
    {loading && <div className="alert alert-info">Cargando horarios...</div>}

    {/* Table */}
    {!loading && (
      <div className="table-card">
        <div className="table-responsive">
          <table className="table attendance-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>INICIO</th>
                <th>FIN</th>
                <th>CREADO</th>
                <th>ACCIONES</th>
              </tr>
            </thead>

            <tbody>
              {schedules.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center">
                    No hay horarios registrados
                  </td>
                </tr>
              ) : (
                schedules.map((s) => (
                  <tr key={s.id}>
                    <td>#{s.id}</td>
                    <td>{s.startTime}</td>
                    <td>{s.endTime}</td>
                    <td>
                      {s.createdAt
                        ? new Date(s.createdAt).toLocaleDateString()
                        : "—"}
                    </td>
                    <td>
                      <button
                        className="btn btn-warning btn-sm me-2"
                        onClick={() => handleEdit(s)}
                      >
                        <i className="bi bi-pencil"></i>
                      </button>

                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(s.id)}
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
    )}

    {/* Modal */}
    {showModal && (
      <ScheduleForm
        schedule={selectedSchedule}
        onClose={() => setShowModal(false)}
        onSave={handleSave}
      />
    )}
  </div>
);
};

export default ScheduleList;

