import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { authService } from '../services/authService'
import Button from '../components/ui/Button'
import Logo from '../components/ui/Logo'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }))

  const validate = () => {
    const e = {}
    if (!form.email) e.email = 'Email is required'
    if (!form.password) e.password = 'Password is required'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    try {
      const data = await authService.login(form)
      login(data)
      toast.success(`Welcome back, ${data.name}!`)
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex">
      {/* Left — Brand panel (hidden on mobile) */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-primary-950 p-12">
        <div className="flex items-center gap-2.5">
          <Logo className="w-10 h-10" />
          <div className="flex flex-col justify-center">
            <span className="text-[17px] font-bold tracking-tight text-white leading-none mb-1.5">
              Smriti
            </span>
            <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-primary-400/90 leading-none">
              By Tinexus
            </span>
          </div>
        </div>

        <div>
          <blockquote className="text-2xl font-semibold text-white leading-snug max-w-xs">
            "Never lose the context of your secrets again."
          </blockquote>
          <p className="mt-4 text-primary-300 text-sm leading-relaxed max-w-sm">
            Store your API keys with full context — where you got them, why, and when they expire. Never lose the story behind a secret again.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-y-6 gap-x-8">
          {[
            ['AES-256', 'Military-grade encryption'],
            ['Secret Scanning', 'Pre-commit Git-leak prevention'],
            ['CI/CD Sync', 'Push to GitHub & Render'],
            ['Audit Logs', 'Track every team action'],
            ['Team Access', 'Role-based collaboration'],
            ['AI Context', 'Smart semantic search'],
          ].map(([label, sub]) => (
            <div key={label}>
              <div className="text-white font-semibold text-sm">{label}</div>
              <div className="text-primary-400 text-xs">{sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Mobile brand */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <Logo className="w-8 h-8" />
            <span className="font-semibold text-neutral-900 dark:text-neutral-200">Smriti</span>
          </div>

          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-200 mb-1">Welcome back</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-8">Sign in to your Smriti account</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Email</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500">
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  className={`input-base pl-9 ${errors.email ? 'input-error' : ''}`}
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={set('email')}
                  autoComplete="email"
                  autoFocus
                />
              </div>
              {errors.email && <p className="text-xs text-danger-600 dark:text-danger-400">{errors.email}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Password</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500">
                  <Lock size={16} />
                </span>
                <input
                  type={showPw ? 'text' : 'password'}
                  className={`input-base pl-9 pr-10 ${errors.password ? 'input-error' : ''}`}
                  placeholder="Your password"
                  value={form.password}
                  onChange={set('password')}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:text-neutral-400 dark:text-neutral-500"
                  onClick={() => setShowPw(v => !v)}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-danger-600 dark:text-danger-400">{errors.password}</p>}
            </div>

            <Button type="submit" size="lg" loading={loading} className="w-full">
              Sign in
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
            Don't have an account?{' '}
            <Link to="/signup" className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
