import api from "./api";

export const reportService = {
  // Generar reporte de asistencias con filtros
  generateAttendanceReport: (filters) => 
    api.post("/api/reports/attendance", filters),

  // Obtener solo estadísticas
  getAttendanceStatistics: (filters) => 
    api.post("/api/reports/attendance/statistics", filters),
};