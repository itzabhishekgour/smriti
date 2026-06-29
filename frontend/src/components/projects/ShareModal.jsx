import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Users, UserMinus, Shield } from 'lucide-react'
import toast from 'react-hot-toast'
import Button from '../ui/Button'
import { projectService } from '../../services/projectService'

export default function ShareModal({ project, onClose }) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('VIEWER')
  const queryClient = useQueryClient()

  const { data: shares, isLoading } = useQuery({
    queryKey: ['project-shares', project.id],
    queryFn: () => projectService.getShares(project.id)
  })

  const shareMutation = useMutation({
    mutationFn: (data) => projectService.shareProject(project.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['project-shares', project.id])
      toast.success('Project shared successfully')
      setEmail('')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to share project')
    }
  })

  const removeShareMutation = useMutation({
    mutationFn: (shareId) => projectService.removeShare(project.id, shareId),
    onSuccess: () => {
      queryClient.invalidateQueries(['project-shares', project.id])
      toast.success('Access revoked')
    },
    onError: () => toast.error('Failed to revoke access')
  })

  const handleShare = (e) => {
    e.preventDefault()
    if (!email) return
    shareMutation.mutate({ email, role })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-slide-up">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-lg">
              <Users size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Share Project</h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Invite team members</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <div className="p-6">
          <form onSubmit={handleShare} className="flex gap-2 mb-6">
            <div className="flex-1">
              <input
                type="email"
                placeholder="User email address"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full h-10 px-3 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
              />
            </div>
            <select
              value={role}
              onChange={e => setRole(e.target.value)}
              className="h-10 px-3 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-sm text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            >
              <option value="VIEWER">Viewer</option>
              <option value="EDITOR">Editor</option>
            </select>
            <Button type="submit" loading={shareMutation.isPending} size="sm">
              Invite
            </Button>
          </form>

          {/* List of Shares */}
          <div>
            <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">
              People with access
            </h3>
            <div className="space-y-3">
              {isLoading ? (
                <div className="text-sm text-neutral-500">Loading...</div>
              ) : shares?.length === 0 ? (
                <div className="text-sm text-neutral-500 italic">No one else has access yet.</div>
              ) : (
                shares?.map(share => (
                  <div key={share.id} className="flex items-center justify-between p-3 rounded-lg border border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-medium text-sm">
                        {share.userName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-neutral-900 dark:text-white">{share.userName}</div>
                        <div className="text-xs text-neutral-500">{share.userEmail}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-xs text-neutral-500 px-2 py-1 bg-white dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700">
                        <Shield size={12} />
                        {share.role}
                      </div>
                      <button
                        onClick={() => removeShareMutation.mutate(share.id)}
                        disabled={removeShareMutation.isPending}
                        className="p-1.5 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-500/10 rounded transition-colors disabled:opacity-50"
                        title="Remove access"
                      >
                        <UserMinus size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
