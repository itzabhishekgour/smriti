import api from './api'

export const cliTokenService = {
  list: () => api.get('/tokens').then(r => r.data.data),
  create: (data) => api.post('/tokens', data).then(r => r.data.data),
  revoke: (id) => api.delete(`/tokens/${id}`),
}
