import api from './api'

export const projectService = {
  getAll:   ()           => api.get('/projects').then(r => r.data.data),
  getOne:   (id)         => api.get(`/projects/${id}`).then(r => r.data.data),
  create:   (data)       => api.post('/projects', data).then(r => r.data.data),
  update:   (id, data)   => api.put(`/projects/${id}`, data).then(r => r.data.data),
  remove:   (id)         => api.delete(`/projects/${id}`).then(r => r.data),
  
  // Collaboration / Sharing
  getShares:    (id)              => api.get(`/projects/${id}/shares`).then(r => r.data.data),
  shareProject: (id, data)        => api.post(`/projects/${id}/shares`, data).then(r => r.data.data),
  removeShare:  (id, shareId)     => api.delete(`/projects/${id}/shares/${shareId}`).then(r => r.data),
  
  // Magic Links
  getLinks:     (id)              => api.get(`/projects/${id}/links`).then(r => r.data.data),
  createLink:   (id, data)        => api.post(`/projects/${id}/links`, data).then(r => r.data.data),
  deleteLink:   (id, linkId)      => api.delete(`/projects/${id}/links/${linkId}`).then(r => r.data),
}
