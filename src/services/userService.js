import axios from "axios";

const API_URL = "http://localhost:8080";

const login = async (username, password) => {
  try {
    const response = await axios.post(`${API_URL}/login`, {
      username,
      password,
    });

    // El backend devuelve: { access_token: "..." }
    const token = response.data.access_token;

    // Verificar que realmente llegó un token
    if (!token) {
      throw new Error("No se recibió token del servidor");
    }

    // Guardar token en localStorage
    localStorage.setItem("token", token);

    return token;
  } catch (error) {
    // Limpiar cualquier token previo en caso de error
    localStorage.removeItem("token");
    
    // Relanzar el error con un mensaje más claro
    const errorMessage = 
      error.response?.data?.message || 
      error.message || 
      "Error al iniciar sesión";
    
    throw new Error(errorMessage);
  }
};

const logout = () => {
  localStorage.removeItem("token");
};

const isAuthenticated = () => {
  return !!localStorage.getItem("token");
};

// Exportar el objeto userService
export const userService = {
  login,
  logout,
  isAuthenticated,
};