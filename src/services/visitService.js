import api from "./api";

export const visitService = {
  getAll: () => api.get("/visits"),

  delete: (id) => api.delete(`/visits/${id}`),


  checkIn: (visitData) => api.post("/visits/check-in", visitData),

  checkOut: (dni) => api.post("/visits/check-out", { dni }),
};
