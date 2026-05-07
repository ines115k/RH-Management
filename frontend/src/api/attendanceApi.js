import api from './axiosInstance'

export const attendanceApi = {
  // ── Pointage ────────────────────────────────────────────────────────────────
// ── Pointage pour l'employé connecté (sans passer employee_id) ──
checkInSelf: (note = '') => api.post('/attendance/checkin/self/', { note }),
checkOutSelf: (note = '') => api.post('/attendance/checkout/self/', { note }),

// ── Pointage pour admin/manager (nécessite employee_id) ──
checkIn:   (employee_id, note = '') => api.post('/attendance/checkin/', { employee_id, note }),
checkOut:  (employee_id, note = '') => api.post(`/attendance/checkout/${employee_id}/`, { note }),

  getAll:      (params = {}) => api.get('/attendance/', { params }),
  getToday:    ()            => api.get('/attendance/today/'),
  getMyToday:  ()            => api.get('/attendance/my-today/'),
  getStats:    (params = {}) => api.get('/attendance/stats/', { params }),
  getHistory: async (limit = 30) => {
    const response = await api.get(`/attendance/history/?limit=${limit}`);
    return response.data;
},
  // ── Congés ──────────────────────────────────────────────────────────────────
  getLeaves:      (params = {}) => api.get('/attendance/leaves/', { params }),
  getLeaveSummary:(params = {}) => api.get('/attendance/leaves/summary/', { params }),
  createLeave:    (data)        => api.post('/attendance/leaves/', data),
  cancelLeave:    (id)          => api.delete(`/attendance/leaves/${id}/`),
  decideLeave:    (id, data)    => api.post(`/attendance/leaves/${id}/decision/`, data),
}