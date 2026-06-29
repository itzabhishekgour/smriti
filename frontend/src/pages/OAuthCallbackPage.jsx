import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Logo from '../components/ui/Logo'

export default function OAuthCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { login, setToken } = useAuth()

  useEffect(() => {
    const token = searchParams.get('token')
    if (token) {
      // Temporarily store token so the API request can use it (or we can just pass it directly in the fetch header)
      fetch('http://localhost:8080/api/users/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          login({ 
            token: token, 
            userId: data.data.userId,
            email: data.data.email,
            name: data.data.name,
            theme: data.data.theme,
            hasPassword: data.data.hasPassword
          })
          navigate('/dashboard')
        } else {
          navigate('/login?error=invalid-token')
        }
      })
      .catch(() => {
         navigate('/login?error=fetch-failed')
      })
    } else {
      navigate('/login?error=missing-token')
    }
  }, [searchParams, navigate, login, setToken])

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col items-center justify-center p-4">
      <Logo className="w-12 h-12 mb-6 animate-pulse" />
      <h1 className="text-xl font-medium text-neutral-900 dark:text-neutral-100">Completing login...</h1>
      <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2">Please wait while we securely log you in.</p>
    </div>
  )
}
