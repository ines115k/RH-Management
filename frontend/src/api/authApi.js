import api from './axiosInstance'

export const authApi = {
  // login(email, password) → POST /auth/login/ { email, password }
  login:          (email, password) => api.post('/auth/login/', { email, password }),
  logout:         (refresh)         => api.post('/auth/logout/', { refresh }),
  register:       (data)            => api.post('/auth/register/', data),
  getProfile:     ()                => api.get('/auth/profile/'),
  updateProfile:  (data)            => api.patch('/auth/profile/', data),
  changePassword: (data)            => api.post('/auth/change-password/', data),
  refreshToken:   (refresh)         => api.post('/auth/token/refresh/', { refresh }),

  // Gestion des utilisateurs (admin seulement)
  getUsers:  ()          => api.get('/auth/users/'),
  getUser:   (id)        => api.get(`/auth/users/${id}/`),
  updateUser:(id, data)  => api.patch(`/auth/users/${id}/`, data),
  deleteUser:(id)        => api.delete(`/auth/users/${id}/`),
}