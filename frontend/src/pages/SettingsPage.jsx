import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../hooks/useTheme'
import { Shield, User, Mail, Calendar, Sun, Moon, Monitor } from 'lucide-react'
import { formatDate } from '../utils/formatDate'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { githubAccountService } from '../services/githubAccountService'
import Button from '../components/ui/Button'
import toast from 'react-hot-toast'
import Modal from '../components/ui/Modal'
import { authService } from '../services/authService'

export default function SettingsPage() {
  const { user } = useAuth()
  const { theme, setTheme } = useTheme()
  const [searchParams] = useSearchParams()
  const [githubState, setGithubState] = useState({ loading: true, connected: false, username: null })
  const [actionLoading, setActionLoading] = useState(false)
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false)
  
  const [passwords, setPasswords] = useState({ current: '', new: '' })
  const [passwordLoading, setPasswordLoading] = useState(false)

  useEffect(() => {
    // Check URL params for oauth callback status
    const connectedParam = searchParams.get('github_connected')
    const errorParam = searchParams.get('error')
    
    if (connectedParam === 'true') {
      toast.success('Successfully connected to GitHub')
      // Remove params from URL silently
      window.history.replaceState({}, document.title, window.location.pathname)
    } else if (connectedParam === 'false') {
      toast.error('Failed to connect to GitHub: ' + (errorParam || 'Unknown error'))
      window.history.replaceState({}, document.title, window.location.pathname)
    }
    
    // Fetch current status
    githubAccountService.getStatus()
      .then(res => {
        setGithubState({
          loading: false,
          connected: res.connected,
          username: res.githubUsername
        })
      })
      .catch(() => setGithubState({ loading: false, connected: false }))
  }, [searchParams])

  const handleConnectGithub = async () => {
    setActionLoading(true)
    try {
      const res = await githubAccountService.getConnectUrl()
      window.location.href = res.url
    } catch (err) {
      toast.error('Failed to start GitHub connection')
      setActionLoading(false)
    }
  }

  const handleDisconnectGithub = async () => {
    setShowDisconnectConfirm(false)
    setActionLoading(true)
    try {
      await githubAccountService.disconnect()
      setGithubState({ loading: false, connected: false, username: null })
      toast.success('GitHub disconnected successfully')
    } catch (err) {
      toast.error('Failed to disconnect GitHub')
    } finally {
      setActionLoading(false)
    }
  }

  const handleUpdatePassword = async (e) => {
    e.preventDefault()
    if (passwords.new.length < 6) return toast.error('Password must be at least 6 characters')
    if (user?.hasPassword && !passwords.current) return toast.error('Current password is required')
    
    setPasswordLoading(true)
    try {
      await authService.updatePassword({ 
        currentPassword: passwords.current, 
        newPassword: passwords.new 
      })
      toast.success('Password updated successfully')
      setPasswords({ current: '', new: '' })
      // Trigger a silent reload of user context if needed, but since we know it's set, we can just pretend it's updated.
      if (!user.hasPassword) {
        window.location.reload()
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password')
    } finally {
      setPasswordLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 mb-1">Settings</h1>
      <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-8">Manage your account and preferences</p>

      {/* Profile */}
      <div className="card mb-6">
        <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Profile</h2>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center text-2xl font-semibold text-primary-700 dark:text-primary-300 shrink-0">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-neutral-900 dark:text-neutral-100">{user?.name}</p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">{user?.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="flex items-start gap-3">
              <User size={15} className="text-neutral-400 mt-0.5" />
              <div>
                <p className="text-xs text-neutral-400">Name</p>
                <p className="text-sm text-neutral-800 dark:text-neutral-200">{user?.name}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail size={15} className="text-neutral-400 mt-0.5" />
              <div>
                <p className="text-xs text-neutral-400">Email</p>
                <p className="text-sm text-neutral-800 dark:text-neutral-200">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Appearance */}
      <div className="card mb-6">
        <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Appearance</h2>
        </div>
        <div className="px-6 py-5">
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="flex-1">
              <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">Theme Preference</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4 mt-1">Choose how Smriti looks to you. System mode follows your OS preference.</p>
              
              <div className="inline-flex bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg border border-neutral-200 dark:border-neutral-700">
                {['light', 'dark', 'system'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                      theme === t 
                        ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm border border-neutral-200 dark:border-neutral-600' 
                        : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 border border-transparent'
                    }`}
                  >
                    {t === 'light' ? <Sun size={14} /> : t === 'dark' ? <Moon size={14} /> : <Monitor size={14} />}
                    <span className="capitalize">{t}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Integrations */}
      <div className="card mb-6">
        <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Integrations</h2>
        </div>
        <div className="px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-neutral-900 dark:text-white" fill="currentColor">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.379.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z"></path>
                </svg>
                <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">GitHub Account</p>
                {githubState.connected && (
                  <span className="inline-flex items-center rounded-full bg-success-50 dark:bg-success-900/30 px-2 py-0.5 text-xs font-medium text-success-700 dark:text-success-400">
                    Connected as {githubState.username}
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mt-1">
                Connect your GitHub account to enable the Repository Browser. This allows you to link specific repositories and push secrets to them directly from Smriti.
              </p>
            </div>
            
            <div className="flex-shrink-0 ml-4">
              {githubState.loading ? (
                <div className="h-9 w-24 bg-neutral-100 dark:bg-neutral-800 animate-pulse rounded-md"></div>
              ) : githubState.connected ? (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowDisconnectConfirm(true)}
                  loading={actionLoading}
                  className="text-danger-600 dark:text-danger-400 border-danger-200 dark:border-danger-900/50 hover:bg-danger-50 dark:hover:bg-danger-900/30"
                >
                  Disconnect
                </Button>
              ) : (
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={handleConnectGithub}
                  loading={actionLoading}
                >
                  Connect
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Password & Authentication */}
      <div className="card mb-6">
        <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Password & Authentication</h2>
        </div>
        <div className="px-6 py-5">
          <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-sm">
            {user?.hasPassword && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Current Password</label>
                <input 
                  type="password" 
                  className="input-base w-full" 
                  value={passwords.current}
                  onChange={e => setPasswords({...passwords, current: e.target.value})}
                  placeholder="Enter current password"
                />
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">New Password</label>
              <input 
                type="password" 
                className="input-base w-full" 
                value={passwords.new}
                onChange={e => setPasswords({...passwords, new: e.target.value})}
                placeholder="At least 6 characters"
              />
            </div>
            <Button 
              type="submit" 
              variant="primary" 
              loading={passwordLoading}
              disabled={!passwords.new || (user?.hasPassword && !passwords.current)}
            >
              {user?.hasPassword ? 'Update Password' : 'Set Password'}
            </Button>
          </form>
        </div>
      </div>

      {/* Security */}
      <div className="card mb-6">
        <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Security</h2>
        </div>
        <div className="px-6 py-5 space-y-3">
          {[
            ['Encryption', 'AES-256-GCM — all secret values encrypted at rest'],
            ['Authentication', 'JWT — 24-hour expiry, stateless sessions'],
            ['Secret Scanning', 'Pre-commit hook to prevent credential leaks in Git'],
            ['Audit Logging', 'Immutable tracking of all read/write/delete actions'],
            ['Clipboard', 'Auto-clears after 15 seconds when you copy a secret'],
          ].map(([title, desc]) => (
            <div key={title} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-md bg-success-100 flex items-center justify-center shrink-0 mt-0.5">
                <Shield size={12} className="text-success-600 dark:text-success-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{title}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Account Actions */}
      <div className="card mb-6">
        <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Account Actions</h2>
        </div>
        <div className="px-6 py-5">
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
            Sign out of your account on this device.
          </p>
          <button
            onClick={() => {
              localStorage.removeItem('token')
              window.location.href = '/login'
            }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-danger-600 dark:text-danger-400 bg-danger-50 dark:bg-danger-900/30 hover:bg-danger-100 dark:hover:bg-danger-900/50 rounded-md transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            Log out
          </button>
        </div>
      </div>

      {/* About */}
      <div className="card">
        <div className="px-6 py-4">
          <p className="text-xs text-neutral-400 dark:text-neutral-500 text-center">
            Smriti v1.0 · A{' '}
            <span className="font-semibold text-neutral-600 dark:text-neutral-300 tracking-wide uppercase text-[10px]">Tinexus</span>{' '}
            Technology
          </p>
        </div>
      </div>

      {/* Disconnect Modal */}
      <Modal 
        open={showDisconnectConfirm} 
        onClose={() => setShowDisconnectConfirm(false)}
        title="Disconnect GitHub Account"
        size="sm"
      >
        <div className="p-6">
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
            Are you sure you want to disconnect your GitHub account <strong>{githubState.username}</strong>? This will revoke Smriti's access to your repositories.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowDisconnectConfirm(false)}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              className="bg-danger-600 hover:bg-danger-700 text-white"
              loading={actionLoading}
              onClick={handleDisconnectGithub}
            >
              Disconnect
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
