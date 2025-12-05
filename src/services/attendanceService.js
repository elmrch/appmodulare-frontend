import api from "./api";

export const attendanceService = {
  getAll: () => api.get("/attendances"),

  delete: (id) => api.delete(`/attendances/${id}`),

  // ========== CHECK-IN CON GPS ==========
  checkIn: (dni, latitude, longitude, location) => 
    api.post("/attendances/check-in", { 
      dni, 
      latitude, 
      longitude, 
      location 
    }),

  // ========== CHECK-OUT CON GPS ==========
  checkOut: (dni, latitude, longitude, location) => 
    api.post("/attendances/check-out", { 
      dni, 
      latitude, 
      longitude, 
      location 
    }),
};