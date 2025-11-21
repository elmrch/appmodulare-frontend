import React, { useState, useEffect } from "react";
import { employeeService } from "../../services/employeeService";
import { areaService } from "../../services/areaService";
import { scheduleService } from "../../services/scheduleService";

const EmployeeForm = ({ employee, onClose, onSave }) => {
  const [areas, setAreas] = useState([]);
  const [schedules, setSchedules] = useState([]);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    dni: "",
    email: "",
    phone: "",
    address: "",
    hireDate: "",
    areaId: "",
    position: "",
    salary: "",
    scheduleId: "",
    photoUrl: ""
  });

  // Cargar áreas y horarios
  useEffect(() => {
    loadAreas();
    loadSchedules();

    if (employee) {
      setFormData({
        firstName: employee.firstName ?? "",
        lastName: employee.lastName ?? "",
        dni: employee.dni ?? "",
        email: employee.email ?? "",
        phone: employee.phone ?? "",
        address: employee.address ?? "",
        hireDate: employee.hireDate ?? "",
        areaId: employee.areaId ?? "",
        position: employee.position ?? "",
        salary: employee.salary ?? "",
        scheduleId: employee.scheduleId ?? "",
        photoUrl: employee.photoUrl ?? ""
      });
    }
  }, [employee]);

  const loadAreas = async () => {
    try {
      const res = await areaService.getAll();
      setAreas(res.data);
    } catch (e) {
      console.error("Error al cargar áreas:", e);
    }
  };

  const loadSchedules = async () => {
    try {
      const res = await scheduleService.getAll();
      setSchedules(res.data);
    } catch (e) {
      console.error("Error al cargar horarios:", e);
    }
  };

const handleChange = (e) => {
  const { name, value } = e.target;

  setFormData({
    ...formData,
    [name]: (name === "areaId" || name === "scheduleId")
      ? Number(value)                 // 👈 CONVERTIR A NÚMERO
      : value
  });
};


  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (employee) {
        await employeeService.update(employee.id, formData);
        alert("Empleado actualizado");
      } else {
        await employeeService.create(formData);
        alert("Empleado registrado");
      }

      onSave();
    } catch (error) {
      console.error("Error:", error);
      alert("Error al guardar empleado");
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
        <div className="modal-dialog modal-lg">
          <div className="modal-content">

            <div className="modal-header">
              <h5 className="modal-title">
                {employee ? "✏️ Editar Empleado" : "➕ Nuevo Empleado"}
              </h5>
              <button className="btn-close" onClick={onClose}></button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">

                {/* Row 1 */}
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Nombres *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">Apellidos *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                {/* Row 2 */}
                <div className="row">
                  <div className="col-md-4 mb-3">
                    <label className="form-label">DNI *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="dni"
                      value={formData.dni}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-4 mb-3">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-md-4 mb-3">
                    <label className="form-label">Teléfono</label>
                    <input
                      type="text"
                      className="form-control"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Row 3 */}
                <div className="mb-3">
                  <label className="form-label">Dirección</label>
                  <input
                    type="text"
                    className="form-control"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                  />
                </div>

                {/* Row 4 */}
                <div className="row">
                  <div className="col-md-4 mb-3">
                    <label className="form-label">Fecha Ingreso *</label>
                    <input
                      type="date"
                      className="form-control"
                      name="hireDate"
                      value={formData.hireDate}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-4 mb-3">
                    <label className="form-label">Área *</label>
                    <select
                      name="areaId"
                      className="form-select"
                      value={formData.areaId}
                      onChange={handleChange}
                      required
                    >
                      <option value="">-- Seleccione Área --</option>
                      {areas.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-4 mb-3">
                    <label className="form-label">Cargo</label>
                    <input
                      type="text"
                      className="form-control"
                      name="position"
                      value={formData.position}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Row 5 */}
                <div className="row">
                  <div className="col-md-4 mb-3">
                    <label className="form-label">Sueldo</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      name="salary"
                      value={formData.salary}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-md-4 mb-3">
                    <label className="form-label">Horario *</label>
                    <select
                      name="scheduleId"
                      className="form-select"
                      value={formData.scheduleId}
                      onChange={handleChange}
                      required
                    >
                      <option value="">-- Seleccione Horario --</option>
                      {schedules.map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.startTime} - {h.endTime}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-4 mb-3">
                    <label className="form-label">Foto URL</label>
                    <input
                      type="text"
                      className="form-control"
                      name="photoUrl"
                      value={formData.photoUrl}
                      onChange={handleChange}
                    />
                  </div>
                </div>

              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={onClose}>
                  Cancelar
                </button>

                <button type="submit" className="btn btn-primary">
                  {employee ? "Actualizar" : "Guardar"}
                </button>
              </div>

            </form>

          </div>
        </div>
      </div>
    </>
  );
};

export default EmployeeForm;
