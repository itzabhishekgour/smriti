import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Plus, Search, FolderOpen, Download, Users, Link as LinkIcon, ShieldAlert } from 'lucide-react'
import { projectService } from '../services/projectService'
import { secretService } from '../services/secretService'
import { useDebounce } from '../hooks/useDebounce'
import SecretList from '../components/secrets/SecretList'
import SecretForm from '../components/secrets/SecretForm'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import { Skeleton } from '../components/ui/Skeleton'
import { EnvironmentBadge } from '../components/ui/Badge'
import toast from 'react-hot-toast'
import ShareModal from '../components/projects/ShareModal'
import LinkShareModal from '../components/projects/LinkShareModal'
import AuditLogList from '../components/projects/AuditLogList'
import GitHubIntegrationCard from '../components/projects/integrations/GitHubIntegrationCard'
import RenderIntegrationCard from '../components/projects/integrations/RenderIntegrationCard'

export default function ProjectDetailPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [secretModal, setSecretModal] = useState({ open: false, data: null })
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, data: null })
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedQuery = useDebounce(searchQuery, 400)
  const [exporting, setExporting] = useState(false)
  const [shareModal, setShareModal] = useState(false)
  const [linkModal, setLinkModal] = useState(false)

  const handleExportEnv = async () => {
    try {
      setExporting(true)
      const secretsData = await secretService.exportProject(projectId)
      if (!secretsData || secretsData.length === 0) {
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
      a.download = `${project?.name?.replace(/\s+/g, '_') || 'project'}.env`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('Downloaded .env file')
    } catch (e) {
      console.error(e)
      toast.error('Failed to export .env')
    } finally {
      setExporting(false)
    }
  }

  // Queries
  const { data: project, isLoading: projLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectService.getOne(projectId),
  })

  const { data: secrets, isLoading: secLoading } = useQuery({
    queryKey: ['secrets', projectId, debouncedQuery],
    queryFn: () => secretService.getByProject(projectId, debouncedQuery || undefined),
    enabled: !!projectId,
  })

  // Mutations
  const createSecret = useMutation({
    mutationFn: (data) => secretService.create(projectId, data),
    onSuccess: () => {
      qc.invalidateQueries(['secrets', projectId])
      qc.invalidateQueries(['projects'])
      setSecretModal({ open: false, data: null })
      toast.success('Secret saved!')
    },
    onError: () => toast.error('Failed to save secret'),
  })

  const updateSecret = useMutation({
    mutationFn: ({ secretId, data }) => secretService.update(projectId, secretId, data),
    onSuccess: () => {
      qc.invalidateQueries(['secrets', projectId])
      setSecretModal({ open: false, data: null })
      toast.success('Secret updated!')
    },
    onError: () => toast.error('Failed to update secret'),
  })

  const deleteSecret = useMutation({
    mutationFn: (secretId) => secretService.remove(projectId, secretId),
    onSuccess: () => {
      qc.invalidateQueries(['secrets', projectId])
      qc.invalidateQueries(['projects'])
      toast.success('Secret deleted')
    },
    onError: () => toast.error('Failed to delete secret'),
  })

  const projectColor = project?.color || '#6366f1'

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back */}
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-1.5 text-sm text-neutral-500 dark:text-neutral-400 dark:text-neutral-500 hover:text-neutral-800 dark:text-neutral-200 mb-6 transition-colors group"
      >
        <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
        Back to Dashboard
      </button>

      {/* Project header */}
      {projLoading ? (
        <div className="mb-8 space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
      ) : project ? (
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: projectColor + '20', color: projectColor }}
            >
              <FolderOpen size={18} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">{project.name}</h1>
              {project.description && (
                <p className="text-sm text-neutral-500 dark:text-neutral-400 dark:text-neutral-500">{project.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-neutral-400 dark:text-neutral-500 ml-13 pl-1">
            <span>{project.secretCount} {project.secretCount === 1 ? 'secret' : 'secrets'}</span>
          </div>
        </div>
      ) : null}

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-0 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500" />
          <input
            className="input-base pl-9 h-9 w-full text-sm"
            placeholder="Search secrets…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          {project?.isOwner && (
            <>
              <Button size="sm" variant="secondary" onClick={() => setShareModal(true)}>
                <Users size={15} /> Team
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setLinkModal(true)}>
                <LinkIcon size={15} /> Link
              </Button>
            </>
          )}
          <Button size="sm" variant="secondary" onClick={handleExportEnv} loading={exporting}>
            <Download size={15} /> Export
          </Button>
          {(project?.isOwner || project?.userRole === 'EDITOR') && (
            <Button size="sm" onClick={() => setSecretModal({ open: true, data: null })}>
              <Plus size={15} /> Add Secret
            </Button>
          )}
        </div>
      </div>

      {/* Secrets */}
      <SecretList
        secrets={secrets}
        loading={secLoading}
        projectId={projectId}
        canEdit={project?.isOwner || project?.userRole === 'EDITOR'}
        onNew={() => setSecretModal({ open: true, data: null })}
        onEdit={(s) => setSecretModal({ open: true, data: s })}
        onDelete={(s) => setDeleteConfirm({ open: true, data: s })}
        emptyMessage={
          debouncedQuery
            ? `No secrets match "${debouncedQuery}"`
            : 'No secrets in this project yet. Add your first one!'
        }
      />

      {/* Integrations */}
      <div className="mt-8 space-y-4">
        <GitHubIntegrationCard 
          projectId={projectId} 
          canEdit={project?.isOwner || project?.userRole === 'EDITOR'} 
        />
        <RenderIntegrationCard 
          projectId={projectId} 
          role={project?.userRole || (project?.isOwner ? 'OWNER' : 'VIEWER')} 
        />
      </div>

      {/* Audit Logs */}
      <div className="mt-8">
        <AuditLogList projectId={projectId} isOwner={project?.isOwner} />
      </div>

      {/* Secret Form */}
      <SecretForm
        open={secretModal.open}
        onClose={() => setSecretModal({ open: false, data: null })}
        initialData={secretModal.data}
        projectId={projectId}
        loading={createSecret.isPending || updateSecret.isPending}
        onSubmit={(data) => {
          if (secretModal.data) updateSecret.mutate({ secretId: secretModal.data.id, data })
          else createSecret.mutate(data)
        }}
      />

      <Modal
        open={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, data: null })}
        title="Delete Secret"
        size="sm"
      >
        <div className="p-6 space-y-6">
          <p className="text-sm text-neutral-600 dark:text-neutral-300">
            Are you sure you want to delete the secret <strong>{deleteConfirm.data?.name}</strong>?
            <br /><br />
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeleteConfirm({ open: false, data: null })}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={deleteSecret.isPending}
              onClick={() => {
                deleteSecret.mutate(deleteConfirm.data.id, {
                  onSettled: () => setDeleteConfirm({ open: false, data: null })
                })
              }}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      {shareModal && project && (
        <ShareModal project={project} onClose={() => setShareModal(false)} />
      )}
      
      {linkModal && project && (
        <LinkShareModal project={project} onClose={() => setLinkModal(false)} />
      )}
    </div>
  )
}
