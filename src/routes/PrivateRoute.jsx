import React from "react";
import { Navigate } from "react-router-dom";

const PrivateRoute = ({ children }) => {
  // Verificar si hay token en localStorage
  const token = localStorage.getItem("token");

  // Si no hay token, redirigir al login
  if (!token) {
    return <Navigate to="/login-admin" replace />;
  }

  // Si hay token, renderizar el contenido protegido
  return children;
};

export default PrivateRoute;