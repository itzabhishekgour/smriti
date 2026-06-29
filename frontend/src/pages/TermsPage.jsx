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

            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mt-8 mb-4">1. Data Handling & Security</h2>
            <p>
              Smriti is designed to securely store secrets, API keys, and environment variables along with their metadata. All secrets are encrypted at rest using AES-256-GCM encryption, and all data is transmitted securely over HTTPS. However, you acknowledge that no electronic storage is 100% secure.
            </p>

            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mt-8 mb-4">2. Privacy & Third Parties</h2>
            <p>
              We do not sell, rent, or trade your personal data, nor the contents of your secrets, to any third parties. Your data remains strictly your own.
            </p>

            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mt-8 mb-4">3. Proprietary Rights</h2>
            <p>
              Smriti is proprietary software owned by Tinexus. You are granted a limited, non-exclusive license to use the service. You may not copy, modify, distribute, reverse-engineer, or sell any part of this software without explicit written permission.
            </p>

            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mt-8 mb-4">4. Early Stage Notice & Limitation of Liability</h2>
            <p>
              This is an early-stage tool provided "as is" without warranty of any kind. Tinexus is not liable for any data loss, breaches, or damages resulting from the use of this service. Exercise appropriate caution before storing mission-critical production secrets. Use the software at your own risk.
            </p>

            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mt-8 mb-4">5. Contact Us</h2>
            <p>
              If you have any questions about these Terms, please contact us at legal@tinexus.com.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
