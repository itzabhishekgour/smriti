import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SparklesIcon, XMarkIcon, DocumentDuplicateIcon, CheckIcon } from '@heroicons/react/24/outline'
import { aiService } from '../../services/aiService'
import { toast } from 'react-hot-toast'

export default function GlobalAiSearch({ isOpen, onClose }) {
  const [query, setQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [response, setResponse] = useState(null)
  const [copiedId, setCopiedId] = useState(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    } else {
      setQuery('')
      setResponse(null)
    }
  }, [isOpen])

  // Handle Cmd/Ctrl + K shortcut globally
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (isOpen) onClose()
        else document.dispatchEvent(new CustomEvent('open-ai-search'))
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!query.trim()) return

    setIsSearching(true)
    setResponse(null)
    try {
      const result = await aiService.askAi(query)
      setResponse(result)
    } catch (err) {
      toast.error('Failed to ask AI. Please try again.')
    } finally {
      setIsSearching(false)
    }
  }

  const copyToClipboard = async (secret) => {
    try {
      await navigator.clipboard.writeText(secret.decryptedValue)
      setCopiedId(secret.id)
      toast.success(`${secret.name} copied to clipboard!`)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      toast.error('Failed to copy')
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />
          <div className="fixed inset-0 flex items-start justify-center pt-4 sm:pt-20 px-2 sm:px-4 z-50 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl overflow-hidden pointer-events-auto border border-neutral-200 dark:border-neutral-800"
            >
              <form onSubmit={handleSearch} className="relative">
                <SparklesIcon className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-5 h-5 sm:w-6 sm:h-6 text-indigo-500" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask Smriti... (e.g. 'stripe key')"
                  className="w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-3 sm:py-4 bg-transparent border-none text-base sm:text-lg focus:ring-0 text-neutral-900 dark:text-white placeholder-neutral-400"
                />
                <button
                  type="button"
                  onClick={onClose}
                  className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </form>

              {/* Loading State */}
              {isSearching && (
                <div className="p-6 sm:p-8 border-t border-neutral-100 dark:border-neutral-800 flex flex-col items-center justify-center space-y-4">
                  <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                  <p className="text-sm text-neutral-500">Searching your context...</p>
                </div>
              )}

              {/* Results State */}
              {response && (
                <div className="border-t border-neutral-100 dark:border-neutral-800 max-h-[60vh] overflow-y-auto p-6 space-y-6 bg-neutral-50 dark:bg-neutral-950/50">
                  
                  {/* AI Answer Bubble */}
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                      <SparklesIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl rounded-tl-none shadow-sm border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200">
                      {response.answer}
                    </div>
                  </div>

                  {/* Related Secrets */}
                  {response.relatedSecrets?.length > 0 && (
                    <div className="pl-12 space-y-3">
                      {response.relatedSecrets.map(secret => (
                        <div key={secret.id} className="flex items-center justify-between p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
                          <div>
                            <h4 className="font-medium text-neutral-900 dark:text-white">{secret.name}</h4>
                            <p className="text-xs text-neutral-500">{secret.serviceName || 'No Service'}</p>
                          </div>
                          <button
                            onClick={() => copyToClipboard(secret)}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:text-indigo-400 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 rounded-lg transition-colors"
                          >
                            {copiedId === secret.id ? (
                              <CheckIcon className="w-4 h-4" />
                            ) : (
                              <DocumentDuplicateIcon className="w-4 h-4" />
                            )}
                            {copiedId === secret.id ? 'Copied' : 'Copy Value'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              )}

            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
