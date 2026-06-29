import { Link } from 'react-router-dom'
import Logo from '../components/ui/Logo'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPage() {
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
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">Privacy Policy</h1>
          <p className="text-neutral-500 dark:text-neutral-400 dark:text-neutral-500 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

          <div className="prose prose-neutral max-w-none text-neutral-600 dark:text-neutral-400 dark:text-neutral-500 space-y-6">
            <p>
              At Tinexus, we take your privacy and the security of your secrets incredibly seriously. 
              This Privacy Policy describes how Smriti collects, uses, and protects your information.
            </p>

            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mt-8 mb-4">1. Data Encryption</h2>
            <p>
              Your secrets are encrypted at rest using industry-standard AES-256-GCM authenticated encryption. 
              We cannot read your unencrypted secrets. Only the backend system possessing the master decryption key can parse the secret values. 
              Context and metadata are stored in plaintext to enable our AI-powered search features.
            </p>

            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mt-8 mb-4">2. Information We Collect</h2>
            <p>
              We collect information you provide directly to us, such as when you create an account (name, email), 
              and the metadata/notes you provide when storing secrets. 
            </p>

            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mt-8 mb-4">3. Use of AI</h2>
            <p>
              Smriti utilizes AI services to parse notes, extract expiry dates, and provide semantic search capabilities. 
              The actual sensitive values (e.g., API keys, passwords) are never transmitted to third-party AI models. 
              Only the contextual notes and tags are processed.
            </p>

            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mt-8 mb-4">4. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at{' '}
              <a href="mailto:mrasgour1004@gmail.com" className="text-primary-600 dark:text-primary-400 hover:underline">mrasgour1004@gmail.com</a>.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
