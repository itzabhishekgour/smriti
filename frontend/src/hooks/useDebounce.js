import { useState, useEffect } from 'react'

/**
 * Debounce a value by `delay` ms.
 * Usage: const debouncedSearch = useDebounce(searchInput, 400)
 */
export function useDebounce(value, delay = 400) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}
