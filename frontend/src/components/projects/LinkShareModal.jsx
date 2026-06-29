import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Link as LinkIcon, Trash2, Copy, Check, Lock, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import Button from '../ui/Button'
import { projectService } from '../../services/projectService'

export default function LinkShareModal({ project, onClose }) {
  const [password, setPassword] = useState('')
  const [recipientEmail, setRecipientEmail] = useState('')
  const [hoursValid, setHoursValid] = useState(24)
  const [copiedToken, setCopiedToken] = useState(null)
  
  const queryClient = useQueryClient()

  const { data: links, isLoading } = useQuery({
    queryKey: ['project-links', project.id],
    queryFn: () => projectService.getLinks(project.id)
  })

  const linkMutation = useMutation({
    mutationFn: (data) => projectService.createLink(project.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['project-links', project.id])
      toast.success('Secure link generated')
      setPassword('')
      setRecipientEmail('')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to generate link')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (linkId) => projectService.deleteLink(project.id, linkId),
    onSuccess: () => {
      queryClient.invalidateQueries(['project-links', project.id])
      toast.success('Link deleted')
    },
    onError: () => toast.error('Failed to delete link')
  })

  const handleGenerate = (e) => {
    e.preventDefault()
    if (!password || !recipientEmail) return
    linkMutation.mutate({ password, recipientEmail, hoursValid: parseInt(hoursValid) })
  }

  const copyToClipboard = (token) => {
    const shareUrl = `${window.location.origin}/share/${token}`
    navigator.clipboard.writeText(shareUrl)
    setCopiedToken(token)
    toast.success('Link copied to clipboard')
    setTimeout(() => setCopiedToken(null), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-slide-up">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
              <LinkIcon size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Magic Share Link</h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Share secrets publicly via URL</p>
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
          <form onSubmit={handleGenerate} className="space-y-4 mb-6">
            <div className="space-y-1">
              <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-1">
                <Lock size={12} /> Password Protection
              </label>
              <input
                type="password"
                placeholder="Set a password for the link"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full h-10 px-3 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-1">
                <Lock size={12} /> Recipient Email (For 2FA)
              </label>
              <input
                type="email"
                placeholder="Required for OTP verification"
                required
                value={recipientEmail}
                onChange={e => setRecipientEmail(e.target.value)}
                className="w-full h-10 px-3 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
            
            <div className="flex gap-3">
              <div className="flex-1 space-y-1">
                <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-1">
                  <Clock size={12} /> Valid for (Hours)
                </label>
                <select
                  value={hoursValid}
                  onChange={e => setHoursValid(e.target.value)}
                  className="w-full h-10 px-3 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-sm text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="1">1 Hour</option>
                  <option value="12">12 Hours</option>
                  <option value="24">24 Hours (1 Day)</option>
                  <option value="168">168 Hours (7 Days)</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button type="submit" loading={linkMutation.isPending} className="h-10 px-6 bg-indigo-600 hover:bg-indigo-700 text-white">
                  Generate Link
                </Button>
              </div>
            </div>
          </form>

          {/* List of Links */}
          <div>
            <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">
              Active Links
            </h3>
            <div className="space-y-3 max-h-40 overflow-y-auto pr-1">
              {isLoading ? (
                <div className="text-sm text-neutral-500">Loading...</div>
              ) : links?.length === 0 ? (
                <div className="text-sm text-neutral-500 italic">No active links generated yet.</div>
              ) : (
                links?.map(link => {
                  const isCopied = copiedToken === link.token;
                  return (
                    <div key={link.id} className="flex items-center justify-between p-3 rounded-lg border border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
                      <div className="flex flex-col gap-1 w-full mr-3 truncate">
                        <div className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                          {window.location.origin}/share/{link.token}
                        </div>
                        <div className="text-xs text-neutral-500 truncate mb-1">
                          For: {link.recipientEmail || 'Anyone'}
                        </div>
                        <div className="text-xs text-neutral-500 flex items-center gap-1">
                          {link.isExpired ? (
                            <span className="text-danger-500 font-medium">Expired</span>
                          ) : (
                            <span>Expires: {new Date(link.expiresAt).toLocaleString()}</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => copyToClipboard(link.token)}
                          className={`p-2 rounded-lg transition-colors ${isCopied ? 'bg-success-100 dark:bg-success-900/30 text-success-600 dark:text-success-400' : 'text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-700'}`}
                          title="Copy Link"
                        >
                          {isCopied ? <Check size={16} /> : <Copy size={16} />}
                        </button>
                        <button
                          onClick={() => deleteMutation.mutate(link.id)}
                          disabled={deleteMutation.isPending}
                          className="p-2 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-500/10 rounded-lg transition-colors disabled:opacity-50"
                          title="Revoke Link"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
