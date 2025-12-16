import React, { useState, useEffect, useRef } from "react";
import { attendanceService } from "../../services/attendanceService";
import { Link, useNavigate } from "react-router-dom";
import { Html5QrcodeScanner } from "html5-qrcode";
import "./login.css";
const AttendanceForm = () => {
    const navigate = useNavigate();   // ← AGREGADO navigate

  const [dni, setDni] = useState("");
  const [type, setType] = useState("in");
    const [showScanner, setShowScanner] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(false);
  const [dateTime, setDateTime] = useState({ date: "", time: "" });
  const scannerRef = useRef(null);


  // ⏰ Reloj en tiempo real
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

// 📸 Inicializar scanner cuando se abre
useEffect(() => {
  if (showScanner && !scannerRef.current) {
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { 
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      },
      false
    );

    scanner.render(onScanSuccess, onScanError);
    scannerRef.current = scanner;
  }

  return () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(console.error);
      scannerRef.current = null;
    }
  };
}, [showScanner]);
const onScanSuccess = async (decodedText) => {
  console.log("QR escaneado:", decodedText);
  
  try {
    setLoading(true);
    setShowScanner(false);
    
    if (scannerRef.current) {
      scannerRef.current.clear();
      scannerRef.current = null;
    }
    
    let gps = null;
    try {
      gps = await getGPSLocation();
    } catch (gpsError) {
      console.warn("⚠️ No se pudo obtener GPS:", gpsError);
    }

    let response;
    
    if (type === "in") {
      response = await attendanceService.checkIn(
        decodedText,  // ← QR, NO DNI
        gps?.latitude,
        gps?.longitude,
        "QR Scan"
      );
      
      if (response.data.success) {
        setMessage(`✅ Entrada registrada con QR`);
        setMessageType("success");
      }
    } else {
      response = await attendanceService.checkOut(
        decodedText,
        gps?.latitude,
        gps?.longitude,
        "QR Scan"
      );
      setMessage(`✅ Salida registrada con QR`);
      setMessageType("success");
    }
    
  } catch (error) {
    console.error(error);
    setMessage("❌ Error al registrar con QR");
    setMessageType("error");
  } finally {
    setLoading(false);
    setTimeout(() => setMessage(""), 5000);
  }
};

const onScanError = (error) => {
  // No mostrar errores normales de escaneo
  if (!error.includes("NotFoundException")) {
    console.warn("Scanner error:", error);
  }
};

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
    
    // ========== CAPTURAR GPS ==========
    let gps = null;
    try {
      gps = await getGPSLocation();
      console.log("📍 GPS capturado:", gps.latitude, gps.longitude);
    } catch (gpsError) {
      console.warn("⚠️ No se pudo obtener GPS:", gpsError);
      // Continúa sin GPS (opcional: puedes mostrar advertencia)
    }

    let response;

    if (type === "in") {
      response = await attendanceService.checkIn(
        dni,
        gps?.latitude,      // ← GPS ENTRADA
        gps?.longitude,     // ← GPS ENTRADA
        "Login Web"         // ← DESCRIPCIÓN
      );
      
      // Mostrar mensaje con validación de ubicación
      if (response.data.success) {
        const locationMsg = response.data.locationValid 
          ? `📍 ${response.data.distance}`
          : `⚠️ Fuera de ubicación (${response.data.distance})`;
        
        setMessage(`✅ Entrada registrada\n${locationMsg}`);
        setMessageType("success");
      }
      
    } else {
      response = await attendanceService.checkOut(
        dni,
        gps?.latitude,      // ← GPS SALIDA
        gps?.longitude,     // ← GPS SALIDA
        "Login Web"         // ← DESCRIPCIÓN
      );
      
      setMessage(`✅ Salida registrada`);
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
// ========== CAPTURA GPS AUTOMÁTICAMENTE ==========
const getGPSLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject("Tu navegador no soporta GPS");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        reject("No se pudo obtener tu ubicación. Activa el GPS.");
      },
      {
        enableHighAccuracy: false, // Cambiado a false para una respuesta más rápida
        timeout: 5000,             // Reducido el tiempo de espera a 5 segundos
        maximumAge: 60000          // Acepta una ubicación en caché de hasta 1 minuto
      }
    );
  });
};
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
{/* Botón para abrir cámara QR */}
          <button
            type="button"
            className="btn btn-outline-light w-100 mb-3"
            onClick={() => setShowScanner(!showScanner)}
            disabled={loading}
          >
            <i className="bi bi-camera me-2"></i>
            {showScanner ? "CERRAR CÁMARA" : "ESCANEAR QR"}
          </button>

          {/* Modal Scanner QR */}
          {showScanner && (
            <div className="qr-scanner-container mb-3">
              <div className="scanner-box">
                <div id="qr-reader" style={{ width: '100%' }}></div>
                
                <button
                  className="btn btn-sm btn-danger mt-2 w-100"
                  onClick={() => {
                    if (scannerRef.current) {
                      scannerRef.current.clear();
                      scannerRef.current = null;
                    }
                    setShowScanner(false);
                  }}
                >
                  <i className="bi bi-x-circle me-2"></i>
                  Cerrar Cámara
                </button>
              </div>
            </div>
          )}

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
          className="btn btn-secondary mt-2 w-100"
          onClick={() => navigate("/login-admin")}
        >
          <i className="bi bi-speedometer2 me-2"></i>
          Ir al Dashboard
        </button>

        <button
          className="btn btn-secondary mt-2 w-100"
          onClick={() => navigate("/Visit-Login")}
        >
          <i className="bi bi-people me-2"></i>
          Visitantes
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