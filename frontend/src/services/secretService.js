import api from './api'

export const secretService = {
  /** All secrets across all projects (with optional search query) */
  getAll: (q) =>
    api.get('/secrets', { params: q ? { q } : undefined }).then(r => r.data.data),

  /** Secrets for a specific project */
  getByProject: (projectId, q) =>
    api.get(`/projects/${projectId}/secrets`, { params: q ? { q } : undefined })
       .then(r => r.data.data),

  /** Full detail with decrypted value */
  getDetail: (projectId, secretId) =>
    api.get(`/projects/${projectId}/secrets/${secretId}`).then(r => r.data.data),

  exportProject: (projectId) =>
    api.get(`/projects/${projectId}/secrets/export`).then(r => r.data.data),

  create: (projectId, data) =>
    api.post(`/projects/${projectId}/secrets`, data).then(r => r.data.data),

  createBulk: (projectId, data) =>
    api.post(`/projects/${projectId}/secrets/bulk`, data).then(r => r.data.data),

  update: (projectId, secretId, data) =>
    api.patch(`/projects/${projectId}/secrets/${secretId}`, data).then(r => r.data.data),

  remove: (projectId, secretId) =>
    api.delete(`/projects/${projectId}/secrets/${secretId}`).then(r => r.data),

  getVersions: (projectId, secretId) =>
    api.get(`/projects/${projectId}/secrets/${secretId}/versions`).then(r => r.data.data),

  getVersionValue: (projectId, secretId, versionId) =>
    api.get(`/projects/${projectId}/secrets/${secretId}/versions/${versionId}`).then(r => r.data.data),

  restoreVersion: (projectId, secretId, versionId) =>
    api.post(`/projects/${projectId}/secrets/${secretId}/versions/${versionId}/restore`).then(r => r.data.data),
}
