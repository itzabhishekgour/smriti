import { useNavigate } from 'react-router-dom'
import { FolderOpen, Lock, MoreHorizontal, Pencil, Trash2, Download, Users } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

export default function ProjectCard({ project, onEdit, onDelete, onExport }) {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const color = project.color || '#6366f1'

  return (
    <div
      className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60 p-4 sm:p-5 hover:shadow-md hover:border-neutral-300 dark:hover:border-neutral-700 transition-all duration-300 group cursor-pointer shadow-sm"
      onClick={() => navigate(`/projects/${project.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/projects/${project.id}`)}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105"
          style={{ backgroundColor: color + '15', color }}
        >
          <FolderOpen size={20} strokeWidth={2.5} />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-neutral-100 truncate">{project.name}</h3>
            
            {/* Action menu */}
            <div className="relative -mr-2" ref={menuRef} onClick={(e) => e.stopPropagation()}>
              <button
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 dark:hover:text-neutral-300 dark:hover:bg-neutral-800 transition-colors sm:opacity-0 sm:group-hover:opacity-100"
                onClick={() => setMenuOpen(v => !v)}
                aria-label="Project options"
              >
                <MoreHorizontal size={18} />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-8 z-20 w-40 bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-xl shadow-lg py-1 animate-fade-in overflow-hidden">
                  {project.isOwner && (
                    <button
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                      onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onEdit(project) }}
                    >
                      <Pencil size={15} /> Edit
                    </button>
                  )}
                  <button
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                    onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onExport && onExport(project) }}
                  >
                    <Download size={15} /> Export .env
                  </button>
                  {project.isOwner && (
                    <button
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/30 transition-colors"
                      onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete(project) }}
                    >
                      <Trash2 size={15} /> Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {project.description && (
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 line-clamp-1 pr-6">{project.description}</p>
          )}
          
          <div className="flex items-center gap-3 mt-3">
            <span className="flex items-center gap-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800/60 px-2 py-1 rounded-md border border-neutral-200/50 dark:border-neutral-700/50">
              <Lock size={12} className="text-neutral-400 dark:text-neutral-500" />
              {project.secretCount} Secret{project.secretCount !== 1 ? 's' : ''}
            </span>
            
            {!project.isOwner ? (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-xs font-medium border border-indigo-100 dark:border-indigo-800/50">
                <Users size={12} />
                {project.userRole ? project.userRole.charAt(0).toUpperCase() + project.userRole.slice(1).toLowerCase() : 'Shared'}
              </div>
            ) : project.ownerName && (
              // If it's a team project but you are owner, you can show team badge here later
              <div className="hidden"></div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
