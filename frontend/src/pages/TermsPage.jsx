import { Link } from 'react-router-dom'
import Logo from '../components/ui/Logo'
import { ArrowLeft } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 font-sans">
      <nav className="bg-white dark:bg-neutral-950/80 border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Logo className="w-8 h-8" />
            <span className="font-semibold text-neutral-900 dark:text-neutral-100">Smriti</span>
          </div>
          <Link to="/" className="text-sm font-medium text-neutral-600 dark:text-neutral-400 dark:text-neutral-500 hover:text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <ArrowLeft size={16} /> Back to Home
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-white dark:bg-neutral-900 rounded-3xl p-8 md:p-12 border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">Terms of Service</h1>
          <p className="text-neutral-500 dark:text-neutral-400 dark:text-neutral-500 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

          <div className="prose prose-neutral max-w-none text-neutral-600 dark:text-neutral-400 dark:text-neutral-500 space-y-6">
            <p>
              Welcome to Smriti, a product by Tinexus. By using our website and services, you agree to these Terms of Service.
            </p>

            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mt-8 mb-4">1. Use of Service</h2>
            <p>
              Smriti is designed to store developer secrets, API keys, and environment variables. 
              You are responsible for maintaining the confidentiality of your account credentials.
            </p>

            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mt-8 mb-4">2. Liability</h2>
            <p>
              While we use AES-256-GCM encryption to secure your data, Tinexus is not liable for any data loss, 
              breaches, or damages resulting from the use of this service. Use the software at your own risk.
            </p>

            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mt-8 mb-4">3. Acceptable Use</h2>
            <p>
              You agree not to use the service for any illegal activities or to store malicious code, malware, 
              or data that violates the rights of third parties.
            </p>

            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mt-8 mb-4">4. Termination</h2>
            <p>
              We reserve the right to terminate or suspend access to our service immediately, without prior notice or liability, 
              for any reason whatsoever, including without limitation if you breach the Terms.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
