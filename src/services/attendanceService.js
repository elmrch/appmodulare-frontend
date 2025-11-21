import axios from "axios";

const API_URL = "http://localhost:8080/attendances";

export const attendanceService = {

  getAll: async () => {
    const response = await axios.get(API_URL);
    return response.data;
  },
delete: async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`);
  return response.data;
},



  checkIn: async (dni) => {
    const response = await axios.post(`${API_URL}/check-in`, { dni });
    return response.data;
  },

  checkOut: async (dni) => {
    const response = await axios.post(`${API_URL}/check-out`, { dni });
    return response.data;
  },
};
