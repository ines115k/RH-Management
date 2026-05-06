import api from './axiosInstance'

export const attendanceApi = {
  // ── Pointage ────────────────────────────────────────────────────────────────
  checkIn:     (employee_id, note = '') =>
    api.post('/attendance/checkin/', { employee_id, note }),

  checkOut:    (employee_id, note = '') =>
    api.post(`/attendance/checkout/${employee_id}/`, { note }),

  getAll:      (params = {}) => api.get('/attendance/', { params }),
  getToday:    ()            => api.get('/attendance/today/'),
  getMyToday:  ()            => api.get('/attendance/my-today/'),
  getStats:    (params = {}) => api.get('/attendance/stats/', { params }),

  // ── Congés ──────────────────────────────────────────────────────────────────
  getLeaves:      (params = {}) => api.get('/attendance/leaves/', { params }),
  getLeaveSummary:(params = {}) => api.get('/attendance/leaves/summary/', { params }),
  createLeave:    (data)        => api.post('/attendance/leaves/', data),
  cancelLeave:    (id)          => api.delete(`/attendance/leaves/${id}/`),
  decideLeave:    (id, data)    => api.post(`/attendance/leaves/${id}/decision/`, data),
}