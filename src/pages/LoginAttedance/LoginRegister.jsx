import React, { useState } from "react";
import { attendanceService } from "../../services/attendanceService"; // Servicio que conectará a tu backend

const AttendanceForm = () => {
  const [dni, setDni] = useState("");
  const [type, setType] = useState("in"); // 'in' = entrada, 'out' = salida
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!dni) {
      setMessage("Por favor ingrese su DNI");
      return;
    }

    try {
      let response;
      if (type === "in") {
        response = await attendanceService.checkIn(dni);
        setMessage(`✅ Su entrada se ha registrado a las ${response.timeIn}`);
      } else {
        response = await attendanceService.checkOut(dni);
        setMessage(`✅ Su salida se ha registrado a las ${response.timeOut}. Total horas: ${response.hoursWorked}`);
      }
      setDni(""); // Limpiar input
    } catch (error) {
      console.error(error);
      setMessage("❌ DNI no encontrado o error al registrar");
    }
  };

  return (
    <div className="container mt-5">
      <h2>Registro de Asistencia</h2>

      <form onSubmit={handleSubmit} className="mt-4">
        <div className="mb-3">
          <label className="form-label">Seleccione Entrada o Salida</label>
          <select
            className="form-select"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="in">Entrada</option>
            <option value="out">Salida</option>
          </select>
        </div>

        <div className="mb-3">
          <label className="form-label">Ingrese su DNI</label>
          <input
            type="text"
            className="form-control"
            value={dni}
            onChange={(e) => setDni(e.target.value)}
            placeholder="Ej: 12345678"
          />
        </div>

        <button type="submit" className="btn btn-primary">
          Registrar
        </button>
      </form>

      {message && (
        <div className="alert alert-info mt-3" role="alert">
          {message}
        </div>
      )}
    </div>
  );
};

export default AttendanceForm;
