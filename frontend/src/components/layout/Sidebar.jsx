import { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, FolderOpen, Settings, LogOut, Sparkles, StickyNote, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import Logo from '../ui/Logo'
import { useAuth } from '../../hooks/useAuth'
import { cn } from '../../utils/cn'
import toast from 'react-hot-toast'

const navItems = [
  { to: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/projects',   icon: FolderOpen,      label: 'Projects'  },
  { to: '/notes',      icon: StickyNote,      label: 'Notes'     },
  { to: '/settings',   icon: Settings,        label: 'Settings'  },
]

export default function Sidebar({ onOpenAiSearch }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('smriti_sidebar_collapsed') === 'true'
  })

  const toggleSidebar = () => {
    const newVal = !collapsed
    setCollapsed(newVal)
    localStorage.setItem('smriti_sidebar_collapsed', newVal)
  }

  const handleLogout = () => {
    logout()
    toast.success('Logged out')
    navigate('/login')
  }

  return (
    <aside 
      className={cn(
        "group hidden lg:flex flex-col shrink-0 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 h-screen sticky top-0 overflow-visible transition-[width] duration-300 ease-in-out relative z-30",
        collapsed ? "w-[72px]" : "w-60"
      )}
    >
      {/* Brand & Toggle */}
      <div 
        className={cn(
          "flex items-center border-b border-neutral-100 dark:border-neutral-800 h-[73px] overflow-hidden transition-colors", 
          collapsed ? "px-0 justify-center cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50" : "px-5 justify-between"
        )}
        onClick={collapsed ? toggleSidebar : undefined}
        title={collapsed ? "Expand sidebar" : undefined}
      >
        <div className="flex items-center gap-2.5">
          <Logo className="w-8 h-8 shrink-0" />
          <div className={cn("flex flex-col justify-center whitespace-nowrap transition-opacity duration-200", collapsed ? "opacity-0 w-0 hidden" : "opacity-100")}>
            <span className="text-[15px] font-bold tracking-tight text-neutral-900 dark:text-white leading-none mb-1">
              Smriti
            </span>
            <span className="text-[9px] font-medium uppercase tracking-[0.15em] text-primary-500/80 dark:text-primary-400/80 leading-none">
              By Tinexus
            </span>
          </div>
        </div>

        <button 
          onClick={(e) => {
            e.stopPropagation();
            toggleSidebar();
          }}
          title="Collapse sidebar"
          className={cn(
            "p-1.5 text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-all",
            collapsed ? "hidden" : "opacity-0 group-hover:opacity-100"
          )}
        >
          <PanelLeftClose size={16} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto no-scrollbar overflow-x-hidden">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              cn(
                isActive ? 'nav-item-active' : 'nav-item',
                collapsed ? 'justify-center px-0 w-10 h-10 mx-auto' : '',
                "whitespace-nowrap transition-all"
              )
            }
          >
            <Icon size={18} className="shrink-0" />
            <span className={cn("transition-opacity duration-200", collapsed ? "opacity-0 w-0 hidden" : "opacity-100 ml-3")}>{label}</span>
          </NavLink>
        ))}

        <button
          onClick={onOpenAiSearch}
          title={collapsed ? "Ask Smriti (AI) [Ctrl+K]" : undefined}
          className={cn(
            "mt-4 flex items-center font-medium rounded-lg text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:text-indigo-400 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 transition-all whitespace-nowrap",
            collapsed ? "w-10 h-10 justify-center mx-auto" : "w-full px-3 py-2 text-[13px]"
          )}
        >
          <Sparkles size={16} className="shrink-0" />
          <div className={cn("flex items-center flex-1 transition-opacity duration-200", collapsed ? "opacity-0 w-0 hidden" : "opacity-100 ml-2")}>
            <span>Ask Smriti (AI)</span>
            <span className="ml-auto text-[10px] bg-white/50 dark:bg-black/20 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800 shrink-0">Ctrl+K</span>
          </div>
        </button>
      </nav>

      {/* User + Logout */}
      <div className="p-3 border-t border-neutral-100 dark:border-neutral-800 overflow-hidden">
        <div className={cn("flex items-center mb-2", collapsed ? "justify-center" : "gap-3 px-2 py-1")}>
          <div 
            className={cn("rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-xs font-semibold text-primary-700 dark:text-primary-400 shrink-0", collapsed ? "w-9 h-9" : "w-8 h-8")}
            title={collapsed ? user?.email : undefined}
          >
            {user?.name?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div className={cn("min-w-0 transition-opacity duration-200", collapsed ? "opacity-0 w-0 hidden" : "opacity-100")}>
            <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate leading-tight">{user?.name}</p>
            <p className="text-[11px] text-neutral-400 dark:text-neutral-500 truncate mt-0.5">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          title={collapsed ? "Log out" : undefined}
          className={cn(
            "w-full nav-item text-neutral-500 dark:text-neutral-400 hover:text-danger-600 dark:hover:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/30 whitespace-nowrap transition-all",
            collapsed ? "justify-center px-0 w-10 h-10 mx-auto mt-1" : ""
          )}
        >
          <LogOut size={16} className="shrink-0" />
          <span className={cn("transition-opacity duration-200", collapsed ? "opacity-0 w-0 hidden" : "opacity-100 ml-3")}>Log out</span>
        </button>
      </div>
    </aside>
  )
}
