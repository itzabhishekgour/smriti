import { useState, useCallback } from 'react'
import { Copy, Check, RefreshCw } from 'lucide-react'
import { cn } from '../../utils/cn'
import toast from 'react-hot-toast'

const CLEAR_DELAY_MS = 15_000 // 15 seconds — security best practice

export default function CopyButton({
  getValue,
  className,
  size = 16,
  showLabel = false,
}) {
  const [state, setState] = useState('idle') // idle | copying | copied | clearing

  const handleCopy = useCallback(async () => {
    setState('copying')
    try {
      const value = await (typeof getValue === 'function' ? getValue() : Promise.resolve(getValue))
      await navigator.clipboard.writeText(value)

      setState('copied')
      toast.success('Copied! Clipboard clears in 15s', { duration: 3000 })

      // Auto-clear clipboard after 15 seconds
      setTimeout(async () => {
        setState('clearing')
        try {
          const current = await navigator.clipboard.readText()
          // Only clear if it still contains our value (user might have copied something else)
          if (current === value) {
            await navigator.clipboard.writeText('')
          }
        } catch (_) {
          // Clipboard read may fail if focus lost — that's fine
        } finally {
          setState('idle')
        }
      }, CLEAR_DELAY_MS)

    } catch (err) {
      setState('idle')
      toast.error('Copy failed')
    }
  }, [getValue])

  return (
    <button
      onClick={handleCopy}
      disabled={state === 'copying' || state === 'clearing'}
      className={cn(
        'copy-btn',
        state === 'copied' && 'copy-btn-success',
        className,
      )}
      title={
        state === 'idle' ? 'Copy to clipboard'
        : state === 'copied' ? 'Copied! Auto-clears in 15s'
        : state === 'clearing' ? 'Clearing clipboard…'
        : 'Copying…'
      }
    >
      {state === 'idle' && <Copy size={size} />}
      {state === 'copying' && <RefreshCw size={size} className="animate-spin" />}
      {state === 'copied' && <Check size={size} />}
      {state === 'clearing' && <RefreshCw size={size} className="animate-spin opacity-50" />}
      {showLabel && (
        <span className="text-xs">
          {state === 'copied' ? 'Copied!' : 'Copy'}
        </span>
      )}
    </button>
  )
}
