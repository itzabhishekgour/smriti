import { useState, useEffect } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import Button from '../ui/Button'
import { aiService } from '../../services/aiService'

const ENVIRONMENTS = ['dev', 'test', 'staging', 'prod']
const CATEGORIES   = ['api-key', 'oauth-token', 'database-url', 'webhook-secret', 'ssh-key', 'other']

export default function SecretForm({ open, onClose, onSubmit, initialData, loading, projectId }) {
  const isEdit = !!initialData
  const [showValue, setShowValue] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [aiSuggested, setAiSuggested] = useState({
    serviceName: false,
    environment: false,
    tags: false
  })
  const [form, setForm] = useState({
    name:        initialData?.name        || '',
    value:       '',
    serviceName: initialData?.serviceName || '',
    environment: initialData?.environment || '',
    category:    initialData?.category    || '',
    originNote:  initialData?.originNote  || '',
    sourceUrl:   initialData?.sourceUrl   || '',
    expiryDate:  initialData?.expiryDate  || '',
    tags:        initialData?.tags        || '',
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (open) {
      setForm({
        name:        initialData?.name        || '',
        value:       '', // Keep empty so they don't have to delete it if keeping current
        serviceName: initialData?.serviceName || '',
        environment: initialData?.environment || '',
        category:    initialData?.category    || '',
        originNote:  initialData?.originNote  || '',
        sourceUrl:   initialData?.sourceUrl   || '',
        expiryDate:  initialData?.expiryDate  || '',
        tags:        initialData?.tags        || '',
      })
      setAiSuggested({ serviceName: false, environment: false, tags: false })
      setErrors({})
    }
  }, [open, initialData])

  const set = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }))
    setAiSuggested(prev => ({ ...prev, [field]: false }))
  }

  const handleOriginNoteBlur = async () => {
    if (!form.originNote.trim() || isEdit) return
    setParsing(true)
    try {
      const data = await aiService.parseNote(form.originNote)
      const updates = {}
      const suggestions = {}

      if (data.serviceName && !form.serviceName.trim()) {
        updates.serviceName = data.serviceName
        suggestions.serviceName = true
      }
      if (data.environment && !form.environment) {
        updates.environment = data.environment
        suggestions.environment = true
      }
      if (data.tags && data.tags.length > 0 && !form.tags.trim()) {
        updates.tags = data.tags.join(', ')
        suggestions.tags = true
      }

      if (Object.keys(updates).length > 0) {
        setForm(f => ({ ...f, ...updates }))
        setAiSuggested(prev => ({ ...prev, ...suggestions }))
      }
    } catch (e) {
      console.error('Failed to parse origin note:', e)
    } finally {
      setParsing(false)
    }
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!isEdit && !form.value.trim()) e.value = 'Secret value is required'
    return e
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    const payload = { ...form }
    if (isEdit && !payload.value) delete payload.value
    onSubmit(payload)
  }

  const handleClose = () => {
    setForm({ name: '', value: '', serviceName: '', environment: '', category: '', originNote: '', sourceUrl: '', expiryDate: '', tags: '' })
    setErrors({})
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isEdit ? 'Edit Secret' : 'Add Secret'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {/* Row 1: Name + Service */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Name <span className="text-danger-500">*</span>
            </label>
            <input
              className={`input-base ${errors.name ? 'input-error' : ''}`}
              placeholder="e.g. Stripe Publishable Key"
              value={form.name}
              onChange={set('name')}
            />
            {errors.name && <p className="text-xs text-danger-600 dark:text-danger-400">{errors.name}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 flex items-center justify-between">
              <span>Service Name</span>
              {aiSuggested.serviceName && (
                <span className="text-[10px] text-primary-600 dark:text-primary-400 font-semibold animate-pulse">✨ AI Suggested</span>
              )}
            </label>
            <input
              className="input-base"
              placeholder="e.g. Stripe, AWS, GitHub"
              value={form.serviceName}
              onChange={set('serviceName')}
            />
          </div>
        </div>

        {/* Secret value */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {isEdit ? 'New Value' : 'Secret Value'} {!isEdit && <span className="text-danger-500">*</span>}
            {isEdit && <span className="text-neutral-400 dark:text-neutral-500 font-normal"> (leave blank to keep current)</span>}
          </label>
          <div className="relative">
            <input
              type={showValue ? 'text' : 'password'}
              className={`input-base pr-10 font-mono ${errors.value ? 'input-error' : ''}`}
              placeholder={isEdit ? '••••••••' : 'Paste secret value here'}
              value={form.value}
              onChange={set('value')}
              autoComplete="off"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:text-neutral-400 dark:text-neutral-500"
              onClick={() => setShowValue(v => !v)}
            >
              {showValue ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.value && <p className="text-xs text-danger-600 dark:text-danger-400">{errors.value}</p>}
        </div>

        {/* Row 2: Env + Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 flex items-center justify-between">
              <span>Environment</span>
              {aiSuggested.environment && (
                <span className="text-[10px] text-primary-600 dark:text-primary-400 font-semibold animate-pulse">✨ AI Suggested</span>
              )}
            </label>
            <select className="input-base" value={form.environment} onChange={set('environment')}>
              <option value="">Select environment</option>
              {ENVIRONMENTS.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Category</label>
            <select className="input-base" value={form.category} onChange={set('category')}>
              <option value="">Select category</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Origin Note */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Origin Story</label>
          <div className="relative">
            <textarea
              className="input-base resize-none pr-10"
              rows={3}
              placeholder="How did you get this key? e.g. 'Got from Stripe dashboard on Jan 3 for the checkout feature. Found under Developers > API Keys.'"
              value={form.originNote}
              onChange={set('originNote')}
              onBlur={handleOriginNoteBlur}
              disabled={parsing}
            />
            {parsing && (
              <span className="absolute right-3 bottom-3 text-xs text-neutral-400 dark:text-neutral-500 animate-pulse">
                Parsing...
              </span>
            )}
          </div>
          <p className="text-xs text-neutral-400 dark:text-neutral-500">Write in plain language — this is your memory, not a form field.</p>
        </div>

        {/* Row 3: Source URL + Expiry */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Source URL</label>
            <input
              type="url"
              className="input-base"
              placeholder="https://dashboard.stripe.com/..."
              value={form.sourceUrl}
              onChange={set('sourceUrl')}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Expiry Date</label>
            <input
              type="date"
              className="input-base"
              value={form.expiryDate}
              onChange={set('expiryDate')}
            />
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 flex items-center justify-between">
            <span>Tags</span>
            {aiSuggested.tags && (
              <span className="text-[10px] text-primary-600 dark:text-primary-400 font-semibold animate-pulse">✨ AI Suggested</span>
            )}
          </label>
          <input
            className="input-base"
            placeholder="payment, production, critical (comma separated)"
            value={form.tags}
            onChange={set('tags')}
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={handleClose}>Cancel</Button>
          <Button type="submit" loading={loading}>
            {isEdit ? 'Save Changes' : 'Save Secret'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
