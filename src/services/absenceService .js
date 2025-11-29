import api from "./api";

export const absenceService = {
  // Obtener ausencias (días no marcados)
  getAbsences: (filters) => api.post("/api/absences", filters),
};