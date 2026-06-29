import api from './api';

export const renderIntegrationService = {
  getStatus: async (projectId) => {
    const response = await api.get(`/projects/${projectId}/integrations/render`);
    return response.data;
  },

  connect: async (projectId, serviceId, apiKey) => {
    const response = await api.post(`/projects/${projectId}/integrations/render`, {
      serviceId,
      apiKey
    });
    return response.data;
  },

  disconnect: async (projectId) => {
    const response = await api.delete(`/projects/${projectId}/integrations/render`);
    return response.data;
  },

  previewSync: async (projectId) => {
    const response = await api.get(`/projects/${projectId}/integrations/render/preview-sync`);
    return response.data;
  },

  sync: async (projectId) => {
    const response = await api.post(`/projects/${projectId}/integrations/render/sync`);
    return response.data;
  }
};
