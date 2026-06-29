import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Search, FolderDown, Lock, Globe } from 'lucide-react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { Skeleton } from '../ui/Skeleton'
import toast from 'react-hot-toast'
import { githubAccountService } from '../../services/githubAccountService'
import { projectService } from '../../services/projectService'
import { githubIntegrationService } from '../../services/githubIntegrationService'

export default function ImportGithubModal({ open, onClose }) {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [selectedRepo, setSelectedRepo] = useState(null)

  const { data: repos, isLoading } = useQuery({
    queryKey: ['githubRepositories'],
    queryFn: () => githubAccountService.getRepositories(),
    enabled: open,
  })

  const importMutation = useMutation({
    mutationFn: async (repo) => {
      // 1. Create project
      const projectData = {
        name: repo.name,
        description: `Imported from ${repo.full_name}`
      }
      const newProject = await projectService.create(projectData)
      
      // 2. Connect integration
      const [owner, name] = repo.full_name.split('/')
      await githubIntegrationService.connect(newProject.id, {
        repoOwner: owner,
        repoName: name,
        accessToken: '' // Empty so backend uses OAuth token
      })
      
      return newProject
    },
    onSuccess: (newProject) => {
      qc.invalidateQueries(['projects'])
      toast.success(`Imported ${newProject.name} successfully!`)
      onClose()
      navigate(`/projects/${newProject.id}`)
    },
    onError: (e) => {
      toast.error('Failed to import project. Please try again.')
    }
  })

  const filteredRepos = useMemo(() => {
    if (!repos) return []
    if (!search) return repos
    return repos.filter(r => r.full_name.toLowerCase().includes(search.toLowerCase()))
  }, [repos, search])

  const handleImport = (repo) => {
    setSelectedRepo(repo)
    importMutation.mutate(repo)
  }

  return (
    <Modal open={open} onClose={onClose} title="Import from GitHub" size="md">
      <div className="p-6">
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-2.5 text-neutral-400" size={18} />
          <input
            type="text"
            className="input-base pl-9 w-full"
            placeholder="Search repositories..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden flex flex-col h-[60vh] max-h-[400px]">
          <div className="overflow-y-auto flex-1 bg-neutral-50 dark:bg-neutral-900/50">
            {isLoading ? (
              <div className="p-4 space-y-3">
                <Skeleton className="h-16 w-full rounded-lg" />
                <Skeleton className="h-16 w-full rounded-lg" />
                <Skeleton className="h-16 w-full rounded-lg" />
              </div>
            ) : filteredRepos.length > 0 ? (
              <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {filteredRepos.map(repo => (
                  <div 
                    key={repo.id} 
                    className="p-4 flex items-center justify-between gap-3 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors bg-white dark:bg-neutral-900"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 shrink-0 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-700 dark:text-neutral-300">
                        <FolderDown size={20} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                          {repo.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-neutral-500">
                          <span className="truncate">{repo.owner}</span>
                          <span className="w-1 h-1 shrink-0 rounded-full bg-neutral-300 dark:bg-neutral-600"></span>
                          <span className="flex items-center gap-1 shrink-0">
                            {repo.private ? <Lock size={12} /> : <Globe size={12} />}
                            {repo.private ? 'Private' : 'Public'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button 
                      size="sm"
                      className="shrink-0"
                      loading={importMutation.isPending && selectedRepo?.id === repo.id}
                      disabled={importMutation.isPending}
                      onClick={() => handleImport(repo)}
                    >
                      Import
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-neutral-500">
                {search ? "No repositories match your search." : "No repositories found in your account."}
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}
