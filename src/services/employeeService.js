import api from "./api";

export const employeeService = {
  getAll: () => api.get("/employes"),
create: (data) => api.post("/employes", data),
update: (id, data) => api.put(`/employes/${id}`, data),
delete: (id) => api.delete(`/employes/${id}`),

};
