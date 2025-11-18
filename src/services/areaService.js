import api from './api';

export const areaService = {
  getAll: () => api.get('/apiareas'),
  getById: (id) => api.get(`/apiareas/${id}`),
  create: (data) => api.post('/apiareas', data),
  update: (id, data) => api.put(`/apiareas/${id}`, data),
  delete: (id) => api.delete(`/apiareas/${id}`)
};