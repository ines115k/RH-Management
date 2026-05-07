import api from './axiosInstance'

export const leaveAPI = {
  // ── Employé — ses propres demandes ─────────────────────────────────────────
  getMyRequests: () =>
    api.get('/leave/my-requests/').then(r => r.data),

  createRequest: (data) =>
    api.post('/leave/create/', data).then(r => r.data),

  cancelRequest: (id) =>
    api.delete(`/leave/${id}/cancel/`).then(r => r.data),

  // ── Calendrier / Admin ─────────────────────────────────────────────────────
  getAllRequests: (params = {}) =>
    api.get('/leave/all/', { params }).then(r => r.data),

  // ── Admin/Manager — décision ───────────────────────────────────────────────
  decideRequest: (id, decision, rejection_reason = '') =>
    api.post(`/leave/${id}/decision/`, { decision, rejection_reason }).then(r => r.data),

  // ── Stats ──────────────────────────────────────────────────────────────────
  getStats: (params = {}) =>
    api.get('/leave/stats/', { params }).then(r => r.data),

  getSummary: (params = {}) =>
    api.get('/leave/summary/', { params }).then(r => r.data),
}