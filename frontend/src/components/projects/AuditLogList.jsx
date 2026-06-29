// Triggering Vite reload
import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { auditLogService } from '../../services/auditLogService'
import { Activity, Clock, Eye, Download, Shield, Plus, Edit2, Trash2, Link as LinkIcon, RefreshCw } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Card, { CardHeader, CardBody } from '../ui/Card'
import EmptyState from '../ui/EmptyState'
import { Skeleton } from '../ui/Skeleton'

const getActionIcon = (action) => {
  switch (action) {
    case 'SECRET_VIEWED': return <Eye size={14} className="text-blue-500" />
    case 'SECRET_CREATED': return <Plus size={14} className="text-emerald-500" />
    case 'SECRET_UPDATED': return <Edit2 size={14} className="text-amber-500" />
    case 'SECRET_DELETED': return <Trash2 size={14} className="text-red-500" />
    case 'SECRETS_EXPORTED': return <Download size={14} className="text-indigo-500" />
    case 'PROJECT_CREATED': return <Plus size={14} className="text-emerald-500" />
    case 'PROJECT_UPDATED': return <Edit2 size={14} className="text-amber-500" />
    case 'PROJECT_DELETED': return <Trash2 size={14} className="text-red-500" />
    case 'ROLE_CHANGED': return <Shield size={14} className="text-purple-500" />
    case 'MAGIC_LINK_GENERATED': return <LinkIcon size={14} className="text-cyan-500" />
    case 'MAGIC_LINK_ACCESSED': return <Eye size={14} className="text-cyan-500" />
    case 'MAGIC_LINK_REVOKED': return <Trash2 size={14} className="text-red-500" />
    case 'BULK_IMPORT_PERFORMED': return <RefreshCw size={14} className="text-indigo-500" />
    default: return <Activity size={14} className="text-neutral-500" />
  }
}

const formatActionText = (log) => {
  const name = log.userName
  const target = log.targetName || 'item'
  const meta = log.metadata ? JSON.parse(log.metadata) : {}

  switch (log.actionType) {
    case 'SECRET_VIEWED': return `${name} viewed/copied secret "${target}"`
    case 'SECRET_CREATED': return `${name} created secret "${target}"`
    case 'SECRET_UPDATED': return `${name} updated secret "${target}"`
    case 'SECRET_DELETED': return `${name} deleted secret "${target}"`
    case 'SECRETS_EXPORTED': return `${name} exported secrets as .env`
    case 'PROJECT_CREATED': return `${name} created the project`
    case 'PROJECT_UPDATED': return `${name} updated project settings`
    case 'PROJECT_DELETED': return `${name} deleted the project`
    case 'ROLE_CHANGED': return `${name} changed role to ${meta.to} for ${target}`
    case 'MAGIC_LINK_GENERATED': return `${name} generated a magic link (expires: ${new Date(meta.expiresAt).toLocaleDateString()})`
    case 'MAGIC_LINK_ACCESSED': return `${name} accessed a magic link`
    case 'MAGIC_LINK_REVOKED': return `${name} revoked a magic link`
    case 'BULK_IMPORT_PERFORMED': return `${name} performed a bulk import`
    case 'USER_LOGIN': return `${name} logged in`
    case 'USER_LOGIN_FAILED': return `Failed login attempt for ${target}`
    default: return `${name} performed ${log.actionType} on ${target}`
  }
}

export default function AuditLogList({ projectId, isOwner }) {
  const [includeViews, setIncludeViews] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', projectId, includeViews],
    queryFn: () => auditLogService.getLogs(projectId, { includeViews })
  })

  if (isLoading) {
    return (
      <Card className="mt-8">
        <CardBody className="space-y-6">
          <div className="flex gap-4 items-center"><Skeleton className="w-8 h-8 rounded-full flex-shrink-0" /><div className="space-y-2 flex-1"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/4" /></div></div>
          <div className="flex gap-4 items-center"><Skeleton className="w-8 h-8 rounded-full flex-shrink-0" /><div className="space-y-2 flex-1"><Skeleton className="h-4 w-1/2" /><Skeleton className="h-3 w-1/4" /></div></div>
          <div className="flex gap-4 items-center"><Skeleton className="w-8 h-8 rounded-full flex-shrink-0" /><div className="space-y-2 flex-1"><Skeleton className="h-4 w-2/3" /><Skeleton className="h-3 w-1/4" /></div></div>
        </CardBody>
      </Card>
    )
  }

  const logs = data?.content || []

  return (
    <Card className="mt-8">
      <CardHeader className="flex items-center justify-between !py-4">
        <div>
          <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <Activity size={16} className="text-primary-500" />
            {isOwner ? 'Project Activity Logs' : 'Your Activity'}
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            {isOwner ? 'Track all meaningful actions across this project.' : 'Track your recent actions in this project.'}
          </p>
        </div>
        
        <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800 px-3 py-1.5 rounded-lg transition-colors">
          <input 
            type="checkbox" 
            checked={includeViews} 
            onChange={(e) => setIncludeViews(e.target.checked)} 
            className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="text-neutral-600 dark:text-neutral-300">Show all activity (including views)</span>
        </label>
      </CardHeader>

      <CardBody className="!p-5">
        {logs.length === 0 ? (
          <EmptyState
            icon={<Activity size={24} />}
            title="No activity yet"
            description="No matching activity events found in this project."
          />
        ) : (
          <div className="relative border-l border-neutral-200 dark:border-neutral-800 ml-3 space-y-6">
            {logs.map((log) => (
              <div key={log.id} className="relative pl-6">
                <div className="absolute -left-3.5 top-0.5 w-7 h-7 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center shadow-sm">
                  {getActionIcon(log.actionType)}
                </div>
                <div>
                  <p className="text-sm text-neutral-900 dark:text-neutral-100">
                    {formatActionText(log)}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 flex items-center gap-1">
                    <Clock size={12} />
                    {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  )
}
