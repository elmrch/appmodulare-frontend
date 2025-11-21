import React, { useState, useEffect } from "react";
import { attendanceService } from "../../services/attendanceService";
import { employeeService } from "../../services/employeeService";

const AttendanceForm = ({ attendance, onClose, onSave }) => {
  const [employees, setEmployees] = useState([]);

  const [formData, setFormData] = useState({
    employee_id: "",
    check_in: "",
    check_out: "",
    total_hours: "",
    status: "",
    date: "",
  });

  // Cargar empleados + cargar datos si es edición
  useEffect(() => {
    loadEmployees();

    if (attendance) {
      setFormData({
        employee_id: attendance.employeeId ?? "",
        check_in: attendance.checkIn ?? "",
        check_out: attendance.checkOut ?? "",
        total_hours: attendance.totalHours ?? "",
        status: attendance.status ?? "",
        date: attendance.date ?? "",
      });
    }
  }, [attendance]);

  const loadEmployees = async () => {
    try {
      const res = await employeeService.getAll();
      setEmployees(res.data);
    } catch (err) {
      console.error("Error al cargar empleados:", err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]:
        name === "employee_id"
          ? Number(value) // convertir a número
          : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (attendance) {
        await attendanceService.update(attendance.id, formData);
        alert("Asistencia actualizada");
      } else {
        await attendanceService.create(formData);
        alert("Asistencia registrada");
      }

      onSave();
    } catch (error) {
      console.error("Error:", error);
      alert("Error al guardar asistencia");
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
      <div className="modal fade show" style={{ display: "block", zIndex: 1060 }}>
        <div className="modal-dialog modal-lg">
          <div className="modal-content">

            <div className="modal-header">
              <h5 className="modal-title">
                {attendance ? "✏️ Editar Asistencia" : "➕ Nueva Asistencia"}
              </h5>
              <button className="btn-close" onClick={onClose}></button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">

                {/* Row 1 - Empleado + Fecha */}
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Empleado *</label>
                    <select
                      name="employee_id"
                      className="form-select"
                      value={formData.employee_id}
                      onChange={handleChange}
                      required
                    >
                      <option value="">-- Seleccione --</option>
                      {employees.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.firstName} {e.lastName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">Fecha *</label>
                    <input
                      type="date"
                      className="form-control"
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                {/* Row 2 - Entrada / Salida */}
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Check In</label>
                    <input
                      type="datetime-local"
                      className="form-control"
                      name="check_in"
                      value={formData.check_in}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">Check Out</label>
                    <input
                      type="datetime-local"
                      className="form-control"
                      name="check_out"
                      value={formData.check_out}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Row 3 - Horas / Estado */}
                <div className="row">
                  <div className="col-md-4 mb-3">
                    <label className="form-label">Horas Totales</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      name="total_hours"
                      value={formData.total_hours}
                      onChange={handleChange}
                      disabled
                    />
                  </div>

                  <div className="col-md-4 mb-3">
                    <label className="form-label">Estado</label>
                    <select
                      name="status"
                      className="form-select"
                      value={formData.status}
                      onChange={handleChange}
                    >
                      <option value="">-- Auto --</option>
                      <option value="PUNTUAL">PUNTUAL</option>
                      <option value="TARDE">TARDE</option>
                    </select>
                  </div>
                </div>

              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={onClose}>
                  Cancelar
                </button>

                <button type="submit" className="btn btn-primary">
                  {attendance ? "Actualizar" : "Guardar"}
                </button>
              </div>

            </form>

          </div>
        </div>
      </div>
    </>
  );
};

export default AttendanceForm;
