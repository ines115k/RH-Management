import api from './axiosInstance';

export const recruitmentApi = {
  getOffers: (params) => api.get('/recruitment/offers/', { params }),
  getOfferById: (id) => api.get(`/recruitment/offers/${id}/`),
  createOffer: (data) => api.post('/recruitment/offers/', data),
  updateOffer: (id, data) => api.patch(`/recruitment/offers/${id}/`, data),
  deleteOffer: (id) => api.delete(`/recruitment/offers/${id}/`),
  getApplications: (params) => api.get('/recruitment/applications/', { params }),
  getApplicationById: (id) => api.get(`/recruitment/applications/${id}/`),
  createApplication: (data) => api.post('/recruitment/applications/', data),
  updateApplicationStatus: (id, data) => api.patch(`/recruitment/applications/${id}/`, data),
  deleteApplication: (id) => api.delete(`/recruitment/applications/${id}/`),
  uploadCV: (appId, file) => {
    const fd = new FormData(); fd.append('cv', file);
    return api.post(`/recruitment/applications/${appId}/upload-cv/`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  }
};