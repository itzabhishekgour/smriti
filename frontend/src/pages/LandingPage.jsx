import { Link } from 'react-router-dom'
import { Shield, Search, Clock, Lock, ArrowRight, Layers, Cpu, FolderOpen, Cloud } from 'lucide-react'
import Logo from '../components/ui/Logo'
import Button from '../components/ui/Button'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 font-sans selection:bg-primary-100 dark:selection:bg-primary-900/50 selection:text-primary-900 dark:selection:text-primary-100">
      {/* 1. Navbar */}
      <nav className="fixed top-0 inset-x-0 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Logo className="w-9 h-9" />
            <div className="flex flex-col justify-center mt-1">
              <span className="text-[17px] font-bold tracking-tight text-neutral-900 dark:text-white leading-none mb-1">
                Smriti
              </span>
              <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-primary-500/80 dark:text-primary-400/80 leading-none">
                By Tinexus
              </span>
            </div>
          </div>
          
          <div className="hidden md:flex gap-8">
            <a href="#features" className="text-sm font-medium text-neutral-600 dark:text-neutral-400 dark:text-neutral-500 hover:text-neutral-900 dark:text-neutral-100 dark:hover:text-neutral-200">Features</a>
            <a href="#security" className="text-sm font-medium text-neutral-600 dark:text-neutral-400 dark:text-neutral-500 hover:text-neutral-900 dark:text-neutral-100 dark:hover:text-neutral-200">Security</a>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-medium text-neutral-600 dark:text-neutral-400 dark:text-neutral-500 hover:text-neutral-900 dark:text-neutral-100 dark:hover:text-neutral-200">Log in</Link>
            <Link to="/signup">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* 2. Hero Section */}
      <section className="pt-28 pb-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-xs font-semibold mb-6 border border-primary-100 dark:border-primary-800/50">
          <span className="flex h-2 w-2 rounded-full bg-primary-600"></span>
          Smriti Beta is now live
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold text-neutral-900 dark:text-neutral-50 tracking-tight mb-5 leading-tight">
          Never lose track of your{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-orange-500">
            secrets again.
          </span>
        </h1>
        <p className="mt-4 text-base sm:text-xl text-neutral-500 dark:text-neutral-400 max-w-2xl mx-auto mb-8 leading-relaxed px-1">
          Store your API keys, environment variables, and passwords with full context.
          AI-powered search ensures you find what you need, exactly when you need it.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/signup" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto h-12 px-8 text-base shadow-lg shadow-primary-500/20">
              Get Started Free
            </Button>
          </Link>
          <a href="#features" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="w-full sm:w-auto h-12 px-8 text-base bg-white dark:bg-neutral-900">
              View Features
            </Button>
          </a>
        </div>
        
        {/* Abstract visual mockup */}
        <div className="mt-12 relative max-w-5xl mx-auto">
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/10 to-orange-500/10 rounded-2xl blur-3xl"></div>
          <div className="relative bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl p-3 sm:p-6 overflow-hidden text-left">

             {/* Mock Dashboard UI */}
             <div className="bg-neutral-50 dark:bg-neutral-950/50 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 sm:p-6 flex flex-col gap-4 sm:gap-6">

                {/* Header Mock */}
                <div className="flex justify-between items-start sm:items-center">
                  <div>
                    <h3 className="text-base sm:text-xl font-semibold text-neutral-900 dark:text-neutral-100">Good morning, Developer 👋</h3>
                    <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">Here's an overview of your secrets vault.</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-3">
                    <div className="h-9 w-48 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-md flex items-center px-3">
                      <Search size={14} className="text-neutral-400" />
                      <span className="text-sm text-neutral-400 ml-2">Search secrets...</span>
                    </div>
                    <div className="h-9 px-4 bg-primary-600 text-white rounded-md flex items-center justify-center text-sm font-medium whitespace-nowrap">
                      + Add Secret
                    </div>
                  </div>
                </div>

                {/* Stats Mock */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Projects', val: '4', icon: <Layers size={16}/>, col: 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400' },
                    { label: 'Total Secrets', val: '128', icon: <Lock size={16}/>, col: 'bg-success-50 text-success-600 dark:bg-success-900/30 dark:text-success-400' },
                    { label: 'Expiring Soon', val: '2', icon: <Clock size={16}/>, col: 'bg-warning-50 text-warning-600 dark:bg-warning-900/30 dark:text-warning-400' },
                    { label: 'Security Score', val: '98%', icon: <Shield size={16}/>, col: 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400' }
                  ].map((s, i) => (
                    <div key={i} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-3 sm:p-4 rounded-xl flex items-center gap-2 sm:gap-4">
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0 ${s.col}`}>
                        {s.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="text-base sm:text-xl font-bold text-neutral-900 dark:text-neutral-100">{s.val}</div>
                        <div className="text-[10px] sm:text-xs text-neutral-500 dark:text-neutral-400 truncate">{s.label}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Projects Mock — hidden on mobile to prevent overflow */}
                <div className="hidden sm:grid sm:grid-cols-3 gap-4">
                  {[
                    { name: 'Stripe Integration', sec: 14, color: '#6366f1' },
                    { name: 'AWS Production', sec: 42, color: '#f59e0b' },
                    { name: 'GitHub Webhooks', sec: 8, color: '#ec4899' },
                  ].map((p, i) => (
                    <div key={i} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 rounded-xl flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: p.color + '20', color: p.color }}>
                          <FolderOpen size={16} />
                        </div>
                        <div className="font-medium text-neutral-900 dark:text-neutral-100 text-sm truncate">{p.name}</div>
                      </div>
                      <div className="mt-2 text-xs text-neutral-400 font-mono">••••••••••••</div>
                      <div className="text-[11px] text-neutral-500 mt-auto pt-2 border-t border-neutral-100 dark:border-neutral-800">
                        {p.sec} active secrets
                      </div>
                    </div>
                  ))}
                </div>

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent dark:from-neutral-900 dark:via-neutral-900/20 pointer-events-none rounded-2xl"></div>
             </div>
          </div>
        </div>
      </section>

      {/* 3. Trust Strip */}
      <section className="py-8 border-y border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-xs sm:text-sm font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-5">Built for modern developer workflows</p>
          <div className="flex flex-wrap justify-center gap-5 md:gap-16 opacity-50 grayscale dark:opacity-30">
             <div className="font-bold text-base sm:text-xl flex items-center gap-2"><Cpu size={20}/> TechCorp</div>
             <div className="font-bold text-base sm:text-xl flex items-center gap-2"><Layers size={20}/> StackFlow</div>
             <div className="font-bold text-base sm:text-xl flex items-center gap-2"><Search size={20}/> QueryBase</div>
          </div>
        </div>
      </section>

      {/* 4. Features Section */}
      <section id="features" className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-3">What Smriti actually does</h2>
          <p className="text-base sm:text-lg text-neutral-500 dark:text-neutral-400 max-w-2xl mx-auto px-2">No more digging through Slack, Notion, or .env files. Your secrets live in one place, encrypted, with context.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
          {[
            { icon: Shield, title: 'Encrypted before it saves', desc: 'Every secret value is encrypted with AES-256-GCM before it touches the database. Not even we can read it.' },
            { icon: Search, title: 'Search by memory', desc: "Can't remember the key name? Search by context, like \"that Stripe key from last month\", and find it instantly." },
            { icon: Cloud, title: 'Push to GitHub & Render', desc: 'Sync secrets directly to GitHub Actions environments or Render services. One click, done.' },
            { icon: Search, title: 'Catch leaks early', desc: 'A pre-commit hook scans your staged files before every push. Also runs scheduled scans via the GitHub API.' },
            { icon: Layers, title: 'Share without hassle', desc: 'Invite teammates as Owner, Editor, or Viewer. Or send a one-time magic link to someone without an account.' },
            { icon: Clock, title: 'Full history, always', desc: "Every view, edit, and rollback is logged with a timestamp. You'll also get notified before a key expires." }
          ].map((feat, i) => (
            <div key={i} className="bg-white dark:bg-neutral-900 p-5 sm:p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0">
                  <feat.icon size={18} />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-neutral-100">{feat.title}</h3>
              </div>
              <p className="text-sm sm:text-base text-neutral-500 dark:text-neutral-400 leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. How It Works */}
      <section className="py-16 sm:py-24 bg-white dark:bg-neutral-900 border-y border-neutral-200 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-3">How Smriti Works</h2>
            <p className="text-base sm:text-lg text-neutral-500 dark:text-neutral-400">Three simple steps to secure your context.</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-8 sm:gap-12 relative">
            <div className="hidden md:block absolute top-10 left-1/6 right-1/6 h-0.5 bg-neutral-100 dark:bg-neutral-800 z-0"></div>

            {[
              { step: '01', title: 'Add a Secret', desc: 'Paste your key along with a note about why it was created and who gave it to you.' },
              { step: '02', title: 'AI Organizes It', desc: 'Smriti parses your notes, extracting metadata, tags, and expiry dates automatically.' },
              { step: '03', title: 'Find Instantly', desc: 'Search for "that Stripe key somebody gave me last week" and find it immediately.' }
            ].map((item, i) => (
              <div key={i} className="relative z-10 flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-white dark:bg-neutral-900 border-2 border-primary-100 dark:border-primary-900/30 flex items-center justify-center text-xl font-bold text-primary-600 dark:text-primary-400 mb-4 shadow-sm">
                  {item.step}
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">{item.title}</h3>
                <p className="text-sm sm:text-base text-neutral-500 dark:text-neutral-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Security Section */}
      <section id="security" className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-primary-950 rounded-3xl p-6 sm:p-10 md:p-16 flex flex-col md:flex-row items-start md:items-center gap-8 md:gap-12 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-600/20 to-orange-500/20 rounded-full blur-3xl"></div>

           <div className="flex-1 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-900 text-primary-300 text-xs font-semibold mb-5 border border-primary-800">
              <Lock size={14} /> Enterprise-grade Security
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
              Your secrets are{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-orange-400">cryptographically secured</span>.
            </h2>
            <p className="text-primary-200 text-sm sm:text-lg mb-6 leading-relaxed">
              We use industry-standard AES-256-GCM authenticated encryption.
              Your data is encrypted at rest and in transit. Trust is our primary feature.
            </p>
            <ul className="space-y-3">
              {['AES-256 encryption at rest', 'Stateless JWT authentication', 'Secure HTTPS transport only', 'Strict cross-origin resource sharing'].map((text, i) => (
                <li key={i} className="flex items-center gap-3 text-primary-100 text-sm sm:text-base">
                  <div className="w-5 h-5 rounded-full bg-primary-800 flex items-center justify-center shrink-0">
                    <Shield size={12} className="text-primary-300" />
                  </div>
                  {text}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative z-10 w-full md:flex-1 md:max-w-md">
            <div className="bg-primary-900/50 backdrop-blur border border-primary-800 p-4 sm:p-6 rounded-2xl overflow-x-auto">
              <pre className="text-primary-300 text-xs sm:text-sm"><code>{`{
  "algorithm": "AES-256-GCM",
  "keyLength": 256,
  "ivLength": 96,
  "tagLength": 128,
  "status": "SECURE"
}`}</code></pre>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Final CTA Section */}
      <section className="py-16 sm:py-24 text-center px-4">
        <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-neutral-50 mb-4">Start securing your secrets today</h2>
        <p className="text-base sm:text-xl text-neutral-500 dark:text-neutral-400 mb-8 max-w-2xl mx-auto px-2">Join developers who have already upgraded their secret management workflow.</p>
        <Link to="/signup">
          <Button size="lg" className="h-12 sm:h-14 px-8 sm:px-10 text-base sm:text-lg shadow-xl shadow-primary-500/20 group">
            Get Started Free
            <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </section>

      {/* 8. Footer */}
      <footer className="bg-white dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-800 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center gap-5 md:flex-row md:justify-between">
          <div className="flex items-center gap-3">
            <Logo className="w-6 h-6 grayscale opacity-60" />
            <span className="text-neutral-500 dark:text-neutral-400 font-medium">Smriti</span>
          </div>
          <p className="text-sm text-neutral-400 dark:text-neutral-500 text-center">© {new Date().getFullYear()} Tinexus. All rights reserved.</p>
          <div className="flex gap-6">
            <Link to="/privacy" className="text-sm text-neutral-400 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200">Privacy</Link>
            <Link to="/terms" className="text-sm text-neutral-400 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200">Terms</Link>
            <a href="mailto:mrasgour1004@gmail.com" className="text-sm text-neutral-400 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
