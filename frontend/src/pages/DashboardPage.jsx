import { useQuery } from '@tanstack/react-query'
import { Key, FolderOpen, AlertTriangle, Clock, ArrowRight, StickyNote } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { projectService } from '../services/projectService'
import { secretService } from '../services/secretService'
import { noteService } from '../services/noteService'
import { Skeleton } from '../components/ui/Skeleton'

function StatCard({ icon, label, value, accent = 'primary', loading }) {
  const accentMap = {
    primary: 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400',
    warning: 'bg-warning-50 dark:bg-warning-900/30 text-warning-600 dark:text-warning-400',
    danger:  'bg-danger-50 dark:bg-danger-900/30 text-danger-600 dark:text-danger-400',
    success: 'bg-success-50 dark:bg-success-900/30 text-success-600 dark:text-success-400',
  }
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60 p-4 sm:p-5 flex flex-col justify-between hover:shadow-md hover:border-neutral-300 dark:hover:border-neutral-700 transition-all duration-300 group min-h-[110px] sm:min-h-[120px] shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className="text-xs sm:text-sm font-medium text-neutral-500 dark:text-neutral-400 leading-tight">{label}</div>
        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${accentMap[accent]} group-hover:scale-110 transition-transform duration-300 shadow-sm ml-2`}>
          {icon}
        </div>
      </div>
      <div>
        {loading ? (
          <Skeleton className="h-7 w-12" />
        ) : (
          <div className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">{value}</div>
        )}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()

  const { data: projects, isLoading: projLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: projectService.getAll,
  })

  const { data: secrets, isLoading: secLoading } = useQuery({
    queryKey: ['secrets'],
    queryFn: () => secretService.getAll(),
  })

  const { data: notes, isLoading: notesLoading } = useQuery({
    queryKey: ['notes', 'global'],
    queryFn: noteService.getGlobalNotes
  })

  const totalSecrets = secrets?.length ?? 0
  const expiringSoon = secrets?.filter(s => s.isExpiringSoon || s.isExpired).length ?? 0
  const totalProjects = projects?.length ?? 0
  const totalNotes = notes?.length ?? 0
  const recentSecrets = secrets
    ? [...secrets].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5)
    : []
  const recentProjects = projects
    ? [...projects].slice(0, 4)
    : []

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
          Good {getGreeting()}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          Here's what's happening in your vault.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <StatCard
          icon={<FolderOpen size={18} strokeWidth={2.5} />}
          label="Projects"
          value={totalProjects}
          accent="primary"
          loading={projLoading}
        />
        <StatCard
          icon={<Key size={18} strokeWidth={2.5} />}
          label="Total Secrets"
          value={totalSecrets}
          accent="success"
          loading={secLoading}
        />
        <StatCard
          icon={<AlertTriangle size={18} strokeWidth={2.5} />}
          label="Expiring Soon"
          value={expiringSoon}
          accent={expiringSoon > 0 ? 'danger' : 'warning'}
          loading={secLoading}
        />
        <StatCard
          icon={<StickyNote size={18} strokeWidth={2.5} />}
          label="Global Notes"
          value={totalNotes}
          accent="primary"
          loading={notesLoading}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-5 sm:gap-6">
        {/* Recent Projects */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60 overflow-hidden shadow-sm flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/20">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Recent Projects</h2>
            <Link
              to="/projects"
              className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center gap-1 transition-colors"
            >
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="flex-1">
            {projLoading ? (
              <div className="p-4 space-y-3">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}
              </div>
            ) : recentProjects.length === 0 ? (
              <p className="text-sm text-neutral-400 dark:text-neutral-500 py-6 text-center">
                No projects yet.{' '}
                <Link to="/projects" className="text-primary-600 dark:text-primary-400 hover:underline">
                  Create one
                </Link>
              </p>
            ) : (
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
                {recentProjects.map(p => (
                  <Link
                    key={p.id}
                    to={`/projects/${p.id}`}
                    className="flex items-center justify-between p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm"
                        style={{ backgroundColor: p.color || '#6366f1' }}
                      />
                      <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate">
                        {p.name}
                      </span>
                    </div>
                    <ArrowRight size={16} className="text-neutral-300 dark:text-neutral-600 group-hover:text-neutral-500 transition-colors flex-shrink-0 ml-3" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Secrets */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60 overflow-hidden shadow-sm flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/20">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Recently Added Secrets</h2>
          </div>
          <div className="flex-1">
            {secLoading ? (
              <div className="p-4 space-y-3">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}
              </div>
            ) : recentSecrets.length === 0 ? (
              <p className="text-sm text-neutral-400 dark:text-neutral-500 py-6 text-center">
                No secrets yet. Open a project to add one.
              </p>
            ) : (
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
                {recentSecrets.map(s => (
                  <Link
                    key={s.id}
                    to={`/projects/${s.projectId}/secrets/${s.id}`}
                    className="flex items-center justify-between p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors group"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate mb-0.5">{s.name}</div>
                      <div className="text-[11px] text-neutral-400 dark:text-neutral-500 truncate font-medium tracking-wide uppercase">{s.projectName ?? 'Unknown project'}</div>
                    </div>
                    <ArrowRight size={16} className="text-neutral-300 dark:text-neutral-600 group-hover:text-neutral-500 transition-colors flex-shrink-0 ml-3" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expiring secrets alert */}
      {expiringSoon > 0 && (
        <div className="mt-6 rounded-2xl border border-danger-200 dark:border-danger-900/60 bg-danger-50 dark:bg-danger-900/20 p-5 flex items-start sm:items-center gap-4 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-danger-100 dark:bg-danger-900/40 flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-0">
            <AlertTriangle size={20} className="text-danger-600 dark:text-danger-400" />
          </div>
          <p className="text-sm text-danger-800 dark:text-danger-300 leading-relaxed">
            <strong className="font-semibold text-danger-900 dark:text-danger-200">{expiringSoon} secret{expiringSoon > 1 ? 's' : ''}</strong> are expiring soon or already expired. Please review them before they stop working.
          </p>
        </div>
      )}
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}
