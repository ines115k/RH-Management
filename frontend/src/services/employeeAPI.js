import api from './api';

export const employeeAPI = {
  // Récupérer les informations de l'employé connecté
  getMyInfo: async () => {
    const response = await api.get('/employees/me/');
    return response.data;
  },

  // Récupérer tous les employés (admin seulement)
  getAllEmployees: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/employees/${params ? `?${params}` : ''}`);
    return response.data;
  },

  // Récupérer un employé par ID
  getEmployeeById: async (id) => {
    const response = await api.get(`/employees/${id}/`);
    return response.data;
  },

  // Créer un employé (admin/manager)
  createEmployee: async (employeeData) => {
    const response = await api.post('/employees/', employeeData);
    return response.data;
  },

  // Modifier un employé (admin/manager)
  updateEmployee: async (id, employeeData) => {
    const response = await api.patch(`/employees/${id}/`, employeeData);
    return response.data;
  },

  // Supprimer un employé (admin)
  deleteEmployee: async (id) => {
    const response = await api.delete(`/employees/${id}/`);
    return response.data;
  },

  // Upload photo
  uploadPhoto: async (id, file) => {
    const formData = new FormData();
    formData.append('photo', file);
    const response = await api.post(`/employees/${id}/photo/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },
};