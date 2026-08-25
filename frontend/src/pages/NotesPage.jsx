import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, StickyNote, Trash2, Clock, ChevronLeft, Search } from 'lucide-react'
import { noteService } from '../services/noteService'
import NoteEditor from '../components/notes/NoteEditor'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import toast from 'react-hot-toast'
import { formatRelativeDate } from '../utils/formatDate'
import { cn } from '../utils/cn'

export default function NotesPage() {
  const qc = useQueryClient()
  const [selectedNoteId, setSelectedNoteId] = useState(null)
  const [editorTitle, setEditorTitle] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, data: null })
  const [createModal, setCreateModal] = useState({ open: false, title: '' })

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['notes', 'global'],
    queryFn: noteService.getGlobalNotes
  })

  const filteredNotes = notes.filter(note => 
    (note.title || 'Untitled Document').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (note.content || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  // When a note is selected, populate the title state
  const selectedNote = notes.find(n => n.id === selectedNoteId) || null
  
  useEffect(() => {
    if (selectedNote) {
      setEditorTitle(selectedNote.title || '')
    } else {
      setEditorTitle('')
    }
  }, [selectedNoteId, selectedNote?.title])

  const createMutation = useMutation({
    mutationFn: noteService.createGlobalNote,
    onSuccess: (newNote) => {
      qc.setQueryData(['notes', 'global'], (old) => old ? [newNote, ...old] : [newNote])
      setSelectedNoteId(newNote.id)
      setCreateModal({ open: false, title: '' })
      toast.success('New document created')
    },
    onError: () => toast.error('Failed to create document')
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => noteService.updateNote(id, data),
    onSuccess: () => {
      qc.invalidateQueries(['notes'])
      // Removed toast.success so auto-save is silent and non-intrusive
    },
    onError: () => toast.error('Failed to save document')
  })

  const deleteMutation = useMutation({
    mutationFn: noteService.deleteNote,
    onSuccess: () => {
      qc.invalidateQueries(['notes'])
      setDeleteConfirm({ open: false, data: null })
      if (selectedNoteId === deleteConfirm.data?.id) setSelectedNoteId(null)
      toast.success('Document deleted')
    },
    onError: () => toast.error('Failed to delete document')
  })

  const handleCreateSubmit = (e) => {
    e.preventDefault()
    createMutation.mutate({ 
      title: createModal.title.trim() || 'Untitled Document', 
      content: '<p></p>' 
    })
  }

  const handleSave = (htmlContent, currentTitle = editorTitle) => {
    if (!selectedNoteId) return;
    updateMutation.mutate({
      id: selectedNoteId,
      data: {
        title: currentTitle,
        content: htmlContent
      }
    })
  }

  return (
    <div className="absolute inset-0 z-10 pb-[56px] lg:pb-0 flex bg-neutral-50 dark:bg-neutral-950 animate-fade-in overflow-hidden">
      
      {/* Left Sidebar: Document List */}
      <div className={cn(
        "w-full md:w-72 shrink-0 border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex-col",
        selectedNoteId ? "hidden md:flex" : "flex"
      )}>
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-neutral-900 dark:text-white font-semibold">
            <StickyNote size={18} className="text-primary-500" />
            Global Notes
            {!isLoading && notes.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-[10px] font-medium text-neutral-500 dark:text-neutral-400">
                {notes.length}
              </span>
            )}
          </div>
          <button 
            onClick={() => setCreateModal({ open: true, title: '' })}
            className="p-1.5 bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 rounded-md hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors"
            title="New Document"
          >
            <Plus size={16} />
          </button>
        </div>

        <div className="p-3 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all placeholder:text-neutral-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-1">
          {isLoading ? (
            <div className="text-sm text-neutral-500 p-4 text-center">Loading documents...</div>
          ) : notes.length === 0 ? (
            <div className="text-sm text-neutral-500 p-4 text-center">No documents yet. Create one!</div>
          ) : filteredNotes.length === 0 ? (
            <div className="text-sm text-neutral-500 p-4 text-center">No matching documents found.</div>
          ) : (
            filteredNotes.map(note => (
              <button
                key={note.id}
                onClick={() => setSelectedNoteId(note.id)}
                className={cn(
                  "w-full text-left px-3 py-3 rounded-lg border flex flex-col gap-1 transition-all group",
                  selectedNoteId === note.id
                    ? "bg-primary-50 border-primary-200 dark:bg-primary-900/20 dark:border-primary-800/50 shadow-sm"
                    : "bg-transparent border-transparent hover:bg-neutral-50 hover:border-neutral-200 dark:hover:bg-neutral-800/50 dark:hover:border-neutral-700/50"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className={cn(
                    "text-sm font-medium truncate",
                    selectedNoteId === note.id ? "text-primary-900 dark:text-primary-100" : "text-neutral-700 dark:text-neutral-300"
                  )}>
                    {note.title || 'Untitled Document'}
                  </span>
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirm({ open: true, data: note });
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 -mt-1 -mr-1 text-danger-500 hover:bg-danger-100 dark:hover:bg-danger-900/30 rounded"
                  >
                    <Trash2 size={13} />
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-neutral-500">
                  <Clock size={10} />
                  {formatRelativeDate(note.updatedAt || note.createdAt)}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right Content: A4 Editor */}
      <div className={cn(
        "flex-1 overflow-y-auto bg-neutral-100 dark:bg-neutral-950 sm:p-10 flex-col relative",
        !selectedNoteId ? "hidden md:flex" : "flex"
      )}>
        {selectedNote ? (
          <div className="flex flex-col h-full w-full max-w-4xl mx-auto">
            <button 
              onClick={() => setSelectedNoteId(null)}
              className="md:hidden flex items-center gap-1 text-sm text-neutral-500 m-4 hover:text-neutral-800 dark:hover:text-neutral-200"
            >
              <ChevronLeft size={16} /> Back to Notes
            </button>
            <NoteEditor 
              key={selectedNote.id} // Forces re-mount and state reset on document switch
              initialContent={selectedNote.content}
              title={editorTitle}
              onTitleChange={setEditorTitle}
              onSave={handleSave}
              isSaving={updateMutation.isPending}
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-neutral-400 dark:text-neutral-600">
            <StickyNote size={48} className="mb-4 opacity-50" />
            <p className="text-lg font-medium text-neutral-500 dark:text-neutral-400">No document selected</p>
            <p className="text-sm mt-1">Select a document from the sidebar or create a new one.</p>
            <button 
              onClick={() => setCreateModal({ open: true, title: '' })}
              className="mt-6 px-4 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-sm font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-2"
            >
              <Plus size={16} /> Create Document
            </button>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal
        open={createModal.open}
        onClose={() => setCreateModal({ open: false, title: '' })}
        title="New Document"
        size="sm"
      >
        <form onSubmit={handleCreateSubmit} className="p-6 space-y-6">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Document Title</label>
            <input
              type="text"
              autoFocus
              className="input-base w-full"
              placeholder="e.g. Server Migration Plan"
              value={createModal.title}
              onChange={e => setCreateModal({ ...createModal, title: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setCreateModal({ open: false, title: '' })}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={createMutation.isPending}
              disabled={!createModal.title.trim()}
            >
              Create
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        open={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, data: null })}
        title="Delete Document"
        size="sm"
      >
        <div className="p-6 space-y-6">
          <p className="text-sm text-neutral-600 dark:text-neutral-300">
            Are you sure you want to delete <strong>{deleteConfirm.data?.title || 'Untitled Document'}</strong>?
            <br /><br />
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeleteConfirm({ open: false, data: null })}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(deleteConfirm.data.id)}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  )
}
