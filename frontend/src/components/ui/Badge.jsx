import { cn } from '../../utils/cn'

const ENV_MAP = {
  prod:    'badge-prod',
  production: 'badge-prod',
  staging: 'badge-staging',
  test:    'badge-test',
  testing: 'badge-test',
  dev:     'badge-dev',
  development: 'badge-dev',
}

const ENV_DOTS = {
  prod:    'bg-danger-50 dark:bg-danger-900/300',
  production: 'bg-danger-50 dark:bg-danger-900/300',
  staging: 'bg-warning-50 dark:bg-warning-900/300',
  test:    'bg-primary-50 dark:bg-primary-900/300',
  testing: 'bg-primary-50 dark:bg-primary-900/300',
  dev:     'bg-neutral-400',
  development: 'bg-neutral-400',
}

export function EnvironmentBadge({ env }) {
  if (!env) return null
  const key = env.toLowerCase()
  const cls = ENV_MAP[key] || 'badge-neutral'
  const dot = ENV_DOTS[key] || 'bg-neutral-400'
  return (
    <span className={cls}>
      <span className={cn('w-1.5 h-1.5 rounded-full inline-block', dot)} />
      {env}
    </span>
  )
}

export function CategoryBadge({ category }) {
  if (!category) return null
  return <span className="badge-neutral">{category}</span>
}

export default function Badge({ variant = 'neutral', className, children }) {
  const variantMap = {
    success: 'badge-success',
    warning: 'badge bg-warning-100 text-warning-700',
    danger:  'badge bg-danger-100 text-danger-700',
    neutral: 'badge-neutral',
    primary: 'badge bg-primary-100 text-primary-700 dark:text-primary-300',
  }
  return (
    <span className={cn(variantMap[variant] || 'badge-neutral', className)}>
      {children}
    </span>
  )
}
