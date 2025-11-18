import api from './api';

export const Schedule = {
  getAll: () => api.get('/api/schedules'),
  getById: (id) => api.get(`/api/schedules${id}`),
  create: (data) => api.post('/api/schedules', data),
  update: (id, data) => api.put(`/api/schedules${id}`, data),
  delete: (id) => api.delete(`/api/schedules${id}`)
};