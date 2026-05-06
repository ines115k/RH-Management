import api from './api';

export const recruitmentAPI = {
  // Récupérer toutes les offres d'emploi
  getOffers: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/recruitment/offers/${params ? `?${params}` : ''}`);
    return response.data;
  },

  // Récupérer une offre par son ID
  getOffer: async (id) => {
    const response = await api.get(`/recruitment/offers/${id}/`);
    return response.data;
  },

  // Postuler à une offre
  apply: async (formData) => {
    const response = await api.post('/recruitment/apply/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // Admin/Manager - Gérer les offres
  createOffer: async (offerData) => {
    const response = await api.post('/recruitment/manage/offers/', offerData);
    return response.data;
  },

  updateOffer: async (id, offerData) => {
    const response = await api.patch(`/recruitment/manage/offers/${id}/`, offerData);
    return response.data;
  },

  deleteOffer: async (id) => {
    const response = await api.delete(`/recruitment/manage/offers/${id}/`);
    return response.data;
  },

  // Admin/Manager - Voir les candidatures
  getApplications: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/recruitment/applications/${params ? `?${params}` : ''}`);
    return response.data;
  },

  getApplication: async (id) => {
    const response = await api.get(`/recruitment/applications/${id}/`);
    return response.data;
  },

  updateApplicationStatus: async (id, status, comments = '') => {
    const response = await api.patch(`/recruitment/applications/${id}/`, { status, comments });
    return response.data;
  },
};