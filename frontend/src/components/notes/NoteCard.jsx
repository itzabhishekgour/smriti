import { useState } from 'react'
import { MoreHorizontal, Trash2, Pencil, Calendar } from 'lucide-react'
import { formatRelativeDate } from '../../utils/formatDate'

export default function NoteCard({ note, onEdit, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false)

  // Quick formatting for standard text notes (respects newlines)
  const formattedContent = note.content
    ? note.content.split('\n').map((line, i) => (
        <span key={i}>
          {line}
          <br />
        </span>
      ))
    : ''

  return (
    <div 
      className="card p-4 hover:border-neutral-300 hover:shadow-md transition-all duration-200 cursor-pointer group flex flex-col break-inside-avoid mb-4"
      onClick={() => onEdit(note)}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-[15px] font-semibold text-neutral-900 dark:text-neutral-100 leading-snug">
          {note.title || 'Untitled'}
        </h3>
        <div className="relative flex-shrink-0" onClick={e => e.stopPropagation()}>
          <button
            className="icon-btn opacity-0 group-hover:opacity-100 transition-opacity -mt-1 -mr-1"
            onClick={() => setMenuOpen(v => !v)}
          >
            <MoreHorizontal size={15} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-7 z-20 w-32 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-md py-1 animate-fade-in">
              <button
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                onClick={() => { setMenuOpen(false); onEdit(note) }}
              >
                <Pencil size={13} /> Edit
              </button>
              <button
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/30"
                onClick={() => { setMenuOpen(false); onDelete(note) }}
              >
                <Trash2 size={13} /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="text-sm text-neutral-600 dark:text-neutral-300 whitespace-pre-wrap leading-relaxed line-clamp-[12] relative">
        {formattedContent}
      </div>

      <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800/60 flex items-center gap-1.5 text-[10px] text-neutral-400 dark:text-neutral-500 mt-auto">
        <Calendar size={11} />
        {formatRelativeDate(note.updatedAt || note.createdAt)}
      </div>
    </div>
  )
}
