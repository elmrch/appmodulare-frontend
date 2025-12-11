import api from "./api";

export const rolesService = {
  getAll: () => api.get("/users"),
  create: (data) => api.post("/users", data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`)
};
