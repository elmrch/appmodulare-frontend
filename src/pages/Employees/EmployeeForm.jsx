import React, { useState, useEffect } from "react";
import { employeeService } from "../../services/employeeService";
import { areaService } from "../../services/areaService";
import { scheduleService } from "../../services/scheduleService";

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
    photoUrl: "",
    photo: null, // Para el archivo de imagen
  });

  const [touched, setTouched] = useState({
    firstName: true,
    lastName: true,
    dni: true,
    email: true,
    phone: true,
    address: true,
    hireDate: true,
    areaId: true,
    position: true,
    salary: true,
    scheduleId: true,
    photoUrl: true
  });

  const [photoPreview, setPhotoPreview] = useState(null);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return dateString.split("T")[0];
  };

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
        hireDate: formatDate(employee.hireDate),
        areaId: employee.areaId ?? "",
        position: employee.position ?? "",
        salary: employee.salary ?? "",
        scheduleId: employee.scheduleId ?? "",
        photoUrl: employee.photoUrl ?? "",
        photo: null,
      });
      setPhotoPreview(employee.photoUrl);
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, photo: file });
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    // 1. Preparamos los datos del empleado (SIN la foto)
    const employeeData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      dni: formData.dni,
      email: formData.email || null,
      phone: formData.phone || null,
      address: formData.address || null,
      hireDate: formData.hireDate,
      areaId: formData.areaId,
      position: formData.position || null,
      salary: formData.salary || null,
      scheduleId: formData.scheduleId,
    };

    console.log('1. Datos del empleado a enviar:', employeeData);

    let employeeId;

    // 2. Crear o actualizar el empleado
    if (employee) {
      console.log('2. Actualizando empleado ID:', employee.id);
      await employeeService.update(employee.id, employeeData);
      employeeId = employee.id;
      console.log('3. Empleado actualizado');
    } else {
      console.log('2. Creando nuevo empleado');
      const response = await employeeService.create(employeeData);
      employeeId = response.data.id;
      console.log('3. Empleado creado con ID:', employeeId);
    }

    // 3. Si hay una foto nueva, la subimos
    if (formData.photo) {
      console.log('4. Subiendo foto para empleado ID:', employeeId);
      console.log('5. Archivo:', formData.photo);
      
      await employeeService.uploadPhoto(employeeId, formData.photo);
      
      console.log('6. Foto subida exitosamente');
    }

    alert(`Empleado ${employee ? 'actualizado' : 'creado'} exitosamente`);
    onSave(!!employee);

  } catch (error) {
    console.error("Error completo:", error);
    console.error("Error config:", error.config);
    console.error("Error response:", error.response);
    
    const errorMessage = error.response?.data?.message 
      || error.message 
      || "Error al guardar el empleado. Revisa la consola para más detalles.";
    
    alert(errorMessage);

  } finally {
    setLoading(false);
  }
};

  // Función para determinar la clase de validación
  const getValidationClass = (fieldName, isRequired = false) => {
    const value = formData[fieldName]?.toString().trim();

    if (fieldName === 'dni') {
      return value.length === 8 ? 'is-valid' : 'is-invalid';
    } else if (isRequired) {
      return value ? 'is-valid' : 'is-invalid';
    }
    
    // For optional fields, only show valid if there's a value
    return value ? 'is-valid' : '';
  };

  // Determina si el formulario es válido para habilitar/deshabilitar el botón de guardado
  const isFormValid =
    formData.firstName.trim() !== "" &&
    formData.lastName.trim() !== "" &&
    formData.dni.trim().length === 8 &&
    formData.hireDate.trim() !== "" &&
    formData.areaId !== "" &&
    formData.scheduleId !== "";

  return (
    <form onSubmit={handleSubmit}>
      {/* DATOS PERSONALES */}
      <div className="mb-4" id="employee-form">
        <h6 className="text-primary fw-bold mb-3">
          <i className="bi bi-person me-2"></i>Datos Personales
        </h6>
        
        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label fw-semibold">Nombres *</label>
            <input
              type="text"
              name="firstName"
              className={`form-control ${getValidationClass('firstName', true)}`}
              value={formData.firstName}
              onChange={handleChange}
              placeholder="Ingrese nombres"
              required
            />
            {!formData.firstName.trim() && (
              <div className="invalid-feedback d-block">
                El nombre es obligatorio
              </div>
            )}
         
          </div>

          <div className="col-md-6 mb-3">
            <label className="form-label fw-semibold">Apellidos *</label>
            <input
              type="text"
              name="lastName"
              className={`form-control ${getValidationClass('lastName', true)}`}
              value={formData.lastName}
              onChange={handleChange}
              placeholder="Ingrese apellidos"
              required
            />
            {!formData.lastName.trim() && (
              <div className="invalid-feedback d-block">
                El apellido es obligatorio
              </div>
            )}
          </div>
        </div>

        <div className="row">
          <div className="col-md-4 mb-3">
            <label className="form-label fw-semibold" >DNI *</label>
            <input
              type="text"
              name="dni"
              className={`form-control ${getValidationClass('dni', true)}`}
              value={formData.dni}
              onChange={handleChange}
              placeholder="12345678"
              maxLength={8}
              required
            />
            {formData.dni.trim().length !== 8 && (
              <div className="invalid-feedback d-block">
                El DNI debe tener 8 caracteres
              </div>
            )}
          </div>

          <div className="col-md-4 mb-3">
            <label className="form-label fw-semibold">Email</label>
            <input
              type="email"
              name="email"
              className={`form-control ${getValidationClass('email', false)}`}
              value={formData.email}
              onChange={handleChange}
              placeholder="correo@ejemplo.com"
            />
          </div>

          <div className="col-md-4 mb-3">
            <label className="form-label fw-semibold">Teléfono</label>
            <input
              type="text"
              name="phone"
              className={`form-control ${getValidationClass('phone', false)}`}
              value={formData.phone}
              onChange={handleChange}
              placeholder="987654321"
            />
          </div>
        </div>

        <div className="row">
          <div className="col-12 mb-3">
            <label className="form-label fw-semibold">Dirección</label>
            <input
              type="text"
              name="address"
              className={`form-control ${getValidationClass('address', false)}`}
              value={formData.address}
              onChange={handleChange}
              placeholder="Av. Ejemplo 123, Arequipa"
            />
          </div>
        </div>
      </div>

      {/* DATOS LABORALES */}
      <div className="mb-4">
        <h6 className="text-primary fw-bold mb-3">
          <i className="bi bi-briefcase me-2"></i>Datos Laborales
        </h6>

        <div className="row">
          <div className="col-md-4 mb-3">
            <label className="form-label fw-semibold">Fecha Ingreso *</label>
            <input
              type="date"
              name="hireDate"
              className={`form-control ${getValidationClass('hireDate', true)}`}
              value={formData.hireDate}
              onChange={handleChange}
              required
            />
            {!formData.hireDate && (
              <div className="invalid-feedback d-block">
                La fecha de ingreso es obligatoria
              </div>
            )}
          </div>

          <div className="col-md-4 mb-3">
            <label className="form-label fw-semibold">Área *</label>
            <select
              name="areaId"
              className={`form-select ${getValidationClass('areaId', true)}`}
              value={formData.areaId}
              onChange={handleChange}
              required
            >
              <option value="">Seleccione área</option>
              {areas.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
            {!formData.areaId && (
              <div className="invalid-feedback d-block">
                El área es obligatoria
              </div>
            )}
          </div>

          <div className="col-md-4 mb-3">
            <label className="form-label fw-semibold">Cargo</label>
            <input
              type="text"
              name="position"
              className={`form-control ${getValidationClass('position', false)}`}
              value={formData.position}
              onChange={handleChange}
              placeholder="Ej: Supervisor"
            />
          </div>
        </div>

        <div className="row">
          <div className="col-md-4 mb-3">
            <label className="form-label fw-semibold">Sueldo (S/)</label>
            <input
              type="number"
              step="0.01"
              name="salary"
              className={`form-control ${getValidationClass('salary', false)}`}
              value={formData.salary}
              onChange={handleChange}
              placeholder="1500.00"
            />
          </div>

          <div className="col-md-4 mb-3">
            <label className="form-label fw-semibold">Horario *</label>
            <select
              name="scheduleId"
              className={`form-select ${getValidationClass('scheduleId', true)}`}
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
            {!formData.scheduleId && (
              <div className="invalid-feedback d-block">
                El horario es obligatorio
              </div>
            )}
          </div>

          <div className="col-md-4 mb-3 d-flex flex-column">
            <label className="form-label fw-semibold">Foto</label>
            <div className="d-flex align-items-center gap-3">
              {photoPreview ? (
                <img 
                  src={photoPreview} 
                  alt="Vista previa" 
                  className="rounded-circle"
                    style={{ width: "70px", height: "70px", objectFit: "contain", background: "#f0f0f0" }}

                />
              ) : (
                <i className="bi bi-person-circle fs-2 text-muted"></i>
              )}
              <input
                type="file"
                name="photo"
                className="form-control"
                onChange={handleFileChange}
                accept="image/png, image/jpeg, image/jpg"
              />
            </div>
          </div>
        </div>
      </div>

      {/* BOTONES */}
      <div className="d-flex justify-content-end gap-2 mt-4">
        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
          <i className="bi bi-x-circle me-1"></i>
          Cancelar
        </button>
        <button type="submit" className="btn btn-success" disabled={loading || !isFormValid}>
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2"></span>
              Guardando...
            </>
          ) : (
            <>
              <i className={`bi ${employee ? 'bi-check-circle' : 'bi-save'} me-1`}></i>
              {employee ? 'Actualizar' : 'Guardar'}
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default EmployeeForm;