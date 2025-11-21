import React, { useState, useEffect } from "react";
import { attendanceService } from "../../services/attendanceService";

const AttendanceList = () => {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAttendance();
  }, []);

const loadAttendance = async () => {
  setLoading(true);
  try {
    const res = await attendanceService.getAll();
    setAttendance(res);   // <── AQUÍ ESTABA EL ERROR
  } catch (error) {
    console.error("Error al cargar asistencias:", error);
    alert("Error al cargar asistencias");
  } finally {
    setLoading(false);
  }
};


  const handleDelete = async (id) => {
    if (window.confirm("¿Eliminar este registro de asistencia?")) {
      try {
        await attendanceService.delete(id);
        alert("Asistencia eliminada");
        loadAttendance();
      } catch (error) {
        console.error("Error:", error);
        alert("Error al eliminar asistencia");
      }
    }
  };

  return (
    <div className="container mt-4">

      <h2>📅 Gestión de Asistencias</h2>

      {loading && <div className="alert alert-info">Cargando asistencias...</div>}

      {!loading && (
        <table className="table table-striped table-bordered">
          <thead className="table-dark">
            <tr>
              <th>ID</th>
              <th>Empleado</th>
              <th>DNI</th>
              <th>Fecha</th>
              <th>Entrada</th>
              <th>Salida</th>
              <th>Horas</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {attendance.length === 0 ? (
              <tr>
                <td colSpan="9" className="text-center">
                  No hay registros para esta fecha
                </td>
              </tr>
            ) : (
              attendance.map((a) => (
                <tr key={a.id}>
                  <td>{a.id}</td>

                  {/* Empleado */}
                  <td>{a.firstName} {a.lastName}</td>

                  {/* DNI */}
                  <td>{a.dni}</td>

                  {/* Fecha */}
                  <td>{a.date}</td>

                  {/* Entrada */}
                  <td>
                    {a.checkIn
                      ? new Date(a.checkIn).toLocaleTimeString()
                      : "—"}
                  </td>

                  {/* Salida */}
                  <td>
                    {a.checkOut
                      ? new Date(a.checkOut).toLocaleTimeString()
                      : "—"}
                  </td>

                  {/* Horas */}
                  <td>{a.totalHours ?? "—"}</td>

                  {/* Estado */}
                  <td>{a.status}</td>

                  {/* Acciones */}
                  <td>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(a.id)}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}

    </div>
  );
};

export default AttendanceList;
