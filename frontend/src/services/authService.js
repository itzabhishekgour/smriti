import api from './api'

export const authService = {
  register: (data) => api.post('/auth/register', data).then(r => r.data.data),
  login:    (data) => api.post('/auth/login', data).then(r => r.data.data),
  updateTheme: (theme) => api.patch('/users/theme', { theme }),
}
