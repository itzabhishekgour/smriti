import { useNavigate } from 'react-router-dom'
import { FolderOpen, Key, ChevronRight, MoreHorizontal, Pencil, Trash2, Download, Users } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { cn } from '../../utils/cn'

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
      className="card-hover p-5 flex flex-col gap-3 group"
      onClick={() => navigate(`/projects/${project.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/projects/${project.id}`)}
    >
      {/* Top row */}
      <div className="flex items-start justify-between">
        {/* Icon */}
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 group-hover:rotate-3"
          style={{ backgroundColor: color + '20', color }}
        >
          <FolderOpen size={18} />
        </div>

        <div className="flex items-center gap-2">
          {!project.isOwner && (
            <div className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-medium flex items-center gap-1 border border-indigo-100 dark:border-indigo-800">
              <Users size={10} />
              {project.userRole ? project.userRole.charAt(0).toUpperCase() + project.userRole.slice(1).toLowerCase() : 'Shared'}
            </div>
          )}

          {/* Action menu */}
          <div className="relative" ref={menuRef} onClick={(e) => e.stopPropagation()}>
            <button
              className="icon-btn opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => setMenuOpen(v => !v)}
              aria-label="Project options"
            >
              <MoreHorizontal size={16} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-8 z-20 w-36 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-md py-1 animate-fade-in">
                {project.isOwner && (
                  <button
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                    onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onEdit(project) }}
                  >
                    <Pencil size={14} /> Edit
                  </button>
                )}
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onExport && onExport(project) }}
                >
                  <Download size={14} /> Export .env
                </button>
                {project.isOwner && (
                  <button
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/30 transition-colors"
                    onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete(project) }}
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Name + description */}
      <div>
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">{project.name}</h3>
        {project.description && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400 dark:text-neutral-500 mt-0.5 line-clamp-2">{project.description}</p>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-neutral-100 dark:border-neutral-800/50">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-xs font-medium text-neutral-500 dark:text-neutral-400">
            <Key size={13} />
            {project.secretCount}
          </span>
          {!project.isOwner && project.ownerName && (
            <div className="flex items-center gap-1.5 pl-3 border-l border-neutral-200 dark:border-neutral-700">
              <div className="w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 flex items-center justify-center text-[10px] font-bold shadow-sm">
                {project.ownerName.charAt(0).toUpperCase()}
              </div>
              <span className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400 line-clamp-1 max-w-[80px]">
                {project.ownerName.split(' ')[0]}
              </span>
            </div>
          )}
        </div>
        <ChevronRight size={14} className="text-neutral-300 group-hover:text-neutral-500 dark:text-neutral-500 transition-colors" />
      </div>
    </div>
  )
}
