import api from './axiosInstance'

export const employeesApi = {
  getAll:      (params = {}) => api.get('/employees/', { params }),
  getStats:    ()            => api.get('/employees/stats/'),   // ← une seule fois, via api
  getById:     (id)          => api.get(`/employees/${id}/`),
  create:      (data)        => api.post('/employees/', data),
  update:      (id, data)    => api.patch(`/employees/${id}/`, data),
  delete:      (id)          => api.delete(`/employees/${id}/`),
  getHistory:  (id)          => api.get(`/employees/${id}/history/`),

  uploadPhoto: (id, file) => {
    const form = new FormData()
    form.append('photo', file)
    return api.post(`/employees/${id}/photo/`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}