import { NavLink } from 'react-router-dom'
import { LayoutDashboard, FolderOpen, Settings, Sparkles, StickyNote } from 'lucide-react'
import { cn } from '../../utils/cn'

const tabs = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/projects',  icon: FolderOpen,      label: 'Projects'  },
  { to: '/notes',     icon: StickyNote,      label: 'Notes'     },
  { to: '/settings',  icon: Settings,        label: 'Settings'  },
]

export default function MobileNav({ onOpenAiSearch }) {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-lg border-t border-neutral-200/50 dark:border-neutral-800/50 shadow-[0_-8px_30px_rgba(0,0,0,0.04)] pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-between px-1.5 pt-1.5 pb-1.5">
        {tabs.slice(0, 2).map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex-1 flex flex-col items-center justify-center gap-1 py-2 min-h-[56px] text-[10px] font-medium transition-all duration-200 rounded-xl mx-0.5',
                isActive
                  ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/40 scale-105'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-800/50',
              )
            }
          >
            <Icon size={20} strokeWidth={2.5} />
            <span className="truncate w-full text-center px-1">{label}</span>
          </NavLink>
        ))}

        <button
          onClick={onOpenAiSearch}
          className="flex-1 flex flex-col items-center justify-center gap-1 py-2 min-h-[56px] text-[10px] font-medium transition-all duration-200 rounded-xl mx-0.5 text-indigo-500 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
        >
          <Sparkles size={20} strokeWidth={2.5} />
          <span className="truncate w-full text-center px-1">Ask AI</span>
        </button>

        {tabs.slice(2).map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex-1 flex flex-col items-center justify-center gap-1 py-2 min-h-[56px] text-[10px] font-medium transition-all duration-200 rounded-xl mx-0.5',
                isActive
                  ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/40 scale-105'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-800/50',
              )
            }
          >
            <Icon size={20} strokeWidth={2.5} />
            <span className="truncate w-full text-center px-1">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
