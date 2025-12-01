import React, { useState, useEffect } from "react";
import { attendanceService } from "../../services/attendanceService";
import { Link, useNavigate } from "react-router-dom";   // ← AGREGADO useNavigate

import "./login.css";

const AttendanceForm = () => {
    const navigate = useNavigate();   // ← AGREGADO navigate

  const [dni, setDni] = useState("");
  const [type, setType] = useState("in");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(false);
  const [dateTime, setDateTime] = useState({ date: "", time: "" });

  // ⏰ Reloj en tiempo real
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setDateTime({
        date: now.toLocaleDateString("es-PE", { 
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
        }),
        time: now.toLocaleTimeString("es-PE")
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const validateDNI = () => {
    if (!dni) return "Debe ingresar su DNI.";
    if (!/^[0-9]+$/.test(dni)) return "El DNI solo debe contener números.";
    if (dni.length !== 8) return "El DNI debe tener 8 dígitos.";
    return null;
  };

  const handleDniChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    setDni(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const error = validateDNI();
    if (error) {
      setMessage(error);
      setMessageType("error");
      setTimeout(() => setMessage(""), 5000);
      return;
    }

    try {
      setLoading(true);
      let response;

      if (type === "in") {
        response = await attendanceService.checkIn(dni);
        setMessage(`✅ Entrada registrada`);
        setMessageType("success");
      } else {
        response = await attendanceService.checkOut(dni);
        setMessage(`✅ Salida registrada `);
        setMessageType("success");
      }
      setDni("");
    } catch (error) {
      console.error(error);
      if (error.response) {
        const data = error.response.data;
        if (typeof data === "string") {
          setMessage("❌ " + data);
        } else if (data && data.message) {
          setMessage("❌ " + data.message);
        } else {
          setMessage("❌ Ocurrió un error inesperado en el servidor.");
        }
      } else {
        setMessage("❌ No se pudo conectar con el servidor.");
      }
      setMessageType("error");
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(""), 5000);
    }
  };

  // Generar partículas decorativas
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    delay: `${Math.random() * 5}s`,
    duration: `${4 + Math.random() * 4}s`
  }));

  return (
    <div className="attendance-wrapper vh-100 vw-100 d-flex justify-content-center align-items-center">
      
      {/* Partículas animadas de fondo */}
      <div className="particles">
        {particles.map(p => (
          <div 
            key={p.id} 
            className="particle"
            style={{ 
              left: p.left, 
              top: p.top, 
              animationDelay: p.delay,
              animationDuration: p.duration 
            }}
          />
        ))}
      </div>

      {/* Tarjeta principal */}
      <div className="card glass-card p-4" style={{ maxWidth: "450px", width: "100%" }}>
        
        {/* Logo */}
        <div className="text-center mb-3">
<div className="logo-box mx-auto mb-3">
  <img
    src="/src/assets/img/image.png"
    alt="Logo"
    style={{
      width: "160px",
      height: "50px",
      objectFit: "contain"
    }}

  />
</div>

         { /*<h4 className="text-white fw-bold mb-1">MODULARE</h4>*/}
          <p className="text-cyan small mb-0">REGISTRA TU ASISTENCIA</p>
        </div>

        {/* Fecha y Hora */}
        <div className="time-box text-center p-3 mb-4">
          <div className="time-text">{dateTime.time || "00:00:00"}</div>
          <div className="text-white-50 small text-capitalize">{dateTime.date || "Cargando..."}</div>
        </div>

        <form onSubmit={handleSubmit}>
          
          {/* Botones Entrada / Salida */}
          <div className="row g-3 mb-4">
            <div className="col-6">
              <button
                type="button"
                className={`btn btn-type w-100 ${type === "in" ? "active-in" : ""}`}
                onClick={() => setType("in")}
                disabled={loading}
              >
                <i className="bi bi-box-arrow-in-right me-2"></i>
                ENTRADA
              </button>
            </div>
            <div className="col-6">
              <button
                type="button"
                className={`btn btn-type w-100 ${type === "out" ? "active-out" : ""}`}
                onClick={() => setType("out")}
                disabled={loading}
              >
                <i className="bi bi-box-arrow-right me-2"></i>
                SALIDA
              </button>
            </div>
          </div>

          {/* Input DNI */}
          <div className="mb-4">
            <label className="form-label text-white-70 fw-semibold small">
              Ingrese su DNI
            </label>
            <div className="position-relative">
              <i className="bi bi-person-badge input-icon"></i>
              <input
                type="text"
                className="form-control glass-input"
                value={dni}
                onChange={handleDniChange}
                placeholder="Ingrese 8 dígitos"
                maxLength={8}
                disabled={loading}
              />
              {dni.length > 0 && (
                <span className={`dni-counter ${dni.length === 8 ? "text-success" : "text-white-50"}`}>
                  {dni.length}/8
                </span>
              )}
            </div>
          </div>

          {/* Botón Submit */}
          <button
            type="submit"
            className={`btn w-100 text-white ${type === "in" ? "btn-submit-in" : "btn-submit-out"}`}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                PROCESANDO...
              </>
            ) : (
              <>
                <i className={`bi ${type === "in" ? "bi-check-circle" : "bi-door-open"} me-2`}></i>
                REGISTRAR {type === "in" ? "ENTRADA" : "SALIDA"}
              </>
            )}
          </button>
        </form>

        {/* Mensajes de alerta */}
        {message && (
          <div className={`alert mt-3 text-center mb-0 ${
            messageType === "success" ? "alert-glass-success" : "alert-glass-error"
          }`}>
            {message}
          </div>
        )}

        {/* Link al Dashboard */}
     <button
        className="btn btn-secondary mt-2"
        onClick={() => navigate("/login-admin")}   // ← YA FUNCIONA
      >
        Ir al Dashboard
      </button>

        {/* Footer */}
        <p className="text-center text-white-50 small mt-3 mb-0">
          © 2025 Modulare - Módulos Arequipa S.A.C.
        </p>
      </div>
    </div>
  );
};

export default AttendanceForm;