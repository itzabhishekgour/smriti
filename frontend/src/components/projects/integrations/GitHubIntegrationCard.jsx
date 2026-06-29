import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Box, RefreshCw, Unplug, Check, AlertCircle } from 'lucide-react'
import Button from '../../ui/Button'
import Modal from '../../ui/Modal'
import Card, { CardHeader, CardBody } from '../../ui/Card'
import { Skeleton } from '../../ui/Skeleton'
import { githubIntegrationService } from '../../../services/githubIntegrationService'
import { githubAccountService } from '../../../services/githubAccountService'
import toast from 'react-hot-toast'

export default function GitHubIntegrationCard({ projectId, canEdit }) {
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState('oauth')
  const [selectedRepo, setSelectedRepo] = useState('')
  const [repoOwner, setRepoOwner] = useState('')
  const [repoName, setRepoName] = useState('')
  const [accessToken, setAccessToken] = useState('')
  const [syncResult, setSyncResult] = useState(null)
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false)

  const { data: status, isLoading } = useQuery({
    queryKey: ['githubIntegration', projectId],
    queryFn: () => githubIntegrationService.getStatus(projectId),
    enabled: !!projectId && canEdit,
  })

  const { data: accountStatus } = useQuery({
    queryKey: ['githubAccountStatus'],
    queryFn: () => githubAccountService.getStatus(),
    enabled: canEdit && !status?.connected,
  })

  const { data: repos, isLoading: reposLoading } = useQuery({
    queryKey: ['githubRepositories'],
    queryFn: () => githubAccountService.getRepositories(),
    enabled: !!accountStatus?.connected && activeTab === 'oauth' && !status?.connected,
  })

  const connectMutation = useMutation({
    mutationFn: (data) => githubIntegrationService.connect(projectId, data),
    onSuccess: () => {
      qc.invalidateQueries(['githubIntegration', projectId])
      toast.success('GitHub repository connected!')
      setRepoOwner('')
      setRepoName('')
      setAccessToken('')
      setSelectedRepo('')
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
      setShowDisconnectConfirm(false)
      toast.success('Disconnected from GitHub')
    },
    onError: () => toast.error('Failed to disconnect')
  })

  if (!canEdit) return null

  if (isLoading) {
    return (
      <Card>
        <CardBody className="h-32 flex items-center justify-center">
          <Skeleton className="h-16 w-full" />
        </CardBody>
      </Card>
    )
  }

  const isConnected = status?.connected

  return (
    <Card>
      <CardHeader className="flex items-center gap-3 !py-4">
        <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-800 dark:text-neutral-200">
          <Box size={20} />
        </div>
        <div>
          <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">GitHub Actions</h3>
          <p className="text-sm text-neutral-500">Sync secrets directly to your GitHub repository.</p>
        </div>
      </CardHeader>

      <CardBody className="!p-5">
      {!isConnected ? (
        <div className="space-y-4">
          <div className="flex border-b border-neutral-200 dark:border-neutral-800 mb-4">
            <button
              className={`pb-2 px-4 text-sm font-medium transition-colors border-b-2 ${activeTab === 'oauth' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
              onClick={() => setActiveTab('oauth')}
            >
              Connected Account
            </button>
            <button
              className={`pb-2 px-4 text-sm font-medium transition-colors border-b-2 ${activeTab === 'manual' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
              onClick={() => setActiveTab('manual')}
            >
              Manual PAT (Backup)
            </button>
          </div>

          {activeTab === 'oauth' ? (
            <div className="space-y-4">
              {accountStatus?.connected ? (
                reposLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <form onSubmit={e => {
                    e.preventDefault()
                    if (!selectedRepo) {
                      toast.error('Please select a repository')
                      return
                    }
                    const [owner, name] = selectedRepo.split('/')
                    connectMutation.mutate({ repoOwner: owner, repoName: name, accessToken: '' })
                  }}>
                    <label className="block text-sm font-medium mb-1">Select Repository</label>
                    <select
                      className="input-base w-full mb-4"
                      value={selectedRepo}
                      onChange={e => setSelectedRepo(e.target.value)}
                    >
                      <option value="">-- Choose a repository --</option>
                      {repos?.map(r => (
                        <option key={r.id} value={r.full_name}>{r.full_name} {r.private ? '(Private)' : ''}</option>
                      ))}
                    </select>
                    <Button type="submit" loading={connectMutation.isPending}>
                      Connect Selected Repository
                    </Button>
                  </form>
                )
              ) : (
                <div className="text-sm text-neutral-500 space-y-3">
                  <p>You haven't connected your GitHub account globally yet.</p>
                  <Button variant="secondary" onClick={() => window.location.href = '/settings'}>
                    Go to Settings to Connect Account
                  </Button>
                </div>
              )}
            </div>
          ) : (
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-100 dark:border-neutral-800 gap-4">
            <div className="break-all">
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
                onClick={() => setShowDisconnectConfirm(true)}
              >
                <Unplug size={14} /> Disconnect
              </Button>
            </div>
          </div>

          {syncResult && (
            <div className="p-4 rounded-lg bg-success-50 dark:bg-success-900/30 border border-success-200 dark:border-success-800 text-sm mt-6">
              <h4 className="font-semibold text-success-800 dark:text-success-300 flex items-center gap-2 mb-2">
                <Check size={16} /> Sync Complete
              </h4>
              <p className="text-success-700 dark:text-success-400">
                Successfully synced {syncResult.synced} secrets to GitHub.
              </p>
              {syncResult.skipped?.length > 0 && (
                <div className="mt-3 space-y-1">
                  <p className="font-medium text-warning-700 dark:text-warning-400 flex items-center gap-1">
                    <AlertCircle size={14} /> Skipped {syncResult.skipped.length} secrets:
                  </p>
                  <ul className="list-disc pl-5 text-warning-600 dark:text-warning-500 text-xs space-y-1">
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
      </CardBody>

      <Modal
        open={showDisconnectConfirm}
        onClose={() => setShowDisconnectConfirm(false)}
        title="Disconnect GitHub"
        size="sm"
      >
        <div className="p-6 space-y-6">
          <p className="text-sm text-neutral-600 dark:text-neutral-300">
            Are you sure you want to disconnect <strong>{status?.repoOwner}/{status?.repoName}</strong>?
            <br /><br />
            Secrets will no longer be synced, but existing secrets on GitHub will not be deleted.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowDisconnectConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={disconnectMutation.isPending}
              onClick={() => disconnectMutation.mutate()}
            >
              Disconnect
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  )
}
