import SecretCard from './SecretCard'
import { SkeletonList } from '../ui/Skeleton'
import EmptyState from '../ui/EmptyState'
import { Key } from 'lucide-react'
import Button from '../ui/Button'

export default function SecretList({ secrets, loading, projectId, canEdit = true, onNew, onEdit, onDelete, emptyMessage }) {
  if (loading) return <SkeletonList count={4} />

  if (!secrets?.length) {
    return (
      <EmptyState
        icon={<Key size={20} />}
        title="No secrets here"
        description={emptyMessage || 'Add your first secret — API key, token, or credential — with full context.'}
        action={onNew && <Button onClick={onNew} size="sm">Add Secret</Button>}
      />
    )
  }

  return (
    <div className="space-y-3">
      {secrets.map((secret) => (
        <SecretCard
          key={secret.id}
          secret={secret}
          projectId={projectId || secret.projectId}
          canEdit={canEdit}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
