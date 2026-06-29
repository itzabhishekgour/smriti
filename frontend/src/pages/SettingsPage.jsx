import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../hooks/useTheme'
import { Shield, User, Mail, Calendar, Sun, Moon, Monitor } from 'lucide-react'
import { formatDate } from '../utils/formatDate'

export default function SettingsPage() {
  const { user } = useAuth()
  const { theme, setTheme } = useTheme()

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
    </div>
  )
}
