import { forwardRef } from 'react'
import { cn } from '../../utils/cn'

const Input = forwardRef(({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  className,
  id,
  required,
  ...props
}, ref) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {label}
          {required && <span className="text-danger-500 ml-0.5">*</span>}
        </label>
      )}

      <div className="relative">
        {leftIcon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500">
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'input-base',
            leftIcon  && 'pl-9',
            rightIcon && 'pr-9',
            error     && 'input-error',
            className,
          )}
          {...props}
        />
        {rightIcon && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500">
            {rightIcon}
          </span>
        )}
      </div>

      {error && <p className="text-xs text-danger-600 dark:text-danger-400">{error}</p>}
      {hint && !error && <p className="text-xs text-neutral-400 dark:text-neutral-500">{hint}</p>}
    </div>
  )
})

Input.displayName = 'Input'
export default Input
