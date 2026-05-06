import api from './axiosInstance';

const getAll = (params) => api.get('/payroll/', { params });
const getById = (id) => api.get(`/payroll/${id}/`);
const generate = (data) => api.post('/payroll/', data);
const updateStatus = (id, action) => api.patch(`/payroll/${id}/`, { action });
const deleteSlip = (id) => api.delete(`/payroll/${id}/`);

export const payrollApi = {
  getAll,
  getById,
  generate,
  updateStatus,
  deleteSlip,
};