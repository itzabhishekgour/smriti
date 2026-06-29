import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Box, RefreshCw, Unplug, Check, AlertCircle } from 'lucide-react'
import Button from '../../ui/Button'
import { githubIntegrationService } from '../../../services/githubIntegrationService'
import toast from 'react-hot-toast'

export default function GitHubIntegrationCard({ projectId, canEdit }) {
  const qc = useQueryClient()
  const [repoOwner, setRepoOwner] = useState('')
  const [repoName, setRepoName] = useState('')
  const [accessToken, setAccessToken] = useState('')
  const [syncResult, setSyncResult] = useState(null)

  const { data: status, isLoading } = useQuery({
    queryKey: ['githubIntegration', projectId],
    queryFn: () => githubIntegrationService.getStatus(projectId),
    enabled: !!projectId && canEdit,
  })

  const connectMutation = useMutation({
    mutationFn: (data) => githubIntegrationService.connect(projectId, data),
    onSuccess: () => {
      qc.invalidateQueries(['githubIntegration', projectId])
      toast.success('GitHub repository connected!')
      setRepoOwner('')
      setRepoName('')
      setAccessToken('')
    },
    onError: (e) => {
      toast.error(e.response?.data?.message || 'Failed to connect. Check PAT and repo details.')
    }
  })

  const syncMutation = useMutation({
    mutationFn: () => githubIntegrationService.sync(projectId),
    onSuccess: (data) => {
      qc.invalidateQueries(['githubIntegration', projectId])
      setSyncResult(data)
      toast.success('Secrets synced to GitHub!')
    },
    onError: () => {
      toast.error('Failed to sync secrets')
    }
  })

  const disconnectMutation = useMutation({
    mutationFn: () => githubIntegrationService.disconnect(projectId),
    onSuccess: () => {
      qc.invalidateQueries(['githubIntegration', projectId])
      setSyncResult(null)
      toast.success('Disconnected from GitHub')
    },
    onError: () => toast.error('Failed to disconnect')
  })

  if (!canEdit) return null

  if (isLoading) {
    return <div className="card animate-pulse h-32" />
  }

  const isConnected = status?.connected

  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-800 dark:text-neutral-200">
          <Box size={20} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">GitHub Actions</h2>
          <p className="text-sm text-neutral-500">Sync secrets directly to your GitHub repository.</p>
        </div>
      </div>

      {!isConnected ? (
        <form 
          className="space-y-4"
          onSubmit={e => {
            e.preventDefault()
            if (!repoOwner || !repoName || !accessToken) {
              toast.error('All fields are required')
              return
            }
            connectMutation.mutate({ repoOwner, repoName, accessToken })
          }}
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Repository Owner</label>
              <input
                className="input-base w-full"
                placeholder="e.g. facebook"
                value={repoOwner}
                onChange={e => setRepoOwner(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Repository Name</label>
              <input
                className="input-base w-full"
                placeholder="e.g. react"
                value={repoName}
                onChange={e => setRepoName(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Personal Access Token (PAT)</label>
            <input
              type="password"
              className="input-base w-full"
              placeholder="ghp_..."
              value={accessToken}
              onChange={e => setAccessToken(e.target.value)}
            />
            <p className="text-xs text-neutral-500 mt-1.5">
              Needs a fine-grained PAT with <strong>Secrets: Read & Write</strong> access to the repository, or a classic PAT with <strong>repo</strong> scope.
            </p>
          </div>
          <div className="pt-2">
            <Button type="submit" loading={connectMutation.isPending}>
              Connect Repository
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-100 dark:border-neutral-800">
            <div>
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                Connected to {status.repoOwner}/{status.repoName}
              </p>
              <p className="text-xs text-neutral-500 mt-0.5">
                Last synced: {status.lastSyncedAt ? new Date(status.lastSyncedAt).toLocaleString() : 'Never'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                variant="secondary" 
                onClick={() => syncMutation.mutate()}
                loading={syncMutation.isPending}
              >
                <RefreshCw size={14} className={syncMutation.isPending ? 'animate-spin' : ''} /> Sync Now
              </Button>
              <Button 
                size="sm" 
                variant="danger" 
                onClick={() => disconnectMutation.mutate()}
                loading={disconnectMutation.isPending}
              >
                <Unplug size={14} /> Disconnect
              </Button>
            </div>
          </div>

          {syncResult && (
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 text-sm">
              <h4 className="font-semibold text-green-800 dark:text-green-300 flex items-center gap-2 mb-2">
                <Check size={16} /> Sync Complete
              </h4>
              <p className="text-green-700 dark:text-green-400">
                Successfully synced {syncResult.synced} secrets to GitHub.
              </p>
              {syncResult.skipped?.length > 0 && (
                <div className="mt-3 space-y-1">
                  <p className="font-medium text-yellow-700 dark:text-yellow-400 flex items-center gap-1">
                    <AlertCircle size={14} /> Skipped {syncResult.skipped.length} secrets:
                  </p>
                  <ul className="list-disc pl-5 text-yellow-600 dark:text-yellow-500 text-xs space-y-1">
                    {syncResult.skipped.map((skip, i) => (
                      <li key={i}>{skip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
