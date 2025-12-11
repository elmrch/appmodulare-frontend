import React, { useState, useEffect } from "react";
import { rolesService } from "../../services/rolesService";
import UserForm from "./UserForm";

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [alert, setAlert] = useState({ show: false, message: "", type: "" });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    rolesService
      .getAll()
      .then((res) => setUsers(res.data))
      .catch(() => showAlert("Error cargando usuarios", "danger"));
  };

  const showAlert = (message, type) => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert({ show: false }), 3000);
  };

  const handleNew = () => {
    setSelectedUser(null);
    setShowModal(true);
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar usuario?")) return;

    try {
      await rolesService.delete(id);
      showAlert("Usuario eliminado", "success");
      loadUsers();
    } catch {
      showAlert("Error al eliminar", "danger");
    }
  };

  return (
    <div className="card shadow-sm border border-secondary">
      <div className="card-header bg-secondary text-white py-3 d-flex justify-content-between">
        <h5 className="fw-bold">Gestión de Usuarios</h5>
        <button className="btn btn-primary" onClick={handleNew}>
          Nuevo Usuario
        </button>
      </div>



      <div className="card-body">
        <table className="table table-hover border">
          <thead>
            <tr className="table-secondary">
              <th>ID</th>
              <th>Nombre</th>
              <th>Usuario</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Foto</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {users.length > 0 ? (
              users.map((u) => (
                <tr key={u.idUser}>
                  <td>{u.idUser}</td>
                  <td>{u.fullName}</td>
                  <td>{u.username}</td>
                  <td>{u.roles?.map((r) => r.name).join(", ")}</td>
                  <td>{u.enabled ? "Activo" : "Inactivo"}</td>
                  <td>
                    {u.photoUrl && (
                      <img
                        src={u.photoUrl}
                        alt="foto"
                        width="40"
                        height="40"
                        style={{ borderRadius: "50%" }}
                      />
                    )}
                  </td>
                  <td>
                    <button
                      className="btn btn-warning btn-sm me-2"
                      onClick={() => handleEdit(u)}
                    >
                      Editar
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(u.idUser)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="text-center py-3">No hay usuarios para mostrar.</td>
              </tr>
            )}
          </tbody>

        </table>
      </div>

      {showModal && (
        <UserForm
          closeModal={() => setShowModal(false)}
          loadUsers={loadUsers}
          selectedUser={selectedUser}
        />
      )}
    </div>
  );
};

export default UserList;
