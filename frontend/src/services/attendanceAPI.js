import api from './api';

export const attendanceAPI = {
  // Pointage entrée
  checkIn: async (notes = '') => {
    const response = await api.post('/attendance/check-in/', { notes });
    return response.data;
  },

  // Pointage sortie
  checkOut: async (notes = '') => {
    const response = await api.post('/attendance/check-out/', { notes });
    return response.data;
  },

  // Pointage du jour
  getTodayAttendance: async () => {
    const response = await api.get('/attendance/today/');
    return response.data;
  },

  // Historique des pointages
  getHistory: async (limit = 30) => {
    const response = await api.get(`/attendance/history/?limit=${limit}`);
    return response.data;
  },

  // Récupérer les absences pour un mois donné
  getAbsences: async (month, year) => {
    const response = await api.get(`/attendance/absences/?month=${month}&year=${year}`);
    return response.data;
  },
};