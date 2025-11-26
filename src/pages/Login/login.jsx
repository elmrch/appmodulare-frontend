import React, { useState } from "react";
import { loginService } from "../../services/userService";

const  login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const token = await loginService(username, password);
      setMessage("Login correcto ✔");
      console.log("TOKEN:", token);
    } catch (error) {
      setMessage("Credenciales incorrectas ❌");
    }
  };

  return (
    <div>
      <h2>Iniciar sesión</h2>

      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="Correo"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button type="submit">Ingresar</button>
      </form>

      <p>{message}</p>
    </div>
  );
};

export default login;
