import api from './api'

export const auditLogService = {
  getLogs: async (projectId, params = {}) => {
    const searchParams = new URLSearchParams()
    if (params.includeViews) searchParams.append('includeViews', 'true')
    if (params.page !== undefined) searchParams.append('page', params.page)
    if (params.size !== undefined) searchParams.append('size', params.size)

    const response = await api.get(`/projects/${projectId}/audit-logs?${searchParams.toString()}`)
    return response.data
  }
}
