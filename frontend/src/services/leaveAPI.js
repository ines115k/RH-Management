import api from './api';

export const leaveAPI = {
  // Créer une demande de congé
  createRequest: async (data) => {
    const response = await api.post('/leave/create/', data);
    return response.data;
  },

  // Mes demandes de congé
  getMyRequests: async () => {
    const response = await api.get('/leave/my-requests/');
    return response.data;
  },

  // Toutes les demandes (admin/manager)
  getAllRequests: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/leave/all/${params ? `?${params}` : ''}`);
    return response.data;
  },

  // Approuver/refuser une demande
  reviewRequest: async (id, status, rejectionReason = '') => {
    const response = await api.patch(`/leave/review/${id}/`, { status, rejection_reason: rejectionReason });
    return response.data;
  },

  // Statistiques des congés
  getStats: async () => {
    const response = await api.get('/leave/stats/');
    return response.data;
  },
};