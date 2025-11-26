import api from "./api";

export const attendanceService = {
  getAll: () => api.get("/attendances"),

  delete: (id) => api.delete(`/attendances/${id}`),

  checkIn: (dni) => api.post("/attendances/check-in", { dni }),

  checkOut: (dni) => api.post("/attendances/check-out", { dni }),
};
