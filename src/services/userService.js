import axios from "axios";
import { jwtDecode } from "jwt-decode"; // ← IMPORTAR

//const API_URL = "http://localhost:8080";
const API_URL = import.meta.env.VITE_API_URL;

const login = async (username, password) => {
  try {
    const response = await axios.post(`${API_URL}/login`, {
      username,
      password,
    });

    const token = response.data.access_token;

    if (!token) {
      throw new Error("No se recibió token del servidor");
    }

    // ========== DECODIFICAR EL TOKEN ==========
    const decoded = jwtDecode(token);
    console.log("🔓 Token decodificado:", decoded);
    
    // Extraer el rol (puede venir como "ADMIN,DBA" o "ADMIN")
    const role = decoded.role || decoded.roles || "user";
    
    // Si viene "ADMIN,DBA", tomar solo "ADMIN"
    const userRole = role.includes("ADMIN") ? "admin" : "user";
      const fullName = decoded.name || decoded.fullName || decoded.sub || username;

    
    // Guardar en localStorage
    localStorage.setItem("token", token);
    localStorage.setItem("username", decoded.sub || username); // 'sub' suele ser el username en JWT
    localStorage.setItem("email", decoded.email || username);
    localStorage.setItem("role", userRole);
        localStorage.setItem("fullName", fullName); // ✅ NUEVO

    
    console.log("✅ ROL GUARDADO:", userRole);
    // ==========================================

    return token;
  } catch (error) {
    localStorage.removeItem("token");
    
    const errorMessage = 
      error.response?.data?.message || 
      error.message || 
      "Error al iniciar sesión";
    
    throw new Error(errorMessage);
  }
};

const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("username");
  localStorage.removeItem("email");
  localStorage.removeItem("role");
};

const isAuthenticated = () => {
  return !!localStorage.getItem("token");
};

const getUserRole = () => {
  return localStorage.getItem("role") || "user";
};

const isAdmin = () => {
  return getUserRole() === "admin";
};

const getUserData = () => {
  return {
    username: localStorage.getItem("username"),
    email: localStorage.getItem("email"),
    role: localStorage.getItem("role"),
    token: localStorage.getItem("token"),
    fullName: localStorage.getItem("fullName") || localStorage.getItem("username") // ✅ NUEVO

  };
};

export const userService = {
  login,
  logout,
  isAuthenticated,
  getUserRole,
  isAdmin,
  getUserData,
};