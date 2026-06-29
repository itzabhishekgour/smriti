import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Key, FolderOpen, AlertTriangle, Search } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { projectService } from '../services/projectService'
import { secretService } from '../services/secretService'
import { useDebounce } from '../hooks/useDebounce'
import ProjectGrid from '../components/projects/ProjectGrid'
import ProjectForm from '../components/projects/ProjectForm'
import SecretList from '../components/secrets/SecretList'
import SecretForm from '../components/secrets/SecretForm'
import ImportModal from '../components/secrets/ImportModal'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import { Skeleton } from '../components/ui/Skeleton'
import toast from 'react-hot-toast'

function StatCard({ icon, label, value, accent = 'primary', loading }) {
  const accentMap = {
    primary: 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400',
    warning: 'bg-warning-50 dark:bg-warning-900/30 text-warning-600 dark:text-warning-400',
    danger:  'bg-danger-50 dark:bg-danger-900/30 text-danger-600 dark:text-danger-400',
    success: 'bg-success-50 dark:bg-success-900/30 text-success-600 dark:text-success-400',
  }
  return (
    <div className="card px-5 py-5 flex items-center gap-4 hover:shadow-md transition-all duration-300 group">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${accentMap[accent]} group-hover:scale-105 transition-transform duration-300 shadow-sm`}>
        {icon}
      </div>
      <div>
        {loading ? (
          <>
            <Skeleton className="h-5 w-10 mb-1" />
            <Skeleton className="h-3 w-20" />
          </>
        ) : (
          <>
            <div className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">{value}</div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400 dark:text-neutral-500">{label}</div>
          </>
        )}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const qc = useQueryClient()

  // State
  const [view, setView] = useState('projects') // projects | secrets
  const [projectModal, setProjectModal] = useState({ open: false, data: null })
  const [secretModal, setSecretModal] = useState({ open: false, data: null })
  const [importModal, setImportModal] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, data: null, type: '' })
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedQuery = useDebounce(searchQuery, 400)

  const handleExportEnv = async (projectId, projectName) => {
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

  // Queries
  const { data: projects, isLoading: projLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: projectService.getAll,
  })

  const { data: secrets, isLoading: secLoading } = useQuery({
    queryKey: ['secrets', debouncedQuery],
    queryFn: () => secretService.getAll(debouncedQuery || undefined),
    enabled: view === 'secrets',
  })

  // Mutations — Projects
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
      toast.success('Project deleted')
    },
    onError: () => toast.error('Failed to delete project'),
  })

  // Mutations — Secrets
  const deleteSecretMutation = useMutation({
    mutationFn: ({ projectId, secretId }) => secretService.remove(projectId, secretId),
    onSuccess: () => {
      qc.invalidateQueries(['secrets'])
      toast.success('Secret deleted')
    },
    onError: () => toast.error('Failed to delete secret'),
  })

  // Stats
  const totalSecrets = secrets?.length ?? 0
  const expiringSoon = secrets?.filter(s => s.isExpiringSoon || s.isExpired).length ?? 0
  const totalProjects = projects?.length ?? 0

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
          Dashboard
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Welcome back, {user?.name?.split(' ')[0]}. Here's an overview of your secrets vault.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<FolderOpen size={18} />}
          label="Projects"
          value={totalProjects}
          accent="primary"
          loading={projLoading}
        />
        <StatCard
          icon={<Key size={18} />}
          label="Total Secrets"
          value={secrets?.length ?? '—'}
          accent="success"
          loading={secLoading && view === 'secrets'}
        />
        <StatCard
          icon={<AlertTriangle size={18} />}
          label="Expiring Soon"
          value={expiringSoon}
          accent={expiringSoon > 0 ? 'danger' : 'primary'}
          loading={false}
        />
        <StatCard
          icon={<Key size={18} />}
          label="Last 7 days"
          value={secrets?.filter(s => {
            const d = new Date(s.createdAt)
            return (new Date() - d) < 7 * 24 * 60 * 60 * 1000
          }).length ?? '—'}
          accent="primary"
          loading={false}
        />
      </div>

      {/* View toggle */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1 gap-1">
          {['projects', 'secrets'].map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-150 capitalize ${
                view === v
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
              }`}
            >
              {v}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {view === 'secrets' && (
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500" />
              <input
                className="input-base pl-9 h-9 w-56 text-sm"
                placeholder="Search secrets…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          )}
          <Button
            size="sm"
            onClick={() => {
              if (view === 'projects') setProjectModal({ open: true, data: null })
              else setSecretModal({ open: true, data: null })
            }}
          >
            <Plus size={15} />
            {view === 'projects' ? 'New Project' : 'Add Secret'}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setImportModal(true)}
          >
            <FolderOpen size={15} />
            Bulk Import
          </Button>
        </div>
      </div>

      {/* Content */}
      {view === 'projects' ? (
        <ProjectGrid
          projects={projects}
          loading={projLoading}
          onNew={() => setProjectModal({ open: true, data: null })}
          onEdit={(p) => setProjectModal({ open: true, data: p })}
          onDelete={(p) => setDeleteConfirm({ open: true, data: p, type: 'project' })}
          onExport={(p) => handleExportEnv(p.id, p.name)}
        />
      ) : (
        <SecretList
          secrets={secrets}
          loading={secLoading}
          onNew={() => setSecretModal({ open: true, data: null })}
          onEdit={(s) => setSecretModal({ open: true, data: s })}
          onDelete={(s) => setDeleteConfirm({ open: true, data: s, type: 'secret' })}
          emptyMessage={debouncedQuery ? `No secrets match "${debouncedQuery}"` : 'No secrets yet. Create a project and add your first secret.'}
        />
      )}

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

      <SecretForm
        open={secretModal.open}
        onClose={() => setSecretModal({ open: false, data: null })}
        initialData={secretModal.data}
        loading={false}
        onSubmit={() => {}} // Secrets need a project — redirect user to pick project
      />

      <ImportModal
        open={importModal}
        onClose={() => setImportModal(false)}
        onImportSuccess={() => qc.invalidateQueries(['projects', 'secrets'])}
      />

      <Modal
        open={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, data: null, type: '' })}
        title={`Delete ${deleteConfirm.type === 'project' ? 'Project' : 'Secret'}`}
        size="sm"
      >
        <div className="p-6 space-y-6">
          <p className="text-sm text-neutral-600 dark:text-neutral-300">
            Are you sure you want to delete the {deleteConfirm.type} <strong>{deleteConfirm.data?.name}</strong>?
            {deleteConfirm.type === 'project' && ' This will also delete all secrets inside this project.'}
            <br /><br />
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeleteConfirm({ open: false, data: null, type: '' })}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={deleteProject.isPending || deleteSecretMutation.isPending}
              onClick={() => {
                if (deleteConfirm.type === 'project') {
                  deleteProject.mutate(deleteConfirm.data.id, {
                    onSettled: () => setDeleteConfirm({ open: false, data: null, type: '' })
                  })
                } else if (deleteConfirm.type === 'secret') {
                  deleteSecretMutation.mutate({ 
                    projectId: deleteConfirm.data.projectId, 
                    secretId: deleteConfirm.data.id 
                  }, {
                    onSettled: () => setDeleteConfirm({ open: false, data: null, type: '' })
                  })
                }
              }}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
