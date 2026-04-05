import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  timeout: 15000,
})

// Attach JWT token to every request if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('dg_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// On 401: clear stored token so protected routes redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('dg_token')
      localStorage.removeItem('dg_user')
    }
    return Promise.reject(err)
  }
)

export default api
