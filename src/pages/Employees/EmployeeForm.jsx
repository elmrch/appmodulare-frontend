import React, { useState, useEffect } from "react";
import { employeeService } from "../../services/employeeService";
import { areaService } from "../../services/areaService";
import { scheduleService } from "../../services/scheduleService";
import "./EmployeeList.css"; // Usa los mismos estilos

const EmployeeForm = ({ employee, onClose, onSave }) => {
  const [areas, setAreas] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);

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
      [name]: (name === "areaId" || name === "scheduleId") ? Number(value) : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (employee) {
        await employeeService.update(employee.id, formData);
      } else {
        await employeeService.create(formData);
      }
      onSave();
    } catch (error) {
      console.error("Error:", error);
      alert("Error al guardar empleado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="modal-glass-backdrop" onClick={onClose}></div>

      {/* Modal */}
      <div className="modal-glass">
        
        {/* Header */}
        <div className="modal-glass-header">
          <h5 className="modal-glass-title">
            <i className={`bi ${employee ? "bi-pencil-square" : "bi-person-plus"}`}></i>
            {employee ? "Editar Empleado" : "Nuevo Empleado"}
          </h5>
          <button className="btn-close-glass" onClick={onClose}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="modal-glass-body">
            
            {/* DATOS PERSONALES */}
            <div className="section-divider">
              <span><i className="bi bi-person me-2"></i>Datos Personales</span>
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label-glass">Nombres *</label>
                <input
                  type="text"
                  className="form-control form-control-glass"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Ingrese nombres"
                  required
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label-glass">Apellidos *</label>
                <input
                  type="text"
                  className="form-control form-control-glass"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Ingrese apellidos"
                  required
                />
              </div>
            </div>

            <div className="row">
              <div className="col-md-4 mb-3">
                <label className="form-label-glass">DNI *</label>
                <input
                  type="text"
                  className="form-control form-control-glass"
                  name="dni"
                  value={formData.dni}
                  onChange={handleChange}
                  placeholder="12345678"
                  maxLength={8}
                  required
                />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label-glass">Email</label>
                <input
                  type="email"
                  className="form-control form-control-glass"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="correo@ejemplo.com"
                />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label-glass">Teléfono</label>
                <input
                  type="text"
                  className="form-control form-control-glass"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="987654321"
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label-glass">Dirección</label>
              <input
                type="text"
                className="form-control form-control-glass"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Av. Ejemplo 123, Arequipa"
              />
            </div>

            {/* DATOS LABORALES */}
            <div className="section-divider">
              <span><i className="bi bi-briefcase me-2"></i>Datos Laborales</span>
            </div>

            <div className="row">
              <div className="col-md-4 mb-3">
                <label className="form-label-glass">Fecha Ingreso *</label>
                <input
                  type="date"
                  className="form-control form-control-glass"
                  name="hireDate"
                  value={formData.hireDate}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label-glass">Área *</label>
                <select
                  name="areaId"
                  className="form-select form-select-glass"
                  value={formData.areaId}
                  onChange={handleChange}
                  required
                >
                  <option value="">Seleccione área</option>
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label-glass">Cargo</label>
                <input
                  type="text"
                  className="form-control form-control-glass"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  placeholder="Ej: Supervisor"
                />
              </div>
            </div>

            <div className="row">
              <div className="col-md-4 mb-3">
                <label className="form-label-glass">Sueldo (S/)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control form-control-glass"
                  name="salary"
                  value={formData.salary}
                  onChange={handleChange}
                  placeholder="1500.00"
                />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label-glass">Horario *</label>
                <select
                  name="scheduleId"
                  className="form-select form-select-glass"
                  value={formData.scheduleId}
                  onChange={handleChange}
                  required
                >
                  <option value="">Seleccione horario</option>
                  {schedules.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.startTime} - {h.endTime}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label-glass">Foto URL</label>
                <input
                  type="text"
                  className="form-control form-control-glass"
                  name="photoUrl"
                  value={formData.photoUrl}
                  onChange={handleChange}
                  placeholder="https://..."
                />
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="modal-glass-footer">
            <button type="button" className="btn btn-cancel" onClick={onClose}>
              <i className="bi bi-x-circle me-2"></i>Cancelar
            </button>
            <button type="submit" className="btn btn-save" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Guardando...
                </>
              ) : (
                <>
                  <i className="bi bi-check-circle me-2"></i>
                  {employee ? "Actualizar" : "Guardar"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default EmployeeForm;