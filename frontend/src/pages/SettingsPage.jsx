import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../hooks/useTheme'
import { User, Sun, Moon, Monitor, GitBranch, LogOut, Key, ChevronRight, ChevronLeft, FileText, Lock, Shield } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { cn } from '../utils/cn'
import { githubAccountService } from '../services/githubAccountService'
import { APP_VERSION, APP_AUTHOR } from '../config/version'
import Button from '../components/ui/Button'
import toast from 'react-hot-toast'
import Modal from '../components/ui/Modal'
import { authService } from '../services/authService'

const NAV = [
  { id: 'account',      label: 'Account',      icon: User },
  { id: 'appearance',   label: 'Appearance',   icon: Sun },
  { id: 'notes',        label: 'Notes',        icon: FileText },
  { id: 'security',     label: 'Security',     icon: Shield },
  { id: 'integrations', label: 'Integrations', icon: GitBranch },
]

function SectionCard({ title, description, children }) {
  return (
    <div className="card overflow-hidden">
      <div className="px-6 py-5 border-b border-neutral-100 dark:border-neutral-800">
        <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">{title}</h2>
        {description && <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">{description}</p>}
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  )
}

function Row({ label, description, action }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
      <div>
        <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{label}</p>
        {description && <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{description}</p>}
      </div>
      <div className="flex-shrink-0 ml-6">{action}</div>
    </div>
  )
}

export default function SettingsPage() {
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const [searchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState('account')
  const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false)
  const [githubState, setGithubState] = useState({ loading: true, connected: false, username: null })
  const [actionLoading, setActionLoading] = useState(false)
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false)
  const [passwords, setPasswords] = useState({ current: '', new: '' })
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(() => {
    return localStorage.getItem('smriti_autosave') !== 'false'
  })

  const toggleAutoSave = () => {
    const newValue = !autoSaveEnabled
    setAutoSaveEnabled(newValue)
    localStorage.setItem('smriti_autosave', newValue)
    toast.success(`Auto-save ${newValue ? 'enabled' : 'disabled'}`)
  }

  useEffect(() => {
    const connectedParam = searchParams.get('github_connected')
    const errorParam = searchParams.get('error')
    if (connectedParam === 'true') {
      toast.success('Successfully connected to GitHub')
      window.history.replaceState({}, document.title, window.location.pathname)
    } else if (connectedParam === 'false') {
      toast.error('Failed to connect to GitHub: ' + (errorParam || 'Unknown error'))
      window.history.replaceState({}, document.title, window.location.pathname)
    }
    githubAccountService.getStatus()
      .then(res => setGithubState({ loading: false, connected: res.connected, username: res.githubUsername }))
      .catch(() => setGithubState({ loading: false, connected: false }))
  }, [searchParams])

  const handleConnectGithub = async () => {
    setActionLoading(true)
    try {
      const res = await githubAccountService.getConnectUrl()
      window.location.href = res.url
    } catch {
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
      toast.success('GitHub disconnected')
    } catch {
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
      await authService.updatePassword({ currentPassword: passwords.current, newPassword: passwords.new })
      toast.success('Password updated')
      setPasswords({ current: '', new: '' })
      if (!user.hasPassword) window.location.reload()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password')
    } finally {
      setPasswordLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className={cn(
        "mb-6 sm:mb-8",
        isMobileDetailOpen ? "hidden sm:block" : "block"
      )}>
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">Settings</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Manage your account, appearance, and integrations.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 items-start">
        {/* Sidebar Nav */}
        <nav className="w-56 shrink-0 hidden sm:flex flex-col sticky top-8">
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200/60 dark:border-neutral-800/60 overflow-hidden shadow-sm p-1.5 flex flex-col gap-0.5">
            {NAV.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-left font-medium",
                  activeTab === id
                    ? "bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 shadow-sm"
                    : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 hover:text-neutral-900 dark:hover:text-neutral-200"
                )}
              >
                <Icon size={16} className={activeTab === id ? "text-primary-500" : ""} />
                {label}
              </button>
            ))}
          </div>

        </nav>

        {/* Mobile Menu (List) */}
        <div className={cn(
          "w-full sm:hidden",
          isMobileDetailOpen ? "hidden" : "block"
        )}>
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden divide-y divide-neutral-100 dark:divide-neutral-800 shadow-sm">
            {NAV.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => { setActiveTab(id); setIsMobileDetailOpen(true); window.scrollTo(0, 0); }}
                className="w-full flex items-center justify-between p-4 bg-white dark:bg-neutral-900 active:bg-neutral-50 dark:active:bg-neutral-800 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-400">
                    <Icon size={18} />
                  </div>
                  <span className="text-base font-medium text-neutral-900 dark:text-neutral-100">{label}</span>
                </div>
                <ChevronRight size={18} className="text-neutral-400" />
              </button>
            ))}
          </div>

          {/* Logout Mobile */}
          <button
            onClick={() => { logout(); window.location.href = '/login' }}
            className="w-full mt-6 flex items-center justify-center gap-2 p-4 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 text-danger-600 dark:text-danger-400 font-medium active:bg-danger-50 dark:active:bg-danger-900/30 transition-colors shadow-sm"
          >
            <LogOut size={18} />
            Log out
          </button>
        </div>

        {/* Content */}
        <div className={cn(
          "flex-1 min-w-0 w-full space-y-5",
          !isMobileDetailOpen ? "hidden sm:block" : "block"
        )}>
          {/* Mobile Back Button */}
          <button 
            onClick={() => setIsMobileDetailOpen(false)}
            className="sm:hidden flex items-center gap-1.5 text-sm font-medium text-neutral-500 mb-2 -mt-2 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
          >
            <ChevronLeft size={18} />
            Back to Settings
          </button>

          {/* ── ACCOUNT ── */}
          {activeTab === 'account' && (
            <>
              <SectionCard title="Profile" description="Your personal information on this account.">
                <div className="flex items-center gap-4 pb-5 mb-5 border-b border-neutral-100 dark:border-neutral-800">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-2xl font-bold text-white shrink-0 shadow-md">
                    {user?.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{user?.name}</p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">{user?.email}</p>
                    <span className="inline-block mt-1.5 text-xs px-2 py-0.5 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-medium">
                      {user?.role ?? 'Member'}
                    </span>
                  </div>
                </div>

                <Row
                  label="Full Name"
                  description={user?.name}
                  action={
                    <span className="text-xs text-neutral-400 flex items-center gap-1">
                      Read-only <ChevronRight size={12} />
                    </span>
                  }
                />
                <Row
                  label="Email"
                  description={user?.email}
                  action={
                    <span className="text-xs text-neutral-400 flex items-center gap-1">
                      Read-only <ChevronRight size={12} />
                    </span>
                  }
                />
              </SectionCard>

              <SectionCard
                title={user?.hasPassword ? 'Change Password' : 'Set a Password'}
                description={user?.hasPassword ? 'Update the password you use to log in.' : 'Add a password to your account alongside GitHub login.'}
              >
                <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-sm">
                  {user?.hasPassword && (
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Current Password</label>
                      <input
                        type="password"
                        className="input-base w-full"
                        value={passwords.current}
                        onChange={e => setPasswords({ ...passwords, current: e.target.value })}
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
                      onChange={e => setPasswords({ ...passwords, new: e.target.value })}
                      placeholder="At least 6 characters"
                    />
                  </div>
                  <Button
                    type="submit"
                    size="sm"
                    loading={passwordLoading}
                    disabled={!passwords.new || (user?.hasPassword && !passwords.current)}
                  >
                    <Key size={14} />
                    {user?.hasPassword ? 'Update Password' : 'Set Password'}
                  </Button>
                </form>
              </SectionCard>

              {/* Danger zone */}
              <div className="rounded-xl border border-danger-200 dark:border-danger-900/60 overflow-hidden">
                <div className="px-6 py-4 bg-danger-50 dark:bg-danger-900/20 border-b border-danger-200 dark:border-danger-900/60">
                  <h2 className="text-sm font-semibold text-danger-800 dark:text-danger-400">Danger Zone</h2>
                </div>
                <div className="px-6 py-5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">Log out</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Sign out of this device immediately.</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-danger-600 border-danger-300 hover:bg-danger-50 dark:text-danger-400 dark:border-danger-800 dark:hover:bg-danger-900/30"
                    onClick={() => { logout(); window.location.href = '/login' }}
                  >
                    <LogOut size={14} />
                    Log out
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* ── APPEARANCE ── */}
          {activeTab === 'appearance' && (
            <SectionCard title="Theme" description="Choose how Smriti looks. System mode follows your OS setting.">
              <div className="grid grid-cols-3 gap-3 max-w-sm">
                {[
                  { id: 'light',  label: 'Light',  icon: Sun },
                  { id: 'dark',   label: 'Dark',   icon: Moon },
                  { id: 'system', label: 'System', icon: Monitor },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setTheme(id)}
                    className={`flex flex-col items-center gap-2.5 p-4 rounded-xl border-2 transition-all ${
                      theme === id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                        : 'border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:border-neutral-300 dark:hover:border-neutral-600'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="text-sm font-medium">{label}</span>
                    {theme === id && (
                      <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                    )}
                  </button>
                ))}
              </div>
            </SectionCard>
          )}

          {/* ── NOTES ── */}
          {activeTab === 'notes' && (
            <SectionCard title="Notes Preferences" description="Configure how your secure document editor behaves.">
              <Row
                label="Auto-Save Documents"
                description="Automatically save changes 1 second after you stop typing. If disabled, you must manually click Save."
                action={
                  <button 
                    onClick={toggleAutoSave}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full focus:outline-none transition-colors duration-200 ease-in-out ${autoSaveEnabled ? 'bg-primary-600' : 'bg-neutral-200 dark:bg-neutral-700'}`}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${autoSaveEnabled ? 'translate-x-2' : '-translate-x-2'}`}
                    />
                  </button>
                }
              />
              <Row
                label="Encryption Level"
                description="All documents are encrypted with zero-knowledge AES-256-GCM before saving to database."
                action={
                  <span className="text-xs px-2 py-0.5 rounded-full bg-success-50 dark:bg-success-900/30 text-success-700 dark:text-success-400 font-medium border border-success-200 dark:border-success-800/50">Enforced</span>
                }
              />
            </SectionCard>
          )}

          {/* ── SECURITY ── */}
          {activeTab === 'security' && (
            <SectionCard title="Security Overview" description="How your data is protected inside Smriti.">
              <div className="space-y-0 divide-y divide-neutral-100 dark:divide-neutral-800">
                {[
                  { icon: Lock,   label: 'Encryption',     desc: 'All secret values are encrypted with AES-256-GCM before touching the database.' },
                  { icon: Key,    label: 'Authentication', desc: 'JWT tokens with 24-hour expiry. Stateless, no server-side sessions.' },
                  { icon: Shield, label: 'Secret Scanning', desc: 'Pre-commit hook checks staged files for credentials before every git push.' },
                  { icon: Shield, label: 'Audit Logging',  desc: 'Every read, write, and delete is logged with user and timestamp.' },
                  { icon: Shield, label: 'Clipboard',      desc: 'Copied secrets auto-clear from clipboard after 15 seconds.' },
                ].map(({ icon: Icon, label, desc }) => (
                  <div key={label} className="flex items-start gap-4 py-4 first:pt-0 last:pb-0">
                    <div className="w-8 h-8 rounded-lg bg-success-50 dark:bg-success-900/30 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon size={14} className="text-success-600 dark:text-success-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">{label}</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 leading-relaxed">{desc}</p>
                    </div>
                    <div className="ml-auto shrink-0">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-success-50 dark:bg-success-900/30 text-success-700 dark:text-success-400 font-medium">Active</span>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {/* ── INTEGRATIONS ── */}
          {activeTab === 'integrations' && (
            <SectionCard title="GitHub" description="Connect your GitHub account to enable repo sync and secret push.">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 text-neutral-800 dark:text-white" fill="currentColor">
                      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.379.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">GitHub Account</p>
                    {githubState.loading ? (
                      <p className="text-xs text-neutral-400 mt-0.5">Checking status...</p>
                    ) : githubState.connected ? (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-success-500" />
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          Connected as <span className="font-medium text-neutral-700 dark:text-neutral-300">@{githubState.username}</span>
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">Not connected</p>
                    )}
                  </div>
                </div>

                <div className="shrink-0">
                  {githubState.loading ? (
                    <div className="h-8 w-24 bg-neutral-100 dark:bg-neutral-800 animate-pulse rounded-lg" />
                  ) : githubState.connected ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDisconnectConfirm(true)}
                      loading={actionLoading}
                      className="text-danger-600 border-danger-200 hover:bg-danger-50 dark:text-danger-400 dark:border-danger-800 dark:hover:bg-danger-900/30"
                    >
                      Disconnect
                    </Button>
                  ) : (
                    <Button size="sm" onClick={handleConnectGithub} loading={actionLoading}>
                      Connect GitHub
                    </Button>
                  )}
                </div>
              </div>

              {!githubState.loading && !githubState.connected && (
                <p className="mt-4 text-xs text-neutral-400 dark:text-neutral-500 leading-relaxed">
                  Once connected, you can link repos to projects and push secrets directly to GitHub Actions environments.
                </p>
              )}
            </SectionCard>
          )}

          {/* Footer */}
          <p className="text-xs text-neutral-400 dark:text-neutral-600 text-center py-2">
            Smriti {APP_VERSION} · {APP_AUTHOR}
          </p>
        </div>
      </div>

      {/* Disconnect Modal */}
      <Modal
        open={showDisconnectConfirm}
        onClose={() => setShowDisconnectConfirm(false)}
        title="Disconnect GitHub"
        size="sm"
      >
        <div className="p-6">
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
            This will revoke Smriti's access to <strong>@{githubState.username}</strong>'s repositories. You can reconnect anytime.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowDisconnectConfirm(false)}>Cancel</Button>
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
