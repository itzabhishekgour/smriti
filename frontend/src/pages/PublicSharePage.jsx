import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Key, Download, Lock, Mail, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import Button from '../components/ui/Button'
import { publicService } from '../services/publicService'

export default function PublicSharePage() {
  const { token } = useParams()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState('PASSWORD') // 'PASSWORD' | 'OTP'
  const [otp, setOtp] = useState('')
  const [maskedEmail, setMaskedEmail] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)

  // Start cooldown timer
  useEffect(() => {
    let interval = null;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    } else if (interval) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const downloadSecrets = (secretsData) => {
    if (!secretsData || secretsData.length === 0) {
      toast.error('No secrets found in this project')
      return
    }
    
    const projectName = secretsData[0]?.projectName || 'project'
    
    const envContent = secretsData.map(s => {
      const key = s.name.toUpperCase().replace(/[^A-Z0-9_]/g, '_')
      return `${key}="${s.value.replace(/"/g, '\\"')}"`
    }).join('\n')
    
    const blob = new Blob([envContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${projectName.replace(/\s+/g, '_')}.env`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('Downloaded .env file securely!')
    setPassword('')
    setOtp('')
    setStep('PASSWORD')
  }

  const handleAccess = async (e) => {
    e.preventDefault()
    if (!password) return
    
    setLoading(true)
    const toastId = toast.loading('Verifying secure link...')
    
    try {
      const res = await publicService.accessSharedSecrets(token, password)
      
      if (res.status === 'REQUIRE_OTP') {
        toast.dismiss(toastId)
        setMaskedEmail(res.maskedEmail)
        setResendCooldown(60) // Start 60s cooldown for resend
        setStep('OTP')
      } else if (res.status === 'SUCCESS') {
        toast.dismiss(toastId)
        downloadSecrets(res.secrets)
      }
    } catch (err) {
      toast.dismiss(toastId)
      toast.error(err.response?.data?.message || 'Invalid password or link expired')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    if (!otp || otp.length < 6) return
    
    setLoading(true)
    const toastId = toast.loading('Verifying code...')
    
    try {
      const res = await publicService.verifyOtp(token, otp)
      
      if (res.status === 'SUCCESS') {
        toast.dismiss(toastId)
        downloadSecrets(res.secrets)
      }
    } catch (err) {
      toast.dismiss(toastId)
      toast.error(err.response?.data?.message || 'Invalid or expired code')
    } finally {
      setLoading(false)
    }
  }

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return
    
    const toastId = toast.loading('Sending new code...')
    try {
      await publicService.resendOtp(token)
      toast.dismiss(toastId)
      toast.success('New code sent!')
      setResendCooldown(60)
    } catch (err) {
      toast.dismiss(toastId)
      toast.error(err.response?.data?.message || 'Failed to resend code')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 p-4">
      <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 p-8 text-center">
        <div className="w-16 h-16 mx-auto bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
          {step === 'PASSWORD' ? <Key size={32} /> : <ShieldCheck size={32} />}
        </div>
        
        {step === 'PASSWORD' && (
          <>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">Secure Secrets Share</h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-8">
              You've been sent a secure, temporary link to download environment variables. Enter the password to access them.
            </p>

            <form onSubmit={handleAccess} className="space-y-4">
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="password"
                  placeholder="Enter password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full h-12 pl-10 pr-4 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-center tracking-widest font-mono"
                />
              </div>
              
              <Button type="submit" loading={loading} className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-base rounded-xl">
                Continue <ArrowRight size={18} className="ml-2" />
              </Button>
            </form>
          </>
        )}

        {step === 'OTP' && (
          <div className="animate-fade-in">
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">2-Step Verification</h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
              We've sent a 6-digit verification code to<br />
              <strong className="text-neutral-900 dark:text-white">{maskedEmail}</strong>
            </p>

            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="relative max-w-[200px] mx-auto">
                <input
                  type="text"
                  placeholder="------"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/[^0-9]/g, ''))} // only allow numbers
                  className="w-full h-14 bg-neutral-50 dark:bg-neutral-950 border-2 border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-center tracking-[0.5em] font-mono text-xl"
                />
              </div>
              
              <Button type="submit" loading={loading} className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-base rounded-xl">
                <Download size={18} className="mr-2" /> Verify & Download
              </Button>
            </form>

            <div className="mt-6 flex flex-col items-center gap-2">
              <span className="text-xs text-neutral-500">Code expires in 10 minutes</span>
              <button 
                onClick={handleResendOtp}
                disabled={resendCooldown > 0}
                className={`text-sm font-medium flex items-center gap-1 transition-colors ${resendCooldown > 0 ? 'text-neutral-400 cursor-not-allowed' : 'text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300'}`}
              >
                <RefreshCw size={14} className={resendCooldown > 0 ? '' : 'hover:animate-spin'} />
                {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
              </button>
            </div>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-neutral-100 dark:border-neutral-800 text-xs text-neutral-400">
          Powered by Smriti Secret Manager
        </div>
      </div>
    </div>
  )
}
