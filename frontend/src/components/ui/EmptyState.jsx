import { cn } from '../../utils/cn'

export default function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}) {
  return (
    <div className={cn('empty-state', className)}>
      {icon && (
        <div className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4 text-neutral-400 dark:text-neutral-500 dark:text-neutral-400 dark:text-neutral-500">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-neutral-800 dark:text-neutral-200 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-neutral-500 dark:text-neutral-400 dark:text-neutral-500 max-w-xs text-balance">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
