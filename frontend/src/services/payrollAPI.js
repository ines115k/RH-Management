import api from './api';

export const payrollAPI = {
  // Récupérer mes fiches de paie
  getMyPayslips: async () => {
    const response = await api.get('/payroll/my-payslips/');
    return response.data.records || [];
  },

  // Générer une fiche de paie
  generatePayslip: async (month, year) => {
    // Utiliser POST sur l'endpoint principal
    const response = await api.post('/payroll/', { month, year });
    return response.data;
  },

  getPayslip: async (id) => {
    const response = await api.get(`/payroll/${id}/`);
    return response.data;
  },
};