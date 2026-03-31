import api from './axiosInstance'

export const authApi = {
  login:          (data)      => api.post('/auth/login/', data),
  register:       (data)      => api.post('/auth/register/', data),
  logout:         (refresh)   => api.post('/auth/logout/', { refresh }),
  getProfile:     ()          => api.get('/auth/profile/'),
  updateProfile:  (data)      => api.patch('/auth/profile/', data),
  changePassword: (data)      => api.post('/auth/change-password/', data),
  getUsers:       ()          => api.get('/auth/users/'),
}