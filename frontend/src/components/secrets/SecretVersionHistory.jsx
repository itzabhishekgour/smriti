import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { History, Eye, EyeOff, RotateCcw, AlertCircle } from 'lucide-react'
import { secretService } from '../../services/secretService'
import { formatDatetime } from '../../utils/formatDate'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import { SkeletonText } from '../ui/Skeleton'
import toast from 'react-hot-toast'
import CopyButton from './CopyButton'

function VersionItem({ version, projectId, secretId, canRestore }) {
  const qc = useQueryClient()
  const [showValue, setShowValue] = useState(false)
  const [restoreConfirm, setRestoreConfirm] = useState(false)

  // Query to fetch decrypted value on demand
  const { data: decryptedValue, isLoading } = useQuery({
    queryKey: ['secret-version-value', projectId, secretId, version.id],
    queryFn: () => secretService.getVersionValue(projectId, secretId, version.id),
    enabled: showValue,
    staleTime: 5 * 60 * 1000,
  })

  const restoreMutation = useMutation({
    mutationFn: () => secretService.restoreVersion(projectId, secretId, version.id),
    onSuccess: () => {
      qc.invalidateQueries(['secret', projectId, secretId])
      qc.invalidateQueries(['secret-versions', projectId, secretId])
      qc.invalidateQueries(['secrets', projectId])
      setRestoreConfirm(false)
      toast.success('Secret restored successfully!')
    },
    onError: () => toast.error('Failed to restore version'),
  })

  return (
    <div className="relative pl-6 py-4 border-l-2 border-neutral-200 dark:border-neutral-800 last:border-transparent last:pb-0">
      <div className="absolute left-[-5px] top-5 w-2 h-2 rounded-full bg-neutral-400 dark:bg-neutral-600 ring-4 ring-white dark:ring-neutral-900" />
      
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-neutral-900 dark:text-white">
            Changed
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {formatDatetime(version.createdAt)}
          </p>

          {showValue && (
            <div className="mt-3 bg-neutral-50 dark:bg-neutral-950 rounded border border-neutral-100 dark:border-neutral-800 p-3">
              {isLoading ? (
                <SkeletonText lines={1} />
              ) : (
                <div className="flex justify-between items-start gap-2">
                  <code className="text-sm break-all break-words text-neutral-800 dark:text-neutral-200">{decryptedValue}</code>
                  <CopyButton getValue={() => decryptedValue} size={14} />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Button variant="secondary" size="xs" onClick={() => setShowValue(!showValue)}>
            {showValue ? <EyeOff size={14} /> : <Eye size={14} />}
            {showValue ? 'Hide' : 'Reveal'}
          </Button>
          
          {canRestore && (
            <Button variant="outline" size="xs" onClick={() => setRestoreConfirm(true)}>
              <RotateCcw size={14} /> Restore
            </Button>
          )}
        </div>
      </div>

      <Modal
        open={restoreConfirm}
        onClose={() => setRestoreConfirm(false)}
        title="Restore Version"
        size="sm"
      >
        <div className="p-6 space-y-6">
          <div className="flex gap-3 text-warning-700 bg-warning-50 dark:bg-warning-900/30 p-4 rounded-lg border border-warning-200 dark:border-warning-800">
            <AlertCircle size={20} className="shrink-0" />
            <p className="text-sm">
              This will replace the current live value. The current value will be saved in history too, so you can undo this if needed.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setRestoreConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={restoreMutation.isPending}
              onClick={() => restoreMutation.mutate()}
            >
              Restore Version
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default function SecretVersionHistory({ projectId, secretId, canRestore }) {
  const { data: versions, isLoading } = useQuery({
    queryKey: ['secret-versions', projectId, secretId],
    queryFn: () => secretService.getVersions(projectId, secretId),
  })

  if (isLoading) {
    return (
      <div className="card p-5 mt-6">
        <SkeletonText lines={2} />
      </div>
    )
  }

  if (!versions || versions.length === 0) {
    return null
  }

  return (
    <div className="card mt-6 overflow-hidden">
      <div className="px-5 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center gap-2">
        <History size={16} className="text-neutral-500" />
        <h3 className="font-semibold text-neutral-900 dark:text-white">Version History</h3>
      </div>
      <div className="p-5">
        <div className="ml-2">
          {versions.map(version => (
            <VersionItem 
              key={version.id} 
              version={version} 
              projectId={projectId} 
              secretId={secretId}
              canRestore={canRestore}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
