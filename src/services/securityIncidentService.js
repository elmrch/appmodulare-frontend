import api from "./api";

export const securityIncidentService = {
  getAll: () => api.get("/securitys"),
create: (data) => api.post("/securitys", data),
update: (id, data) => api.put(`/securitys/${id}`, data),

delete: (id) => api.delete(`/securitys/${id}`),

};
