/**
 * Tiny utility to merge Tailwind class names.
 * Replaces clsx/cn — no extra dependency needed.
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}
