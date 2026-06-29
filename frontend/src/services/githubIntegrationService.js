import api from './api'

export const githubIntegrationService = {
  getStatus: async (projectId) => {
    const res = await api.get(`/projects/${projectId}/integrations/github`)
    return res.data
  },

  connect: async (projectId, data) => {
    const res = await api.post(`/projects/${projectId}/integrations/github`, data)
    return res.data
  },

  sync: async (projectId) => {
    const res = await api.post(`/projects/${projectId}/integrations/github/sync`)
    return res.data
  },

  disconnect: async (projectId) => {
    await api.delete(`/projects/${projectId}/integrations/github`)
  }
}
