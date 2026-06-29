import api from './api'

export const githubAccountService = {
  getConnectUrl: () => api.get('/integrations/github-account/connect').then(r => r.data.data),
  getStatus: () => api.get('/integrations/github-account/status').then(r => r.data.data),
  getRepositories: () => api.get('/integrations/github-account/repos').then(r => r.data.data),
  disconnect: () => api.delete('/integrations/github-account/disconnect').then(r => r.data.data),
}
