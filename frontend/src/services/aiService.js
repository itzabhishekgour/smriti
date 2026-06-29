import api from './api'

export const aiService = {
  parseNote: (note) =>
    api.post('/ai/parse', { note }, { timeout: 45000 }).then(r => r.data.data),
  bulkParse: (keys) =>
    api.post('/ai/bulk-parse', { keys }, { timeout: 90000 }).then(r => r.data.data),
}
