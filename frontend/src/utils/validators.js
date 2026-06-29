export const validators = {
  required: (v) => (v && v.trim() ? undefined : 'This field is required'),
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? undefined : 'Invalid email address',
  minLength: (n) => (v) => v?.length >= n ? undefined : `Must be at least ${n} characters`,
  maxLength: (n) => (v) => v?.length <= n ? undefined : `Must be at most ${n} characters`,
  url: (v) => {
    if (!v) return undefined
    try { new URL(v); return undefined } catch { return 'Invalid URL' }
  },
}
