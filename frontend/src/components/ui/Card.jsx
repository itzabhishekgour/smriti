import { cn } from '../../utils/cn'

export default function Card({ className, hover = false, children, ...props }) {
  return (
    <div className={cn(hover ? 'card-hover' : 'card', className)} {...props}>
      {children}
    </div>
  )
}

export function CardHeader({ className, children }) {
  return <div className={cn('px-6 py-4 border-b border-neutral-100 dark:border-neutral-800', className)}>{children}</div>
}

export function CardBody({ className, children }) {
  return <div className={cn('px-6 py-4', className)}>{children}</div>
}

export function CardFooter({ className, children }) {
  return <div className={cn('px-6 py-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/50', className)}>{children}</div>
}
