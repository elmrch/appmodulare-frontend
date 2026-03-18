import React, { useState } from "react";
import "./loginadmin.css";
import { useNavigate } from "react-router-dom";
import { userService } from "../../services/userService";

const LoginAdmin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // ======= GENERAR PARTÍCULAS ANIMADAS =======
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    delay: `${Math.random() * 5}s`,
    duration: `${4 + Math.random() * 4}s`
  }));

  // =============================
  //      LOGIN COMPLETO
  // =============================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!username || !password) {
      setMessage("⚠ Debe completar todos los campos");
      setMessageType("error");
      return;
    }

    try {
      setLoading(true);

      await userService.login(username, password);

      if (userService.isAuthenticated()) {
        const cleanedUsername = username.includes("@")
          ? username.split("@")[0]
          : username;

        localStorage.setItem("username", cleanedUsername);
        localStorage.setItem("email", username);

        setMessage("✅ Inicio de sesión exitoso");
        setMessageType("success");

        setTimeout(() => navigate("/dashboard"), 900);
      } else {
        setMessage("❌ No se pudo iniciar sesión");
        setMessageType("error");
      }
    } catch (err) {
      console.error("Error en login:", err);
      setMessage("❌ Usuario o contraseña incorrectos");
      setMessageType("error");
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(""), 5000);
    }
  };

  return (
    <div className="attendance-wrapper vh-100 vw-100 d-flex justify-content-center align-items-center">

      {/* Fondo con partículas */}
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
          />
        ))}
      </div>

      {/* TARJETA GLASS */}
      <div className="card glass-card p-4" style={{ maxWidth: "450px", width: "100%" }}>

        {/* Logo */}
        <div className="text-center mb-3">
          <div className="logo-box mx-auto mb-2">
            <img
              src="/src/assets/img/image.png"
              alt="Logo"
              style={{ width: "160px", height: "50px", objectFit: "contain" }}
            />
          </div>

          <p className="text-cyan small mb-0">INGRESO ADMINISTRATIVO</p>
        </div>

        {/* FORMULARIO */}
        <form onSubmit={handleSubmit}>

          {/* Usuario */}
          <div className="mb-3">
            <label className="form-label text-white-70 small fw-semibold">Usuario</label>
            <div className="position-relative">
              <i className="bi bi-person input-icon"></i>
              <input
                type="text"
                className="form-control glass-input"
                placeholder="Ingrese su usuario o correo"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          {/* Contraseña */}
          <div className="mb-4">
            <label className="form-label text-white-70 small fw-semibold">Contraseña</label>
            <div className="position-relative">
              <i className="bi bi-lock input-icon"></i>
              <input
                type="password"
                className="form-control glass-input"
                placeholder="Ingrese su contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          {/* Botón */}
          <button
            type="submit"
            className="btn w-100 btn-submit-in text-white"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                VALIDANDO...
              </>
            ) : (
              <>
                <i className="bi bi-unlock me-2"></i>
                INICIAR SESIÓN
              </>
            )}
          </button>
        </form>

        {/* Mensaje del login */}
        {message && (
          <div
            className={`alert mt-3 text-center mb-0 ${
              messageType === "success"
                ? "alert-glass-success"
                : "alert-glass-error"
            }`}
          >
            {message}
          </div>
        )}

        <p className="text-center text-white-50 small mt-3 mb-0">
          © 2025 Modulare - Módulos Arequipa S.A.C.
        </p>
      </div>
    </div>
  );
};

export default LoginAdmin;
