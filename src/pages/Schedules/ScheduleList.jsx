import React, { useState, useEffect } from "react";
import { scheduleService } from "../../services/scheduleService";
import ScheduleForm from "./ScheduleForm";

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
    <div className="container mt-4">

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>⏰ Gestión de Horarios</h2>
        <button className="btn btn-primary" onClick={handleNew}>
          ➕ Nuevo Horario
        </button>
      </div>

      {/* Loading */}
      {loading && <div className="alert alert-info">Cargando horarios...</div>}

      {/* Table */}
      {!loading && (
        <table className="table table-striped table-bordered">
          <thead className="table-dark">
            <tr>
              <th>ID</th>
              <th>Inicio</th>
              <th>Fin</th>
              <th>Creado</th>
              <th>Acciones</th>
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
                  <td>{s.id}</td>
                  <td>{s.startTime}</td>
                  <td>{s.endTime}</td>
                  <td>
                    {s.createdAt
                      ? new Date(s.createdAt).toLocaleDateString()
                      : ""}
                  </td>
                  <td>
                    <button
                      className="btn btn-warning btn-sm me-2"
                      onClick={() => handleEdit(s)}
                    >
                      ✏️ Editar
                    </button>

                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(s.id)}
                    >
                      🗑️ Eliminar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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

