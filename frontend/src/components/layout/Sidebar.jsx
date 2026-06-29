import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, FolderOpen, Settings, LogOut, Sparkles } from 'lucide-react'
import Logo from '../ui/Logo'
import { useAuth } from '../../hooks/useAuth'
import { cn } from '../../utils/cn'
import toast from 'react-hot-toast'

const navItems = [
  { to: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/projects',   icon: FolderOpen,      label: 'Projects'  },
  { to: '/settings',   icon: Settings,        label: 'Settings'  },
]

export default function Sidebar({ onOpenAiSearch }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    toast.success('Logged out')
    navigate('/login')
  }

  return (
    <aside className="hidden lg:flex flex-col w-60 shrink-0 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 h-screen sticky top-0 overflow-y-auto no-scrollbar">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-neutral-100 dark:border-neutral-800">
        <Logo className="w-8 h-8" />
        <div className="flex flex-col justify-center">
          <span className="text-[15px] font-bold tracking-tight text-neutral-900 dark:text-white leading-none mb-1">
            Smriti
          </span>
          <span className="text-[9px] font-medium uppercase tracking-[0.15em] text-primary-500/80 dark:text-primary-400/80 leading-none">
            By Tinexus
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(isActive ? 'nav-item-active' : 'nav-item')
            }
          >
            <Icon size={16} />
            <span>{label}</span>
          </NavLink>
        ))}

        <button
          onClick={onOpenAiSearch}
          className="w-full mt-4 flex items-center gap-3 px-3 py-2 text-[13px] font-medium rounded-lg text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:text-indigo-400 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 transition-colors"
        >
          <Sparkles size={16} />
          <span>Ask Smriti (AI)</span>
          <span className="ml-auto text-[10px] bg-white/50 dark:bg-black/20 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">Ctrl+K</span>
        </button>
      </nav>

      {/* User + Logout */}
      <div className="p-3 border-t border-neutral-100 dark:border-neutral-800">
        <div className="flex items-center gap-3 px-2 py-2 mb-1">
          <div className="w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-xs font-semibold text-primary-700 dark:text-primary-400 shrink-0">
            {user?.name?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-neutral-800 dark:text-neutral-200 truncate">{user?.name}</p>
            <p className="text-[10px] text-neutral-400 dark:text-neutral-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full nav-item text-neutral-500 dark:text-neutral-400 hover:text-danger-600 dark:hover:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/30"
        >
          <LogOut size={16} />
          <span>Log out</span>
        </button>
      </div>
    </aside>
  )
}
