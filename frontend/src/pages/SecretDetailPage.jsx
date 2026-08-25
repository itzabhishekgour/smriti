import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, Eye, EyeOff, Link, Calendar, Clock, Tag,
  Pencil, Trash2, AlertTriangle
} from 'lucide-react'
import { secretService } from '../services/secretService'
import { EnvironmentBadge, CategoryBadge } from '../components/ui/Badge'
import CopyButton from '../components/secrets/CopyButton'
import SecretForm from '../components/secrets/SecretForm'
import SecretVersionHistory from '../components/secrets/SecretVersionHistory'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import { Skeleton, SkeletonText } from '../components/ui/Skeleton'
import { formatDate, formatDatetime, daysUntilExpiry } from '../utils/formatDate'
import toast from 'react-hot-toast'
import { cn } from '../utils/cn'

export default function SecretDetailPage() {
  const { projectId, secretId } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [showValue, setShowValue] = useState(false)
  const [editModal, setEditModal] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  const { data: secret, isLoading: secretLoading } = useQuery({
    queryKey: ['secret', projectId, secretId],
    queryFn: () => secretService.getDetail(projectId, secretId),
  })

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => import('../services/projectService').then(m => m.projectService.getOne(projectId)),
  })

  const isLoading = secretLoading || projectLoading

  const updateSecret = useMutation({
    mutationFn: (data) => secretService.update(projectId, secretId, data),
    onSuccess: () => {
      qc.invalidateQueries(['secret', projectId, secretId])
      qc.invalidateQueries(['secrets', projectId])
      setEditModal(false)
      toast.success('Secret updated!')
    },
    onError: () => toast.error('Failed to update'),
  })

  const deleteSecret = useMutation({
    mutationFn: () => secretService.remove(projectId, secretId),
    onSuccess: () => {
      qc.invalidateQueries(['secrets', projectId])
      navigate(`/projects/${projectId}`)
      toast.success('Secret deleted')
    },
  })

  const tags = secret?.tags?.split(',').map(t => t.trim()).filter(Boolean) ?? []
  const days = daysUntilExpiry(secret?.expiryDate)

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <Skeleton className="h-5 w-24 mb-6" />
        <Skeleton className="h-8 w-64 mb-2" />
        <SkeletonText lines={3} className="mb-6" />
        <div className="card p-6 space-y-4">
          <Skeleton className="h-10 w-full" />
          <SkeletonText lines={4} />
        </div>
      </div>
    )
  }

  if (!secret) return null

  return (
    <div className="max-w-2xl mx-auto w-full min-w-0">
      {/* Back */}
      <button
        onClick={() => navigate(`/projects/${projectId}`)}
        className="flex items-center gap-1.5 text-sm text-neutral-500 dark:text-neutral-400 dark:text-neutral-500 hover:text-neutral-800 dark:text-neutral-200 mb-6 transition-colors group"
      >
        <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
        Back to {secret.projectName}
      </button>

      {/* Title + actions */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div className="min-w-0 w-full">
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 mb-1">{secret.name}</h1>
          {secret.serviceName && (
            <p className="text-sm text-neutral-500 dark:text-neutral-400 dark:text-neutral-500">{secret.serviceName}</p>
          )}
          <div className="flex flex-wrap gap-2 mt-2">
            {secret.environment && <EnvironmentBadge env={secret.environment} />}
            {secret.category    && <CategoryBadge category={secret.category} />}
          </div>
        </div>
        {(project?.isOwner || project?.userRole === 'EDITOR') && (
          <div className="flex gap-2 flex-shrink-0">
            <Button variant="secondary" size="sm" onClick={() => setEditModal(true)}>
              <Pencil size={14} /> Edit
            </Button>
            <Button
              variant="danger" size="sm"
              onClick={() => setDeleteConfirm(true)}
            >
              <Trash2 size={14} /> Delete
            </Button>
          </div>
        )}
      </div>

      {/* Expiry warning */}
      {(secret.isExpired || secret.isExpiringSoon) && (
        <div className={cn(
          'flex items-center gap-2 text-sm px-4 py-3 rounded-lg mb-4 border',
          secret.isExpired
            ? 'bg-danger-50 dark:bg-danger-900/30 text-danger-700 border-danger-200'
            : 'bg-warning-50 dark:bg-warning-900/30 text-warning-700 border-warning-200'
        )}>
          <AlertTriangle size={16} className="shrink-0" />
          {secret.isExpired
            ? `This secret expired on ${formatDate(secret.expiryDate)}`
            : `Expires in ${days} day${days !== 1 ? 's' : ''}, ${formatDate(secret.expiryDate)}`
          }
        </div>
      )}

      {/* Secret value */}
      <div className="card p-5 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 dark:text-neutral-500 uppercase tracking-wide">Secret Value</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowValue(v => !v)}
              className="icon-btn text-xs flex items-center gap-1"
              title={showValue ? 'Hide value' : 'Reveal value'}
            >
              {showValue ? <EyeOff size={14} /> : <Eye size={14} />}
              <span className="text-xs">{showValue ? 'Hide' : 'Reveal'}</span>
            </button>
            <CopyButton getValue={secret.value} showLabel size={14} />
          </div>
        </div>

        <div className="bg-neutral-50 dark:bg-neutral-950 rounded-lg px-4 py-3 border border-neutral-100 dark:border-neutral-800 w-full overflow-hidden">
          {showValue ? (
            <code className="secret-value whitespace-pre-wrap break-all break-words">{secret.value}</code>
          ) : (
            <span className="secret-masked text-lg break-all break-words">{'•'.repeat(Math.min(secret.value?.length ?? 24, 48))}</span>
          )}
        </div>
      </div>

      {/* Metadata */}
      <div className="card divide-y divide-neutral-100">
        {secret.originNote && (
          <div className="px-5 py-4">
            <h3 className="text-xs font-medium text-neutral-500 dark:text-neutral-400 dark:text-neutral-500 uppercase tracking-wide mb-2">Origin Story</h3>
            <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">{secret.originNote}</p>
          </div>
        )}

        <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {secret.expiryDate && (
            <div className="flex items-start gap-2">
              <Calendar size={14} className="text-neutral-400 dark:text-neutral-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-neutral-400 dark:text-neutral-500">Expires</p>
                <p className="text-sm text-neutral-700 dark:text-neutral-300">{formatDate(secret.expiryDate)}</p>
              </div>
            </div>
          )}
          {secret.lastUsedAt && (
            <div className="flex items-start gap-2">
              <Clock size={14} className="text-neutral-400 dark:text-neutral-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-neutral-400 dark:text-neutral-500">Last accessed</p>
                <p className="text-sm text-neutral-700 dark:text-neutral-300">{formatDatetime(secret.lastUsedAt)}</p>
              </div>
            </div>
          )}
          <div className="flex items-start gap-2">
            <Clock size={14} className="text-neutral-400 dark:text-neutral-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-neutral-400 dark:text-neutral-500">Created</p>
              <p className="text-sm text-neutral-700 dark:text-neutral-300">{formatDatetime(secret.createdAt)}</p>
            </div>
          </div>
          {secret.updatedAt && (
            <div className="flex items-start gap-2">
              <Clock size={14} className="text-neutral-400 dark:text-neutral-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-neutral-400 dark:text-neutral-500">Updated</p>
                <p className="text-sm text-neutral-700 dark:text-neutral-300">{formatDatetime(secret.updatedAt)}</p>
              </div>
            </div>
          )}
        </div>

        {secret.sourceUrl && (
          <div className="px-5 py-4 flex items-center gap-2">
            <Link size={14} className="text-neutral-400 dark:text-neutral-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-neutral-400 dark:text-neutral-500 mb-0.5">Source</p>
              <a
                href={secret.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary-600 dark:text-primary-400 hover:underline truncate block"
              >
                {secret.sourceUrl}
              </a>
            </div>
          </div>
        )}

        {tags.length > 0 && (
          <div className="px-5 py-4">
            <div className="flex items-center gap-2">
              <Tag size={14} className="text-neutral-400 dark:text-neutral-500" />
              <div className="flex flex-wrap gap-1.5">
                {tags.map(tag => (
                  <span key={tag} className="tag-pill">{tag}</span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Version History */}
      <SecretVersionHistory 
        projectId={projectId} 
        secretId={secretId} 
        canRestore={project?.isOwner || project?.userRole === 'EDITOR'} 
      />

      {/* Edit modal */}
      <SecretForm
        open={editModal}
        onClose={() => setEditModal(false)}
        initialData={secret}
        projectId={projectId}
        loading={updateSecret.isPending}
        onSubmit={(data) => updateSecret.mutate(data)}
      />

      {/* Delete confirm modal */}
      <Modal
        open={deleteConfirm}
        onClose={() => setDeleteConfirm(false)}
        title="Delete Secret"
        size="sm"
      >
        <div className="p-6 space-y-6">
          <p className="text-sm text-neutral-600 dark:text-neutral-300">
            Are you sure you want to delete the secret <strong>{secret.name}</strong>?
            <br /><br />
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={deleteSecret.isPending}
              onClick={() => deleteSecret.mutate()}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
