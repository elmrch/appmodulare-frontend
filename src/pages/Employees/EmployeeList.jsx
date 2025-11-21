import React, { useState, useEffect } from "react";
import { employeeService } from "../../services/employeeService";
import EmployeeForm from "./EmployeeForm";

const EmployeeList = () => {
  const [employees, setEmployees] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const response = await employeeService.getAll();
      setEmployees(response.data);
    } catch (error) {
      console.error("Error al cargar empleados:", error);
      alert("Error al cargar empleados");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("¿Eliminar este empleado?")) {
      try {
        await employeeService.delete(id);
        alert("Empleado eliminado");
        loadEmployees();
      } catch (error) {
        console.error("Error:", error);
        alert("Error al eliminar empleado");
      }
    }
  };

  const handleEdit = (emp) => {
    setSelectedEmployee(emp);
    setShowModal(true);
  };

  const handleNew = () => {
    setSelectedEmployee(null);
    setShowModal(true);
  };

  const handleSave = () => {
    setShowModal(false);
    setSelectedEmployee(null);
    loadEmployees();
  };

  return (
    <div className="container mt-4">

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>👨‍💼 Gestión de Empleados</h2>
        <button className="btn btn-primary" onClick={handleNew}>
          ➕ Nuevo Empleado
        </button>
      </div>

      {/* Loading */}
      {loading && <div className="alert alert-info">Cargando empleados...</div>}

      {/* Table */}
      {!loading && (
        <table className="table table-striped table-bordered">
          <thead className="table-dark">
            <tr>
              <th>ID</th>
              <th>Nombre Completo</th>
              <th>DNI</th>
              <th>Email</th>
              <th>Teléfono</th>
              <th>Área</th>
              <th>Puesto</th>
              <th>Sueldo</th>
              <th>Horario</th>
              <th>Ingreso</th>
              <th>Foto</th>


              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {employees.length === 0 ? (
              <tr>
                <td colSpan="11" className="text-center">
                  No hay empleados registrados
                </td>
              </tr>
            ) : (
              employees.map((e) => (
                <tr key={e.id}>
                  <td>{e.id}</td>

                  <td>{e.firstName} {e.lastName}</td>
                  <td>{e.dni}</td>
                  <td>{e.email}</td>
                  <td>{e.phone}</td>

                  <td>{e.area ? e.area.name : "—"}</td>

                  <td>{e.position}</td>

                  <td>
                    {e.salary
                      ? "S/ " + parseFloat(e.salary).toFixed(2)
                      : "—"}
                  </td>

                  <td>
                    {e.schedule
                      ? `${e.schedule.startTime} - ${e.schedule.endTime}`
                      : "—"}
                  </td>

                  <td>
                    {e.hireDate
                      ? new Date(e.hireDate).toLocaleDateString()
                      : "—"}
                  </td>
<td>
  {e.photoUrl ? (
    <img 
      src={e.photoUrl} 
      alt="foto" 
      style={{ width: "45px", height: "45px", borderRadius: "50%", objectFit: "cover" }}
    />
  ) : (
    "—"
  )}
</td>

                  <td>
                    <button
                      className="btn btn-warning btn-sm me-2"
                      onClick={() => handleEdit(e)}
                    >
                      ✏️ Editar
                    </button>

                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(e.id)}
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
        <EmployeeForm
          employee={selectedEmployee}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default EmployeeList;
