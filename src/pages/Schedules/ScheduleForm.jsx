import React, { useState, useEffect } from "react";
import { scheduleService } from "../../services/scheduleService";

const ScheduleForm = ({ schedule, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    startTime: "",
    endTime: ""
  });

  useEffect(() => {
    if (schedule) {
      setFormData({
        startTime: schedule.startTime,
        endTime: schedule.endTime
      });
    }
  }, [schedule]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (schedule) {
        await scheduleService.update(schedule.id, formData);
        alert("Horario actualizado");
      } else {
        await scheduleService.create(formData);
        alert("Horario creado");
      }
      onSave();
    } catch (error) {
      console.error("Error:", error);
      alert("Error al guardar");
    }
  };

  return (
    <>
      {/* Fondo oscuro */}
      <div
        className="modal-backdrop fade show"
        style={{ zIndex: 1050 }}
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div
        className="modal fade show"
        style={{ display: "block", zIndex: 1060 }}
      >
        <div className="modal-dialog">
          <div className="modal-content">

            <div className="modal-header">
              <h5 className="modal-title">
                {schedule ? "✏️ Editar Horario" : "➕ Nuevo Horario"}
              </h5>
              <button className="btn-close" onClick={onClose}></button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">

                <div className="mb-3">
                  <label className="form-label">Hora Inicio *</label>
                  <input
                    type="time"
                    className="form-control"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Hora Fin *</label>
                  <input
                    type="time"
                    className="form-control"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleChange}
                    required
                  />
                </div>

              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={onClose}>
                  Cancelar
                </button>

                <button type="submit" className="btn btn-primary">
                  {schedule ? "Actualizar" : "Guardar"}
                </button>
              </div>
            </form>

          </div>
        </div>
      </div>
    </>
  );
};

export default ScheduleForm;
