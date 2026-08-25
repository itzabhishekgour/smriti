import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, User, Mail, Lock, ArrowLeft } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { authService } from '../services/authService'
import Button from '../components/ui/Button'
import Logo from '../components/ui/Logo'
import toast from 'react-hot-toast'
import { APP_AUTHOR } from '../config/version'

export default function SignupPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [acceptedTerms, setAcceptedTerms] = useState(false)

  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }))

  const validate = () => {
    const e = {}
    if (!form.name.trim() || form.name.length < 2) e.name = 'Name must be at least 2 characters'
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email required'
    if (!form.password || form.password.length < 8) e.password = 'Password must be at least 8 characters'
    if (!acceptedTerms) e.terms = 'You must accept the terms and conditions'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    try {
      const data = await authService.register({ ...form, acceptedTerms })
      login(data)
      toast.success(`Welcome to Smriti, ${data.name}!`)
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-primary-950 p-12">
        <div className="flex items-center gap-2.5">
          <Logo className="w-10 h-10" />
          <div className="flex flex-col justify-center">
            <span className="text-[17px] font-bold tracking-tight text-white leading-none mb-1.5">
              Smriti
            </span>
            <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-primary-400/90 leading-none">
              By {APP_AUTHOR}
            </span>
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-white leading-snug max-w-xs">
            Your secrets deserve more than just a value.
          </h2>
          <p className="mt-4 text-primary-300 text-sm leading-relaxed max-w-sm">
            Store the context, origin story, and memory behind every key. AI-powered search so you never lose track.
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

      {/* Form */}
      <div className="flex-1 flex items-center justify-center p-6 relative">
        {/* Back to Home (Desktop) */}
        <div className="absolute top-8 right-8 hidden lg:block">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 transition-colors group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to home
          </Link>
        </div>

        <div className="w-full max-w-sm">
          {/* Back to Home (Mobile) */}
          <div className="mb-6 lg:hidden">
            <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 transition-colors group">
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              Back to home
            </Link>
          </div>

          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <Logo className="w-8 h-8" />
            <span className="font-semibold text-neutral-900 dark:text-neutral-200">Smriti</span>
          </div>

          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-200 mb-1">Create account</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-8">Start managing your secrets with context</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Full Name</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500"><User size={16} /></span>
                <input type="text" className={`input-base pl-9 ${errors.name ? 'input-error' : ''}`}
                  placeholder="Tinu" value={form.name} onChange={set('name')} autoFocus />
              </div>
              {errors.name && <p className="text-xs text-danger-600 dark:text-danger-400">{errors.name}</p>}
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Email</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500"><Mail size={16} /></span>
                <input type="email" className={`input-base pl-9 ${errors.email ? 'input-error' : ''}`}
                  placeholder="you@example.com" value={form.email} onChange={set('email')} />
              </div>
              {errors.email && <p className="text-xs text-danger-600 dark:text-danger-400">{errors.email}</p>}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Password</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500"><Lock size={16} /></span>
                <input type={showPw ? 'text' : 'password'}
                  className={`input-base pl-9 pr-10 ${errors.password ? 'input-error' : ''}`}
                  placeholder="Min. 8 characters" value={form.password} onChange={set('password')} />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:text-neutral-400 dark:text-neutral-500">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-danger-600 dark:text-danger-400">{errors.password}</p>}
            </div>

            {/* Checkbox */}
            <div className="flex items-start gap-2 pt-1">
              <input 
                type="checkbox" 
                id="terms"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-600 dark:border-neutral-700 dark:bg-neutral-800 dark:ring-offset-neutral-900"
              />
              <label htmlFor="terms" className="text-sm text-neutral-600 dark:text-neutral-400">
                I agree to the <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium">Terms & Conditions</a>
              </label>
            </div>
            {errors.terms && <p className="text-xs text-danger-600 dark:text-danger-400 -mt-2">{errors.terms}</p>}

            <Button type="submit" size="lg" loading={loading} disabled={!acceptedTerms} className="w-full mt-2">
              Create Account
            </Button>
          </form>

          <div className="mt-6 flex items-center justify-between">
            <span className="w-1/5 border-b dark:border-neutral-700 lg:w-1/4"></span>
            <span className="text-xs text-center text-neutral-500 uppercase dark:text-neutral-400">or sign up with</span>
            <span className="w-1/5 border-b dark:border-neutral-700 lg:w-1/4"></span>
          </div>

          <div className="mt-6 flex gap-4">
            <a href={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/oauth2/authorization/google`} className="w-full inline-flex justify-center items-center gap-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2.5 text-sm font-medium text-neutral-700 dark:text-neutral-200 shadow-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-offset-neutral-900 transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google
            </a>
            <a href={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/oauth2/authorization/github`} className="w-full inline-flex justify-center items-center gap-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2.5 text-sm font-medium text-neutral-700 dark:text-neutral-200 shadow-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-offset-neutral-900 transition-colors">
              <svg className="w-5 h-5 text-neutral-900 dark:text-white" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.379.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z"></path>
              </svg>
              GitHub
            </a>
          </div>

          <p className="mt-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
