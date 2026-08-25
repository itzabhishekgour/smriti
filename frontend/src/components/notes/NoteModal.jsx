import { useState, useEffect } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { noteService } from '../../services/noteService'
import toast from 'react-hot-toast'

export default function NoteModal({ open, onClose, note, projectId = null }) {
  const isEdit = !!note
  const qc = useQueryClient()
  
  const [form, setForm] = useState({
    title: note?.title || '',
    content: note?.content || ''
  })
  
  useEffect(() => {
    if (open) {
      setForm({
        title: note?.title || '',
        content: note?.content || ''
      })
    }
  }, [open, note])

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (isEdit) {
        return await noteService.updateNote(note.id, data)
      } else {
        if (projectId) {
          return await noteService.createProjectNote(projectId, data)
        } else {
          return await noteService.createGlobalNote(data)
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries(['notes'])
      toast.success(isEdit ? 'Note updated' : 'Note created')
      onClose()
    },
    onError: (e) => {
      toast.error('Failed to save note')
    }
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.content.trim() && !form.title.trim()) {
      toast.error('Note cannot be completely empty')
      return
    }
    mutation.mutate(form)
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Note' : 'New Note'} size="md">
      <form onSubmit={handleSubmit} className="p-4 sm:p-6 flex flex-col gap-4">
        
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Title</label>
          <input
            type="text"
            className="input-base text-lg font-medium"
            placeholder="Title"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            autoFocus={!isEdit}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Note Content (Encrypted)</label>
          <textarea
            className="input-base resize-none min-h-[200px]"
            placeholder="Write your note here... (Markdown not yet supported, but newlines are respected)"
            value={form.content}
            onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
          />
        </div>

        <div className="flex justify-end gap-3 mt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={mutation.isPending}>
            {isEdit ? 'Save Changes' : 'Create Note'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
