import api from "./api";

export const scheduleService = {
  getAll: () => api.get("/api/schedules"),
  create: (data) => api.post("/api/schedules", data),

  update: (id, data) => api.put(`/api/schedules/${id}`, data),

  delete: (id) => api.delete(`/api/schedules/${id}`),
};
