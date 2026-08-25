import { useRef, useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { 
  Bold, Italic, Strikethrough, 
  Heading1, Heading2, Heading3, 
  List, ListOrdered, Quote, 
  Undo, Redo, Save
} from 'lucide-react'
import { cn } from '../../utils/cn'

const MenuBar = ({ editor, onSave, isSaving }) => {
  if (!editor) return null

  const ToggleBtn = ({ onClick, isActive, disabled, children }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "p-1.5 rounded text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 dark:hover:text-neutral-200 transition-colors",
        isActive && "bg-neutral-200 text-neutral-900 dark:bg-neutral-700 dark:text-white",
        disabled && "opacity-50 cursor-not-allowed hover:bg-transparent hover:text-neutral-500"
      )}
    >
      {children}
    </button>
  )

  return (
    <div className="flex items-center flex-wrap gap-1 border-b border-neutral-200 dark:border-neutral-800 pb-3 mb-4">
      <ToggleBtn
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
      >
        <Bold size={16} />
      </ToggleBtn>
      <ToggleBtn
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
      >
        <Italic size={16} />
      </ToggleBtn>
      <ToggleBtn
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        isActive={editor.isActive('strike')}
      >
        <Strikethrough size={16} />
      </ToggleBtn>

      <div className="w-px h-5 bg-neutral-300 dark:bg-neutral-700 mx-1" />

      <ToggleBtn
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive('heading', { level: 1 })}
      >
        <Heading1 size={16} />
      </ToggleBtn>
      <ToggleBtn
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive('heading', { level: 2 })}
      >
        <Heading2 size={16} />
      </ToggleBtn>
      <ToggleBtn
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={editor.isActive('heading', { level: 3 })}
      >
        <Heading3 size={16} />
      </ToggleBtn>

      <div className="w-px h-5 bg-neutral-300 dark:bg-neutral-700 mx-1" />

      <ToggleBtn
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
      >
        <List size={16} />
      </ToggleBtn>
      <ToggleBtn
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
      >
        <ListOrdered size={16} />
      </ToggleBtn>
      <ToggleBtn
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive('blockquote')}
      >
        <Quote size={16} />
      </ToggleBtn>

      <div className="w-px h-5 bg-neutral-300 dark:bg-neutral-700 mx-1" />

      <ToggleBtn
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
      >
        <Undo size={16} />
      </ToggleBtn>
      <ToggleBtn
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
      >
        <Redo size={16} />
      </ToggleBtn>

      <div className="flex-1" />

      <button 
        onClick={onSave}
        disabled={isSaving}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors text-sm font-medium disabled:opacity-50"
      >
        {isSaving ? (
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <Save size={16} />
        )}
        Save
      </button>
    </div>
  )
}

export default function NoteEditor({ initialContent, title, onTitleChange, onSave, isSaving }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Start writing...',
      })
    ],
    content: initialContent || '',
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert prose-sm sm:prose-base focus:outline-none max-w-none min-h-[400px]',
      },
    },
  }, []) // Empty dependency array. Component remounts automatically on note switch because of key={selectedNote.id} in parent.

  const autoSaveTimeoutRef = useRef(null)
  const latestOnSave = useRef(onSave)

  useEffect(() => {
    latestOnSave.current = onSave
  }, [onSave])

  const handleSave = () => {
    if (editor) {
      latestOnSave.current(editor.getHTML(), title)
    }
  }

  // Auto-save logic for editor content
  useEffect(() => {
    if (!editor) return
    
    const triggerAutoSave = () => {
      const isAutoSaveEnabled = localStorage.getItem('smriti_autosave') !== 'false'
      if (!isAutoSaveEnabled) return;

      if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current)
      autoSaveTimeoutRef.current = setTimeout(() => {
        latestOnSave.current(editor.getHTML(), title)
      }, 1000)
    }

    editor.on('update', triggerAutoSave)
    return () => {
      editor.off('update', triggerAutoSave)
    }
  }, [editor, title]) // Removed onSave

  // Auto-save on title change
  const isFirstMount = useRef(true)
  useEffect(() => {
    if (!editor) return
    if (isFirstMount.current) {
      isFirstMount.current = false
      return
    }
    
    const isAutoSaveEnabled = localStorage.getItem('smriti_autosave') !== 'false'
    if (!isAutoSaveEnabled) return;

    if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current)
    autoSaveTimeoutRef.current = setTimeout(() => {
      latestOnSave.current(editor.getHTML(), title)
    }, 1000)
  }, [title, editor]) // Removed onSave

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#1C1C1E] sm:rounded-xl sm:shadow-xl sm:border border-neutral-200/50 dark:border-neutral-800/50 p-4 sm:p-10 mx-auto w-full max-w-4xl transition-all">
      <MenuBar editor={editor} onSave={handleSave} isSaving={isSaving} />
      
      {/* Title Input */}
      <input 
        type="text"
        placeholder="Document Title"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        className="text-2xl sm:text-4xl font-bold bg-transparent border-none outline-none focus:ring-0 text-neutral-900 dark:text-neutral-100 mb-6 w-full placeholder:text-neutral-300 dark:placeholder:text-neutral-700"
      />

      <div className="flex-1 overflow-y-auto no-scrollbar">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
