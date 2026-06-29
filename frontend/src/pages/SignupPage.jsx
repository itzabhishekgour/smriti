import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, User, Mail, Lock } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { authService } from '../services/authService'
import Button from '../components/ui/Button'
import Logo from '../components/ui/Logo'
import toast from 'react-hot-toast'

export default function SignupPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }))

  const validate = () => {
    const e = {}
    if (!form.name.trim() || form.name.length < 2) e.name = 'Name must be at least 2 characters'
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email required'
    if (!form.password || form.password.length < 8) e.password = 'Password must be at least 8 characters'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    try {
      const data = await authService.register(form)
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
          <Logo className="w-9 h-9" />
          <div>
            <span className="text-white font-semibold text-base">Smriti</span>
            <span className="block text-primary-400 text-xs">by Tinexus</span>
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
        <p className="text-primary-500 text-xs">A Tinexus Technology</p>
      </div>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <Logo className="w-8 h-8" />
            <span className="font-semibold text-neutral-900 dark:text-neutral-200">Smriti</span>
          </div>

          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-200 mb-1">Create account</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 dark:text-neutral-500 mb-8">Start managing your secrets with context</p>

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

            <Button type="submit" size="lg" loading={loading} className="w-full">
              Create Account
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-neutral-500 dark:text-neutral-400 dark:text-neutral-500">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:text-primary-300">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
