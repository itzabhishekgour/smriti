import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { projectService } from '../services/projectService'
import toast from 'react-hot-toast'

export function useProjects() {
  const qc = useQueryClient()

  const { data: projects = [], isLoading, error } = useQuery({
    queryKey: ['projects'],
    queryFn: projectService.getAll,
  })

  const create = useMutation({
    mutationFn: projectService.create,
    onSuccess: () => { qc.invalidateQueries(['projects']); toast.success('Project created!') },
    onError: () => toast.error('Failed to create project'),
  })

  const update = useMutation({
    mutationFn: ({ id, data }) => projectService.update(id, data),
    onSuccess: () => { qc.invalidateQueries(['projects']); toast.success('Project updated!') },
    onError: () => toast.error('Failed to update project'),
  })

  const remove = useMutation({
    mutationFn: projectService.remove,
    onSuccess: () => { qc.invalidateQueries(['projects']); toast.success('Project deleted') },
    onError: () => toast.error('Failed to delete project'),
  })

  return { projects, isLoading, error, create, update, remove }
}
