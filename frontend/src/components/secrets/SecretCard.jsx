import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Link, Clock, MoreHorizontal, Pencil, Trash2, AlertTriangle } from 'lucide-react'
import { EnvironmentBadge, CategoryBadge } from '../ui/Badge'
import CopyButton from './CopyButton'
import { secretService } from '../../services/secretService'
import { formatRelativeDate } from '../../utils/formatDate'
import { cn } from '../../utils/cn'

export default function SecretCard({ secret, projectId, canEdit = true, onEdit, onDelete }) {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const fetchValue = async () => {
    const detail = await secretService.getDetail(projectId, secret.id)
    return detail.value
  }

  const tags = secret.tags ? secret.tags.split(',').map(t => t.trim()).filter(Boolean) : []

  return (
    <div
      className={cn(
        'card p-4 hover:border-neutral-300 hover:shadow transition-all duration-150 cursor-pointer group',
        secret.isExpired && 'border-danger-200 bg-danger-50 dark:bg-danger-900/30/30',
        secret.isExpiringSoon && !secret.isExpired && 'border-warning-200',
      )}
      onClick={() => navigate(`/projects/${projectId}/secrets/${secret.id}`)}
    >
      <div className="flex items-start justify-between gap-2">
        {/* Main info */}
        <div className="flex-1 min-w-0">
          {/* Expiry warning */}
          {(secret.isExpired || secret.isExpiringSoon) && (
            <div className={cn(
              'flex items-center gap-1 text-xs mb-1.5 font-medium',
              secret.isExpired ? 'text-danger-600 dark:text-danger-400' : 'text-warning-600 dark:text-warning-400'
            )}>
              <AlertTriangle size={11} />
              {secret.isExpired ? 'Expired' : 'Expiring soon'}
            </div>
          )}

          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">{secret.name}</h3>

          {secret.serviceName && (
            <p className="text-xs text-neutral-500 dark:text-neutral-400 dark:text-neutral-500 mt-0.5">{secret.serviceName}</p>
          )}

          {/* Masked value */}
          <div className="mt-2 flex items-center gap-2" onClick={e => e.stopPropagation()}>
            <span className="secret-masked flex-1">••••••••••••</span>
            <CopyButton getValue={fetchValue} size={14} />
          </div>
        </div>

        {/* Menu */}
        {canEdit && (
          <div className="relative flex-shrink-0" onClick={e => e.stopPropagation()}>
            <button
              className="icon-btn opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => setMenuOpen(v => !v)}
            >
              <MoreHorizontal size={15} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-7 z-20 w-32 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-md py-1 animate-fade-in">
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                  onClick={() => { setMenuOpen(false); onEdit(secret) }}
                >
                  <Pencil size={13} /> Edit
                </button>
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/30"
                  onClick={() => { setMenuOpen(false); onDelete(secret) }}
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
        {secret.environment && <EnvironmentBadge env={secret.environment} />}
        {secret.category && <CategoryBadge category={secret.category} />}
        {tags.slice(0, 2).map(tag => (
          <span key={tag} className="tag-pill">{tag}</span>
        ))}
        {secret.sourceUrl && (
          <span title={secret.sourceUrl} className="ml-auto text-neutral-300 hover:text-neutral-500 dark:text-neutral-400 dark:text-neutral-500">
            <Link size={12} />
          </span>
        )}
        <span className="text-[10px] text-neutral-400 dark:text-neutral-500 ml-auto flex items-center gap-1">
          <Clock size={10} />
          {formatRelativeDate(secret.createdAt)}
        </span>
      </div>
    </div>
  )
}
