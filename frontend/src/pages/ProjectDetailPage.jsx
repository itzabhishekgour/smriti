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
import SecurityFindingsList from '../components/projects/security/SecurityFindingsList'
import MasonryGrid from '../components/notes/MasonryGrid'
import NoteModal from '../components/notes/NoteModal'
import { noteService } from '../services/noteService'

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
  const [noteModal, setNoteModal] = useState({ open: false, data: null })
  const [deleteNoteConfirm, setDeleteNoteConfirm] = useState({ open: false, data: null })
  const [activeTab, setActiveTab] = useState('secrets')

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

  const { data: notes, isLoading: notesLoading } = useQuery({
    queryKey: ['notes', 'project', projectId],
    queryFn: () => noteService.getProjectNotes(projectId),
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

  const deleteNote = useMutation({
    mutationFn: noteService.deleteNote,
    onSuccess: () => {
      qc.invalidateQueries(['notes'])
      setDeleteNoteConfirm({ open: false, data: null })
      toast.success('Note deleted')
    }
  })

  const projectColor = project?.color || '#6366f1'

  return (
    <div className="max-w-6xl mx-auto">
      {/* Back */}
      <button
        onClick={() => navigate('/projects')}
        className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 mb-6 transition-colors group w-fit"
      >
        <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
        Back to Projects
      </button>

      {/* Project header */}
      {projLoading ? (
        <div className="mb-6 sm:mb-8 space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
      ) : project ? (
        <div className="mb-6 sm:mb-8">
          <div className="flex items-start sm:items-center gap-3 sm:gap-4 mb-2">
            <div
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 mt-0.5 sm:mt-0"
              style={{ backgroundColor: projectColor + '20', color: projectColor }}
            >
              <FolderOpen size={20} strokeWidth={2.5} />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-semibold text-neutral-900 dark:text-neutral-100 truncate">{project.name}</h1>
              {project.description && (
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-2 sm:line-clamp-1">{project.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs font-medium text-neutral-500 dark:text-neutral-400 ml-[52px] sm:ml-16">
            <span className="bg-neutral-100 dark:bg-neutral-800/50 px-2 py-0.5 rounded-md border border-neutral-200/50 dark:border-neutral-700/50">{project.secretCount} {project.secretCount === 1 ? 'Secret' : 'Secrets'}</span>
          </div>
        </div>
      ) : null}

      {/* Tabs */}
      <div className="flex items-center gap-6 sm:gap-8 border-b border-neutral-200 dark:border-neutral-800 mb-6 overflow-x-auto no-scrollbar whitespace-nowrap">
        <button
          onClick={() => setActiveTab('secrets')}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'secrets' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'}`}
        >
          Secrets
        </button>
        <button
          onClick={() => setActiveTab('integrations')}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'integrations' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'}`}
        >
          Integrations & Security
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'activity' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'}`}
        >
          Activity
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'notes' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'}`}
        >
          Notes
        </button>
      </div>

      {activeTab === 'secrets' && (
        <div className="space-y-4 animate-fade-in">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="relative w-full sm:max-w-xs">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                className="input-base pl-9 h-9 w-full text-sm"
                placeholder="Search secrets…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar w-full sm:w-auto">
              {project?.isOwner && (
                <>
                  <Button size="sm" variant="secondary" onClick={() => setShareModal(true)} className="whitespace-nowrap shrink-0">
                    <Users size={15} /> <span className="hidden sm:inline">Team</span>
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => setLinkModal(true)} className="whitespace-nowrap shrink-0">
                    <LinkIcon size={15} /> <span className="hidden sm:inline">Link</span>
                  </Button>
                </>
              )}
              <Button size="sm" variant="secondary" onClick={handleExportEnv} loading={exporting} className="whitespace-nowrap shrink-0">
                <Download size={15} /> <span className="hidden sm:inline">Export</span>
              </Button>
              {(project?.isOwner || project?.userRole === 'EDITOR') && (
                <Button size="sm" onClick={() => setSecretModal({ open: true, data: null })} className="whitespace-nowrap shrink-0 flex-1 justify-center sm:flex-none">
                  <Plus size={15} /> Add Secret
                </Button>
              )}
            </div>
          </div>

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
        </div>
      )}

      {activeTab === 'integrations' && (
        <div className="space-y-8 animate-fade-in">
          <GitHubIntegrationCard 
            projectId={projectId} 
            canEdit={project?.isOwner || project?.userRole === 'EDITOR'} 
          />
          <RenderIntegrationCard 
            projectId={projectId} 
            role={project?.userRole || (project?.isOwner ? 'OWNER' : 'VIEWER')} 
          />
          <SecurityFindingsList 
            projectId={projectId} 
            isEditor={project?.isOwner || project?.userRole === 'EDITOR'} 
          />
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="animate-fade-in">
          <AuditLogList projectId={projectId} isOwner={project?.isOwner} />
        </div>
      )}

      {activeTab === 'notes' && (
        <div className="animate-fade-in space-y-4">
          <div className="flex justify-end">
            {(project?.isOwner || project?.userRole === 'EDITOR') && (
              <Button size="sm" onClick={() => setNoteModal({ open: true, data: null })}>
                <Plus size={15} /> Add Note
              </Button>
            )}
          </div>
          <MasonryGrid 
            notes={notes} 
            loading={notesLoading}
            onNew={() => setNoteModal({ open: true, data: null })}
            onEdit={(note) => setNoteModal({ open: true, data: note })}
            onDelete={(note) => setDeleteNoteConfirm({ open: true, data: note })}
            emptyMessage="No notes in this project yet."
          />
        </div>
      )}

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

      <NoteModal 
        open={noteModal.open} 
        onClose={() => setNoteModal({ open: false, data: null })} 
        note={noteModal.data}
        projectId={projectId}
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

      <Modal
        open={deleteNoteConfirm.open}
        onClose={() => setDeleteNoteConfirm({ open: false, data: null })}
        title="Delete Note"
        size="sm"
      >
        <div className="p-6 space-y-6">
          <p className="text-sm text-neutral-600 dark:text-neutral-300">
            Are you sure you want to delete the note <strong>{deleteNoteConfirm.data?.title || 'Untitled'}</strong>?
            <br /><br />
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeleteNoteConfirm({ open: false, data: null })}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={deleteNote.isPending}
              onClick={() => deleteNote.mutate(deleteNoteConfirm.data.id)}
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
