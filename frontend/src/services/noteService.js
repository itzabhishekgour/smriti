import api from './api'

export const noteService = {
  // Global Notes
  getGlobalNotes: async () => {
    const { data } = await api.get('/notes')
    return data.data
  },
  
  createGlobalNote: async (noteData) => {
    const { data } = await api.post('/notes', noteData)
    return data.data
  },

  // Project Notes
  getProjectNotes: async (projectId) => {
    const { data } = await api.get(`/projects/${projectId}/notes`)
    return data.data
  },
  
  createProjectNote: async (projectId, noteData) => {
    const { data } = await api.post(`/projects/${projectId}/notes`, noteData)
    return data.data
  },

  // Shared
  updateNote: async (noteId, noteData) => {
    const { data } = await api.put(`/notes/${noteId}`, noteData)
    return data.data
  },

  deleteNote: async (noteId) => {
    const { data } = await api.delete(`/notes/${noteId}`)
    return data.data
  }
}
