import api from './api';

export const securityService = {
  scanRepository: async (projectId) => {
    const response = await api.post(`/projects/${projectId}/security/scan`);
    return response.data;
  },

  getFindings: async (projectId) => {
    const response = await api.get(`/projects/${projectId}/security/findings`);
    return response.data;
  },

  resolveFinding: async (projectId, findingId) => {
    const response = await api.post(`/projects/${projectId}/security/findings/${findingId}/resolve`);
    return response.data;
  }
};
