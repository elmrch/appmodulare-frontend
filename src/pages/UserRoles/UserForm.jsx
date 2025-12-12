import React, { useState, useEffect } from "react";
import { rolesService } from "../../services/rolesService";

const UserForm = ({ user, onClose, onSave }) => {
  const [form, setForm] = useState({
    fullName: "",
    username: "",
    password: "",
    enabled: true,
    roleId: "",
    photoUrl: ""
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (user) {
      setForm({
        fullName: user.fullName || "",
        username: user.username || "",
        password: "", // No cargar contraseña por seguridad
        enabled: user.enabled !== undefined ? user.enabled : true,
        roleId: user.roles && user.roles.length > 0 ? user.roles[0].idRole : "",
        photoUrl: user.photoUrl || ""
      });
    } else {
      setForm({
        fullName: "",
        username: "",
        password: "",
        enabled: true,
        roleId: "",
        photoUrl: ""
      });
    }
    setErrors({});
  }, [user]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!form.fullName.trim()) newErrors.fullName = "El nombre es obligatorio";
    if (!form.username.trim()) newErrors.username = "El usuario es obligatorio";
    
    if (!user && !form.password.trim()) {
      newErrors.password = "La contraseña es obligatoria para nuevos usuarios";
    }
    
    if (!form.roleId) newErrors.roleId = "Debe seleccionar un rol";
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (form.username.includes('@') && !emailRegex.test(form.username)) {
      newErrors.username = "El formato del correo es inválido";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const userData = { ...form };
      
      if (user && (!userData.password || userData.password.trim() === "")) {
        delete userData.password;
      }
      
      if (user) {
        await rolesService.update(user.idUser, userData);
      } else {
        if (!userData.password || userData.password.trim() === "") {
          throw new Error("La contraseña es obligatoria");
        }
        await rolesService.create(userData);
      }
      
      onSave(!!user); 
    } catch (error) {
      console.error("Error al guardar usuario:", error);
      
      if (error.response?.data?.message) {
        setErrors({ submit: error.response.data.message });
      } else if (error.message) {
        setErrors({ submit: error.message });
      } else {
        setErrors({ submit: "Error al guardar el usuario" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="modal fade show d-block" 
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      tabIndex="-1"
    >
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              {user ? "✏️ Editar Usuario" : "➕ Nuevo Usuario"}
            </h5>
            <button 
              type="button" 
              className="btn-close" 
              onClick={onClose}
              aria-label="Close"
              disabled={loading}
            ></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {/* Mostrar error general */}
              {errors.submit && (
                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                  {errors.submit}
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={() => setErrors(prev => ({ ...prev, submit: '' }))}
                  ></button>
                </div>
              )}

              {/* Fila 1 - Tres columnas */}
              <div className="row">
                {/* Columna 1: Nombre Completo */}
                <div className="col-md-4 mb-3">
                  <div className="d-flex align-items-center">
                    <label htmlFor="fullName" className="form-label me-2 mb-0">
                      Nombre <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      className={`form-control form-control-sm ${errors.fullName ? 'is-invalid' : ''}`}
                      placeholder="Ej: Juan Pérez"
                      value={form.fullName}
                      onChange={handleChange}
                      disabled={loading}
                      required
                    />
                  </div>
                  {errors.fullName && (
                    <div className="invalid-feedback d-block">{errors.fullName}</div>
                  )}
                </div>

                {/* Columna 2: Usuario */}
                <div className="col-md-4 mb-3">
                  <div className="d-flex align-items-center">
                    <label htmlFor="username" className="form-label me-2 mb-0">
                      Usuario <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      className={`form-control form-control-sm ${errors.username ? 'is-invalid' : ''}`}
                      placeholder="Ej: juan.perez"
                      value={form.username}
                      onChange={handleChange}
                      disabled={loading || !!user}
                      required
                      autoComplete="off"
                    />
                  </div>
                  {errors.username && (
                    <div className="invalid-feedback d-block">{errors.username}</div>
                  )}
                  <small className="form-text text-muted">
                    {user ? "No modificable" : ""}
                  </small>
                </div>

                {/* Columna 3: Contraseña */}
                <div className="col-md-4 mb-3">
                  <div className="d-flex align-items-center">
                    <label htmlFor="password" className="form-label me-2 mb-0">
                      {user ? "Nueva Pass" : "Contraseña"} 
                      {!user && <span className="text-danger">*</span>}
                    </label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      className={`form-control form-control-sm ${errors.password ? 'is-invalid' : ''}`}
                      placeholder="••••••••"
                      value={form.password}
                      onChange={handleChange}
                      disabled={loading}
                      autoComplete="new-password"
                      required={!user}
                    />
                  </div>
                  {errors.password && (
                    <div className="invalid-feedback d-block">{errors.password}</div>
                  )}
                </div>
              </div>

              <div className="row">
                {/* Columna 1: Rol */}
                <div className="col-md-4 mb-3">
                  <div className="d-flex align-items-center">
                    <label htmlFor="roleId" className="form-label me-2 mb-0">
                      Rol <span className="text-danger">*</span>
                    </label>
                    <select
                      id="roleId"
                      name="roleId"
                      className={`form-select form-select-sm ${errors.roleId ? 'is-invalid' : ''}`}
                      value={form.roleId}
                      onChange={handleChange}
                      disabled={loading}
                      required
                    >
                      <option value="">Seleccione</option>
                      <option value="1">ADMIN</option>
                      <option value="2">USER</option>
                    </select>
                  </div>
                  {errors.roleId && (
                    <div className="invalid-feedback d-block">{errors.roleId}</div>
                  )}
                </div>

                <div className="col-md-4 mb-3">
                  <div className="d-flex align-items-center">
                    <label htmlFor="photoUrl" className="form-label me-2 mb-0">
                      Foto URL
                    </label>
                    <input
                      type="url"
                      id="photoUrl"
                      name="photoUrl"
                      className="form-control form-control-sm"
                      placeholder="https://..."
                      value={form.photoUrl}
                      onChange={handleChange}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="col-md-4 mb-3">
                  <div className="d-flex align-items-center">
                    <label htmlFor="enabled" className="form-label me-2 mb-0">
                      Estado
                    </label>
                    <div className="form-check form-switch">
                      <input
                        type="checkbox"
                        id="enabled"
                        name="enabled"
                        className="form-check-input"
                        role="switch"
                        checked={form.enabled}
                        onChange={handleChange}
                        disabled={loading}
                      />
                      <label htmlFor="enabled" className="form-check-label ms-2">
                        {form.enabled ? "Activo" : "Inactivo"}
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Información adicional en una sola fila */}
              <div className="row">
                <div className="col-12">
                  <div className="alert alert-info p-2 mb-0">
                    <small>
                      <strong>Información:</strong> 
                      {user ? " Deje la contraseña en blanco para no cambiarla." : " La contraseña es obligatoria para nuevos usuarios."}
                      {form.username.includes('@') && " El usuario debe ser un email válido."}
                    </small>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={onClose}
                disabled={loading}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Guardando...
                  </>
                ) : (
                  "Guardar"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserForm;