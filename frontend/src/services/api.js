import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL + '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur pour gérer les erreurs 401 - Version corrigée
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Si erreur 401 et pas déjà en train de rafraîchir
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = localStorage.getItem('refresh_token');
      
      if (refreshToken) {
        try {
          // Tenter de rafraîchir le token
          const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
            refresh: refreshToken
          });
          
          const { access } = response.data;
          localStorage.setItem('access_token', access);
          
          // Réessayer la requête originale
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Rafraîchissement échoué -> déconnexion
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          // Ne pas rediriger automatiquement, juste retourner l'erreur
          return Promise.reject(error);
        }
      } else {
        // Pas de refresh token, juste retourner l'erreur sans redirection
        return Promise.reject(error);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
