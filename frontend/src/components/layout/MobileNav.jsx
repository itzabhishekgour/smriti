import { NavLink } from 'react-router-dom'
import { LayoutDashboard, FolderOpen, Settings, Sparkles } from 'lucide-react'
import { cn } from '../../utils/cn'

const tabs = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/projects',  icon: FolderOpen,      label: 'Projects'  },
  { to: '/settings',  icon: Settings,        label: 'Settings'  },
]

export default function MobileNav({ onOpenAiSearch }) {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 safe-area-inset-bottom">
      <div className="flex items-stretch divide-x divide-neutral-100 dark:divide-neutral-800">
        {tabs.slice(0, 2).map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex-1 flex flex-col items-center justify-center gap-1 py-2 min-h-[56px] text-[10px] font-medium transition-colors duration-150',
                isActive
                  ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800',
              )
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}

        <button
          onClick={onOpenAiSearch}
          className="flex-1 flex flex-col items-center justify-center gap-1 py-2 min-h-[56px] text-[10px] font-medium transition-colors duration-150 text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
        >
          <Sparkles size={18} />
          Ask AI
        </button>

        {tabs.slice(2).map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex-1 flex flex-col items-center justify-center gap-1 py-2 min-h-[56px] text-[10px] font-medium transition-colors duration-150',
                isActive
                  ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800',
              )
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
