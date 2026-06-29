import api from './api'

export const authService = {
  register: (data) => api.post('/auth/register', data).then(r => r.data.data),
  login:    (data) => api.post('/auth/login', data).then(r => r.data.data),
  acceptTerms: (tempToken) => api.post('/auth/accept-terms', { tempToken }).then(r => r.data.data),
  linkAccount: (tempToken, password) => api.post('/auth/link-oauth', { tempToken, password }).then(r => r.data.data),
  updateTheme: (theme) => api.patch('/users/theme', { theme }),
  updatePassword: (data) => api.put('/users/me/password', data),
}
