import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, FolderOpen, FolderDown } from 'lucide-react'
import { projectService } from '../services/projectService'
import { githubAccountService } from '../services/githubAccountService'
import ProjectGrid from '../components/projects/ProjectGrid'
import ProjectForm from '../components/projects/ProjectForm'
import ImportModal from '../components/secrets/ImportModal'
import ImportGithubModal from '../components/projects/ImportGithubModal'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import toast from 'react-hot-toast'

export default function ProjectsPage() {
  const qc = useQueryClient()

  const [projectModal, setProjectModal] = useState({ open: false, data: null })
  const [importModal, setImportModal] = useState(false)
  const [importGithubModal, setImportGithubModal] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, data: null })

  const [searchQuery, setSearchQuery] = useState('')

  const { data: projects, isLoading: projLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: projectService.getAll,
  })

  const { data: accountStatus } = useQuery({
    queryKey: ['githubAccountStatus'],
    queryFn: () => githubAccountService.getStatus(),
  })

  const filteredProjects = projects?.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const createProject = useMutation({
    mutationFn: projectService.create,
    onSuccess: () => {
      qc.invalidateQueries(['projects'])
      setProjectModal({ open: false, data: null })
      toast.success('Project created!')
    },
    onError: () => toast.error('Failed to create project'),
  })

  const updateProject = useMutation({
    mutationFn: ({ id, data }) => projectService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries(['projects'])
      setProjectModal({ open: false, data: null })
      toast.success('Project updated!')
    },
  })

  const deleteProject = useMutation({
    mutationFn: projectService.remove,
    onSuccess: () => {
      qc.invalidateQueries(['projects'])
      setDeleteConfirm({ open: false, data: null })
      toast.success('Project deleted')
    },
    onError: () => toast.error('Failed to delete project'),
  })

  const handleExportEnv = async (projectId, projectName) => {
    const { secretService } = await import('../services/secretService')
    const toastId = toast.loading('Preparing .env file...')
    try {
      const secretsData = await secretService.exportProject(projectId)
      if (!secretsData || secretsData.length === 0) {
        toast.dismiss(toastId)
        toast.error('No secrets to export')
        return
      }
      const envContent = secretsData.map(s => {
        const key = s.name.toUpperCase().replace(/[^A-Z0-9_]/g, '_')
        return `${key}="${s.value.replace(/"/g, '\\"')}"`
      }).join('\n')
      const blob = new Blob([envContent], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${projectName?.replace(/\s+/g, '_') || 'project'}.env`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.dismiss(toastId)
      toast.success('Downloaded .env file')
    } catch (e) {
      console.error(e)
      toast.dismiss(toastId)
      toast.error('Failed to export .env')
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Sticky Header Section */}
      <div className="sticky top-0 z-20 bg-neutral-50/95 dark:bg-neutral-950/95 backdrop-blur-xl pt-6 -mt-6 pb-4 mb-6 -mx-4 px-4 sm:mx-0 sm:px-0 border-b border-neutral-200/50 dark:border-neutral-800/50 sm:border-none sm:bg-transparent sm:backdrop-blur-none">
        {/* Header */}
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
              Projects
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              {projLoading ? 'Loading...' : `${projects?.length ?? 0} project${projects?.length !== 1 ? 's' : ''}`}
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 no-scrollbar mt-1 sm:mt-0">
            {accountStatus?.connected && (
              <Button size="sm" variant="secondary" onClick={() => setImportGithubModal(true)} className="whitespace-nowrap shrink-0">
                <FolderDown size={15} />
                <span className="hidden sm:inline">Import from GitHub</span>
              </Button>
            )}
            <Button size="sm" variant="secondary" onClick={() => setImportModal(true)} className="whitespace-nowrap shrink-0">
              <FolderOpen size={15} />
              <span className="hidden sm:inline">Bulk Import</span>
            </Button>
            <Button size="sm" onClick={() => setProjectModal({ open: true, data: null })} className="whitespace-nowrap shrink-0 flex-1 sm:flex-none justify-center">
              <Plus size={15} />
              New Project
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="max-w-md">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-neutral-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              type="text"
              className="input-base w-full pl-9 bg-white dark:bg-neutral-900 shadow-sm"
              placeholder="Search projects by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <ProjectGrid
        projects={filteredProjects}
        loading={projLoading}
        onNew={() => setProjectModal({ open: true, data: null })}
        onEdit={(p) => setProjectModal({ open: true, data: p })}
        onDelete={(p) => setDeleteConfirm({ open: true, data: p })}
        onExport={(p) => handleExportEnv(p.id, p.name)}
        onImportGithub={accountStatus?.connected ? () => setImportGithubModal(true) : undefined}
      />

      {/* Modals */}
      <ProjectForm
        open={projectModal.open}
        onClose={() => setProjectModal({ open: false, data: null })}
        initialData={projectModal.data}
        loading={createProject.isPending || updateProject.isPending}
        onSubmit={(data) => {
          if (projectModal.data) updateProject.mutate({ id: projectModal.data.id, data })
          else createProject.mutate(data)
        }}
      />

      <ImportModal
        open={importModal}
        onClose={() => setImportModal(false)}
        onImportSuccess={() => qc.invalidateQueries(['projects', 'secrets'])}
      />

      <ImportGithubModal
        open={importGithubModal}
        onClose={() => setImportGithubModal(false)}
      />

      <Modal
        open={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, data: null })}
        title="Delete Project"
        size="sm"
      >
        <div className="p-6 space-y-6">
          <p className="text-sm text-neutral-600 dark:text-neutral-300">
            Are you sure you want to delete <strong>{deleteConfirm.data?.name}</strong>?
            This will also delete all secrets inside this project.
            <br /><br />
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeleteConfirm({ open: false, data: null })}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={deleteProject.isPending}
              onClick={() => deleteProject.mutate(deleteConfirm.data.id)}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
