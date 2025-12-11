import React, { useState, useEffect } from "react";
import { rolesService } from "../../services/rolesService";

const UserForm = ({ closeModal, loadUsers, selectedUser }) => {
  const [form, setForm] = useState({
    fullName: "", // Nombre completo
    username: "", // Nombre de usuario
    password: "", // Contraseña
    enabled: true, // Estado
    roleId: "", // Rol del usuario
    photoUrl: "" // URL de la foto
  });

  const [roles, setRoles] = useState([]);

  useEffect(() => {
    if (selectedUser) {
      setForm({
        fullName: selectedUser.fullName,
        username: selectedUser.username,
        password: "",
        enabled: selectedUser.enabled,
        roleId: selectedUser.roles[0]?.idRole,
        photoUrl: selectedUser.photoUrl
      });
    }
    // Limpiar formulario si no hay usuario seleccionado (para "Nuevo Usuario")
    else {
      setForm({
        fullName: "",
        username: "",
        password: "",
        enabled: true,
        roleId: "",
        photoUrl: ""
      });
    }
  }, [selectedUser]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

const handleSubmit = async (e) => {
  e.preventDefault();

  const cleanForm = { ...form };

  // No enviar password si está vacío
  if (!cleanForm.password || cleanForm.password.trim() === "") {
    delete cleanForm.password;
  }

  try {
    if (selectedUser)
      await rolesService.update(selectedUser.idUser, cleanForm);
    else
      await rolesService.create(cleanForm);

    loadUsers();
    closeModal();
  } catch (err) {
    console.error(err);
    alert("Error al guardar");
  }
};


  return (
    <div className="modal show d-block" style={{ background: "rgba(0,0,0,0.4)" }}>
      <div className="modal-dialog">
        <div className="modal-content">

          <div className="modal-header">
            <h5 className="modal-title">
              {selectedUser ? "Editar Usuario" : "Nuevo Usuario"}
            </h5>
            <button className="btn-close" onClick={closeModal}></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body">

              <input
                type="text"
                name="fullName"
                className="form-control mb-2"
                placeholder="Fullname"
                value={form.fullName}
                onChange={handleChange}
                required
              />

              <input
                type="text"
                name="username"
                className="form-control mb-2"
                placeholder="Username"
                value={form.username}
                onChange={handleChange}
                autoComplete="off"
                required
              />

              <input
                type="password"
                name="password"
                className="form-control mb-2"
                placeholder="password "
                value={form.password}
                onChange={handleChange}
                autoComplete="new-password"
              />

              <div className="form-floating mb-2">
                <select
                  className="form-select"
                  id="roleId"
                  name="roleId"
                  value={form.roleId}
                  onChange={handleChange}
                  required>
                  <option value="">Seleccione un tipo</option>
                  <option value="1">ADMIN</option>
                  <option value="2">USER</option>
                </select>
                <label htmlFor="roleId">Tipo de Usuario</label>
              </div>

              <input
                type="text"
                name="photoUrl"
                className="form-control mb-2"
                placeholder="URL de foto"
                value={form.photoUrl}
                onChange={handleChange}
              />
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeModal}>
                Cancelar
              </button>
              <button className="btn btn-primary" type="submit">
                Guardar
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
};

export default UserForm;
