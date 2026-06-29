import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { authService } from '../services/authService'
import Logo from '../components/ui/Logo'
import Button from '../components/ui/Button'
import { Eye, EyeOff, Lock } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LinkAccountPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { login } = useAuth()
  const [loading, setLoading] = useState(false)
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  
  const token = searchParams.get('token')
  const provider = searchParams.get('provider') || 'another'

  useEffect(() => {
    if (!token) {
      navigate('/login?error=missing-token')
    }
  }, [token, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!password) return

    setLoading(true)
    try {
      const data = await authService.linkAccount(token, password)
      login(data)
      toast.success('Account linked successfully!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Incorrect password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl p-8 border border-neutral-200 dark:border-neutral-800 shadow-sm">
        <div className="flex justify-center mb-6">
          <Logo className="w-12 h-12" />
        </div>
        <h1 className="text-2xl font-semibold text-center text-neutral-900 dark:text-neutral-100 mb-2">Link your account</h1>
        <p className="text-sm text-center text-neutral-500 dark:text-neutral-400 mb-8">
          An account with this email already exists. Enter your password to link your {provider} account.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Password</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500">
                <Lock size={16} />
              </span>
              <input
                type={showPw ? 'text' : 'password'}
                className="input-base pl-9 pr-10"
                placeholder="Enter your existing password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoFocus
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300"
                onClick={() => setShowPw(v => !v)}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <Button type="submit" size="lg" loading={loading} disabled={!password} className="w-full">
            Link Account & Sign In
          </Button>
        </form>
      </div>
    </div>
  )
}
