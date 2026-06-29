import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { authService } from '../services/authService'
import Logo from '../components/ui/Logo'
import Button from '../components/ui/Button'
import toast from 'react-hot-toast'

export default function AcceptTermsPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { login } = useAuth()
  const [loading, setLoading] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) {
      navigate('/login?error=missing-token')
    }
  }, [token, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!acceptedTerms) return

    setLoading(true)
    try {
      const data = await authService.acceptTerms(token)
      login(data)
      toast.success('Terms accepted successfully!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept terms')
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
        <h1 className="text-2xl font-semibold text-center text-neutral-900 dark:text-neutral-100 mb-2">Almost there!</h1>
        <p className="text-sm text-center text-neutral-500 dark:text-neutral-400 mb-8">
          Please review and accept our Terms & Conditions to complete your account setup.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-start gap-3 bg-neutral-50 dark:bg-neutral-950 p-4 rounded-xl border border-neutral-100 dark:border-neutral-800">
            <input
              type="checkbox"
              id="terms"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-600 dark:border-neutral-700 dark:bg-neutral-800 dark:ring-offset-neutral-900"
            />
            <label htmlFor="terms" className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed cursor-pointer">
              I agree to the <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium underline underline-offset-2">Terms of Service</a> and confirm I have read the data handling policies.
            </label>
          </div>

          <Button type="submit" size="lg" loading={loading} disabled={!acceptedTerms} className="w-full">
            Complete Setup
          </Button>
        </form>
      </div>
    </div>
  )
}
