import NoteCard from './NoteCard'
import EmptyState from '../ui/EmptyState'
import { StickyNote } from 'lucide-react'
import Button from '../ui/Button'
import { SkeletonList } from '../ui/Skeleton'

export default function MasonryGrid({ notes, loading, emptyMessage, onNew, onEdit, onDelete }) {
  if (loading) return <SkeletonList count={3} />

  if (!notes?.length) {
    return (
      <EmptyState
        icon={<StickyNote size={20} />}
        title="No notes yet"
        description={emptyMessage || 'Create securely encrypted notes that stay completely private.'}
        action={onNew && <Button onClick={onNew} size="sm">Add Note</Button>}
      />
    )
  }

  return (
    <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-0">
      {notes.map(note => (
        <NoteCard 
          key={note.id} 
          note={note} 
          onEdit={onEdit} 
          onDelete={onDelete} 
        />
      ))}
    </div>
  )
}
