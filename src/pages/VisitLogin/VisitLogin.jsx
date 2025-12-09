    import React, { useState, useEffect } from "react";
    import { visitService } from "../../services/visitService";
    import { useNavigate } from "react-router-dom";
    import "./visit.css";

    const VisitLogin = () => {
    const navigate = useNavigate();

    const [dni, setDni] = useState("");
    const [fullName, setFullName] = useState("");
    const [company, setCompany] = useState("");
    const [reason, setReason] = useState("");

    const [type, setType] = useState("in");
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");
    const [loading, setLoading] = useState(false);
    const [dateTime, setDateTime] = useState({ date: "", time: "" });

    useEffect(() => {
        const interval = setInterval(() => {
        const now = new Date();
        setDateTime({
            date: now.toLocaleDateString("es-PE", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            }),
            time: now.toLocaleTimeString("es-PE"),
        });
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const validateDNI = () => {
        if (!dni) return "Debe ingresar el DNI.";
        if (!/^[0-9]+$/.test(dni)) return "El DNI solo debe contener números.";
        if (dni.length !== 8) return "El DNI debe tener 8 dígitos.";
        return null;
    };

    const handleDniChange = (e) => {
        const value = e.target.value.replace(/\D/g, "");
        setDni(value);
    };

const handleSubmit = async (e) => {
  e.preventDefault();
  setMessage("");
  setMessageType("");
  setLoading(true);

  const dniError = validateDNI();
  if (dniError) {
    setMessage(dniError);
    setMessageType("error");
    setLoading(false);
    return;
  }

  // ✅ VALIDACIÓN PARA INGRESO
  if (type === "in") {
    if (!fullName.trim()) {
      setMessage("❌ Debe ingresar el nombre completo");
      setMessageType("error");
      setLoading(false);
      return;
    }
    if (!company.trim()) {
      setMessage("❌ Debe ingresar la empresa");
      setMessageType("error");
      setLoading(false);
      return;
    }
    if (!reason.trim()) {
      setMessage("❌ Debe ingresar el motivo de visita");
      setMessageType("error");
      setLoading(false);
      return;
    }
  }

  try {
    let response;

if (type === "in") {
  const visitData = {
    fullName: fullName.trim(),
    dni: dni.trim(),
    company: company.trim(),
    reason: reason.trim()
  };

  console.log("📤 Enviando datos:", visitData);

  // ✅ CAMBIAR registerVisit por checkIn
  response = await visitService.checkIn(visitData);
  
  console.log("✅ Respuesta del servidor:", response);

  setMessage("✅ Ingreso del visitante registrado");
  setMessageType("success");

      // ✅ LIMPIAR FORMULARIO DESPUÉS DEL ÉXITO
      setTimeout(() => {
        setDni("");
        setFullName("");
        setCompany("");
        setReason("");
      }, 2000);

    } else {
      response = await visitService.checkOut(dni);
      setMessage("✅ Salida del visitante registrada");
      setMessageType("success");

      setFullName("");
      setCompany("");
      setReason("");
    }
  } catch (error) {
    // ✅ MOSTRAR ERROR DETALLADO
    console.error("❌ Error completo:", error);
    console.error("📋 Respuesta del servidor:", error.response?.data);
    
    const errorMsg = error.response?.data?.message || 
                     error.response?.data?.error || 
                     "Ocurrió un error. Verifique los datos.";
    
    setMessage(`❌ ${errorMsg}`);
    setMessageType("error");
  }

  setLoading(false);
};

    const particles = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        delay: `${Math.random() * 5}s`,
        duration: `${4 + Math.random() * 4}s`,
    }));

    return (
        <div className="attendance-wrapper vh-100 vw-100 d-flex justify-content-center align-items-center">
        <div className="particles">
            {particles.map((p) => (
            <div
                key={p.id}
                className="particle"
                style={{
                left: p.left,
                top: p.top,
                animationDelay: p.delay,
                animationDuration: p.duration,
                }}
            ></div>
            ))}
        </div>

        <div className="card glass-card p-4" style={{ maxWidth: "450px", width: "100%" }}>
            <div className="text-center mb-3">
            <img
                src="/src/assets/img/image.png"
                alt="Logo"
                style={{ width: "160px", height: "50px", objectFit: "contain" }}
            />
            <p className="text-cyan small mb-0">REGISTRA TU VISITA</p>
            </div>

            <div className="time-box text-center p-3 mb-4">
            <div className="time-text">{dateTime.time || "00:00:00"}</div>
            <div className="text-white-50 small text-capitalize">
                {dateTime.date || "Cargando..."}
            </div>
            </div>

            <form onSubmit={handleSubmit}>
            {/* BOTONES ENTRADA / SALIDA */}
            <div className="row g-3 mb-4">
                <div className="col-6">
                <button
                    type="button"
                    className={`btn btn-type w-100 ${type === "in" ? "active-in" : ""}`}
                    onClick={() => setType("in")}
                    disabled={loading}
                >
                    <i className="bi bi-box-arrow-in-right me-2"></i> INGRESO
                </button>
                </div>

                <div className="col-6">
                <button
                    type="button"
                    className={`btn btn-type w-100 ${type === "out" ? "active-out" : ""}`}
                    onClick={() => setType("out")}
                    disabled={loading}
                >
                    <i className="bi bi-box-arrow-right me-2"></i> SALIDA
                </button>
                </div>
            </div>

            {/* DNI */}
            <div className="mb-4">
                <label className="form-label text-white-70 fw-semibold small">
                DNI del Visitante
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
                    <span
                    className={`dni-counter ${
                        dni.length === 8 ? "text-success" : "text-white-50"
                    }`}
                    >
                    {dni.length}/8
                    </span>
                )}
                </div>
            </div>
            
            {/* CAMPOS SOLO PARA INGRESO */}
            {type === 'in' && (
              <>
                {/* Nombre */}
                <div className="mb-4">
                    <label className="form-label text-white-70 fw-semibold small">Nombre Completo</label>
                    <input
                    type="text"
                    className="form-control glass-input"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ingrese nombre completo"
                    disabled={loading}
                    />
                </div>

                {/* Empresa */}
                <div className="mb-4">
                    <label className="form-label text-white-70 fw-semibold small">Empresa</label>
                    <input
                    type="text"
                    className="form-control glass-input"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Ej: MODULARE"
                    disabled={loading}
                    />
                </div>

                {/* Motivo */}
                <div className="mb-4">
                    <label className="form-label text-white-70 fw-semibold small">Motivo</label>
                    <input
                    type="text"
                    className="form-control glass-input"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Reunión, entrega, consulta..."
                    disabled={loading}
                    />
                </div>
              </>
            )}

            {/* BOTÓN SUBMIT */}
            <button
                type="submit"
                className={`btn w-100 text-white ${
                type === "in" ? "btn-submit-in" : "btn-submit-out"
                }`}
                disabled={loading}
            >
                {loading ? (
                <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    PROCESANDO...
                </>
                ) : (
                <>
                    <i
                    className={`bi ${
                        type === "in" ? "bi-check-circle" : "bi-door-open"
                    } me-2`}
                    ></i>
                    REGISTRAR {type === "in" ? "INGRESO" : "SALIDA"}
                </>
                )}
            </button>
            </form>

            {message && (
            <div
                className={`alert mt-3 text-center mb-0 ${
                messageType === "success" ? "alert-glass-success" : "alert-glass-error"
                }`}
            >
                {message}
            </div>
            )}

            <button
            className="btn btn-secondary mt-2"
            onClick={() => navigate("/login-admin")}
            >
            Ir al Dashboard
            </button>

            <p className="text-center text-white-50 small mt-3 mb-0">
            © 2025 Modulare - Módulos Arequipa S.A.C.
            </p>
        </div>
        </div>
    );
    };

    export default VisitLogin;
