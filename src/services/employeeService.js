import api from "./api";

export const employeeService = {
  getAll: () => api.get("/employes"),
  create: (data) => api.post("/employes", data),
  update: (id, data) => api.put(`/employes/${id}`, data),
  delete: (id) => api.delete(`/employes/${id}`),
  uploadPhoto: (employeeId, photoFile) => {
    const formData = new FormData();
    formData.append('photo', photoFile);
    
    return api.post(`/employes/${employeeId}/photo`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

    generateQrCode: (employeeId) => api.post(`/employes/${employeeId}/generate-qr`),
  
  findByQrCode: (qrCode) => api.get(`/employes/qr/${qrCode}`),
  
  findByDniOrQr: (identifier) => api.get(`/employes/search/${identifier}`)
  

};
