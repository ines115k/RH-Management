import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: { 'Content-Type': 'application/json' },
})

// ── Clés localStorage — DOIVENT correspondre à TOKEN_KEYS dans AuthContext ────
const KEYS = { access: 'access_token', refresh: 'refresh_token' }

// ── Injecter le token sur chaque requête ──────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(KEYS.access)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Rafraîchir le token automatiquement si 401 ────────────────────────────────
let isRefreshing = false
let failedQueue  = []

const processQueue = (error, token = null) => {
  failedQueue.forEach((p) => error ? p.reject(error) : p.resolve(token))
  failedQueue = []
}

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config

    if (err.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`
          return api(original)
        })
      }

      original._retry = true
      isRefreshing    = true

      const refresh = localStorage.getItem(KEYS.refresh)
      if (!refresh) {
        isRefreshing = false
        localStorage.clear()
        window.location.href = '/login'
        return Promise.reject(err)
      }

      try {
        const { data } = await axios.post(
          'http://localhost:8000/api/auth/token/refresh/',
          { refresh }
        )
        localStorage.setItem(KEYS.access, data.access)
        api.defaults.headers.Authorization = `Bearer ${data.access}`
        processQueue(null, data.access)
        original.headers.Authorization = `Bearer ${data.access}`
        return api(original)
      } catch (refreshErr) {
        processQueue(refreshErr, null)
        localStorage.clear()
        window.location.href = '/login'
        return Promise.reject(refreshErr)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(err)
  }
)

export default api