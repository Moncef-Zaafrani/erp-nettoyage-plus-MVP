import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/AuthContext'
import {
  StickyNote,
  Plus,
  Trash2,
  Edit3,
  ChevronDown,
  ChevronUp,
  X,
  Save,
  Briefcase,
  Users,
  Bell,
  Lightbulb,
  AlertTriangle,
  Phone,
  MapPin,
  User,
  Clock,
  Star,
  Tag,
} from 'lucide-react'

// Note types
export interface Note {
  id: string
  title?: string
  content: string
  icon?: NoteIcon
  priority?: NotePriority
  createdAt: string
  updatedAt?: string
}

export type NoteIcon = 'work' | 'meeting' | 'reminder' | 'idea' | 'warning' | 'phone' | 'location' | 'person' | 'clock' | 'star'
export type NotePriority = 'low' | 'medium' | 'high'

// Icon mapping
const iconMap: Record<NoteIcon, typeof StickyNote> = {
  work: Briefcase,
  meeting: Users,
  reminder: Bell,
  idea: Lightbulb,
  warning: AlertTriangle,
  phone: Phone,
  location: MapPin,
  person: User,
  clock: Clock,
  star: Star,
}

const iconOptions: { value: NoteIcon; labelKey: string }[] = [
  { value: 'work', labelKey: 'notes.icons.work' },
  { value: 'meeting', labelKey: 'notes.icons.meeting' },
  { value: 'reminder', labelKey: 'notes.icons.reminder' },
  { value: 'idea', labelKey: 'notes.icons.idea' },
  { value: 'warning', labelKey: 'notes.icons.warning' },
  { value: 'phone', labelKey: 'notes.icons.phone' },
  { value: 'location', labelKey: 'notes.icons.location' },
  { value: 'person', labelKey: 'notes.icons.person' },
  { value: 'clock', labelKey: 'notes.icons.clock' },
  { value: 'star', labelKey: 'notes.icons.star' },
]

const priorityColors: Record<NotePriority, string> = {
  low: 'border-l-green-400',
  medium: 'border-l-amber-400',
  high: 'border-l-red-400',
}

// Helper to get storage key
const getStorageKey = (userId?: string) => userId ? `notes_v2_${userId}` : 'notes_v2'

// Format relative time
const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  return date.toLocaleDateString()
}

// Note Editor Modal
interface NoteEditorProps {
  isOpen: boolean
  onClose: () => void
  onSave: (note: Omit<Note, 'id' | 'createdAt'>) => void
  editingNote?: Note
}

function NoteEditor({ isOpen, onClose, onSave, editingNote }: NoteEditorProps) {
  const { t } = useTranslation()
  const [title, setTitle] = useState(editingNote?.title || '')
  const [content, setContent] = useState(editingNote?.content || '')
  const [icon, setIcon] = useState<NoteIcon | undefined>(editingNote?.icon)
  const [priority, setPriority] = useState<NotePriority | undefined>(editingNote?.priority)
  const [showIcons, setShowIcons] = useState(false)

  useEffect(() => {
    if (editingNote) {
      setTitle(editingNote.title || '')
      setContent(editingNote.content || '')
      setIcon(editingNote.icon)
      setPriority(editingNote.priority)
    } else {
      setTitle('')
      setContent('')
      setIcon(undefined)
      setPriority(undefined)
    }
  }, [editingNote, isOpen])

  if (!isOpen) return null

  const handleSave = () => {
    if (!content.trim()) return
    onSave({
      title: title.trim() || undefined,
      content: content.trim(),
      icon,
      priority,
      updatedAt: editingNote ? new Date().toISOString() : undefined,
    })
    onClose()
  }

  const SelectedIcon = icon ? iconMap[icon] : StickyNote

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="relative mx-4 w-full max-w-lg rounded-xl bg-white p-5 shadow-2xl dark:bg-gray-800" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-3 top-3 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700">
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => setShowIcons(!showIcons)}
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 transition-colors"
          >
            <SelectedIcon className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {editingNote ? t('notes.editNote', 'Edit Note') : t('notes.newNote', 'New Note')}
            </h2>
          </div>
        </div>

        {/* Icon Selector */}
        {showIcons && (
          <div className="mb-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{t('notes.selectIcon', 'Select Icon')}</p>
            <div className="flex flex-wrap gap-2">
              {iconOptions.map((opt) => {
                const Icon = iconMap[opt.value]
                return (
                  <button
                    key={opt.value}
                    onClick={() => { setIcon(opt.value); setShowIcons(false) }}
                    className={`p-2 rounded-lg transition-colors ${
                      icon === opt.value
                        ? 'bg-amber-200 text-amber-700 dark:bg-amber-800 dark:text-amber-200'
                        : 'bg-white text-gray-600 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600'
                    }`}
                    title={t(opt.labelKey)}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Title */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value.slice(0, 50))}
          placeholder={t('notes.titlePlaceholder', 'Title (optional)')}
          className="w-full mb-3 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white outline-none transition-colors"
        />
        <p className="text-right text-xs text-gray-400 -mt-2 mb-2">{title.length}/50</p>

        {/* Content */}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value.slice(0, 500))}
          placeholder={t('notes.contentPlaceholder', 'Write your note here...')}
          className="w-full h-32 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white outline-none resize-none transition-colors"
          autoFocus
        />
        <p className="text-right text-xs text-gray-400 mt-1 mb-3">{content.length}/500</p>

        {/* Priority */}
        <div className="mb-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
            <Tag className="h-3 w-3" />
            {t('notes.priority', 'Priority')}
          </p>
          <div className="flex gap-2">
            {(['low', 'medium', 'high'] as NotePriority[]).map((p) => (
              <button
                key={p}
                onClick={() => setPriority(priority === p ? undefined : p)}
                className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  priority === p
                    ? p === 'low' ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400'
                    : p === 'medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600'
                }`}
              >
                {t(`priority.${p}`, p.charAt(0).toUpperCase() + p.slice(1))}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            {t('common.cancel', 'Cancel')}
          </button>
          <button
            onClick={handleSave}
            disabled={!content.trim()}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-amber-500 rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            <Save className="h-4 w-4" />
            {t('common.save', 'Save')}
          </button>
        </div>
      </div>
    </div>
  )
}

// Note Card - Shows only title by default, expands on click
function NoteCard({ note, onEdit, onDelete }: { note: Note; onEdit: () => void; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const Icon = note.icon ? iconMap[note.icon] : StickyNote
  const displayTitle = note.title || note.content.slice(0, 30) + (note.content.length > 30 ? '...' : '')

  return (
    <div className={`group relative rounded-lg border bg-white dark:bg-gray-800 overflow-hidden transition-all hover:shadow-md ${
      note.priority 
        ? `border-l-4 ${priorityColors[note.priority]} border-gray-200 dark:border-gray-700` 
        : 'border-gray-200 dark:border-gray-700'
    }`}>
      {/* Header - Always visible, click to expand */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2.5 p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-900/20">
          <Icon className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate">
            {displayTitle}
          </h4>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {formatRelativeTime(note.updatedAt || note.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-3 pb-3 pt-0 border-t border-gray-100 dark:border-gray-700/50">
          <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap break-words mt-2">
            {note.content}
          </p>
          <div className="flex justify-end gap-1 mt-3">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit() }}
              className="p-1.5 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
            >
              <Edit3 className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete() }}
              className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Main Notes Widget
export function NotesWidget() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [notes, setNotes] = useState<Note[]>([])
  const [expanded, setExpanded] = useState(true)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | undefined>()

  const storageKey = getStorageKey(user?.id)

  // Load notes from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      try {
        setNotes(JSON.parse(saved))
      } catch {
        setNotes([])
      }
    }
  }, [storageKey])

  // Save notes to localStorage
  const saveNotes = useCallback((newNotes: Note[]) => {
    setNotes(newNotes)
    localStorage.setItem(storageKey, JSON.stringify(newNotes))
  }, [storageKey])

  const handleSave = (noteData: Omit<Note, 'id' | 'createdAt'>) => {
    if (editingNote) {
      // Update existing
      const updated = notes.map(n => 
        n.id === editingNote.id 
          ? { ...n, ...noteData, updatedAt: new Date().toISOString() }
          : n
      )
      saveNotes(updated)
    } else {
      // Create new
      const newNote: Note = {
        ...noteData,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      }
      saveNotes([newNote, ...notes])
    }
    setEditingNote(undefined)
  }

  const handleEdit = (note: Note) => {
    setEditingNote(note)
    setEditorOpen(true)
  }

  const handleDelete = (id: string) => {
    saveNotes(notes.filter(n => n.id !== id))
  }

  const handleNewNote = () => {
    setEditingNote(undefined)
    setEditorOpen(true)
  }

  return (
    <>
      <NoteEditor
        isOpen={editorOpen}
        onClose={() => { setEditorOpen(false); setEditingNote(undefined) }}
        onSave={handleSave}
        editingNote={editingNote}
      />

      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700/50">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
              <StickyNote className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="font-semibold text-gray-900 dark:text-white">
              {t('notes.myNotes', 'My Notes')}
            </span>
            {notes.length > 0 && (
              <span className="text-xs text-gray-400 dark:text-gray-500">
                ({notes.length})
              </span>
            )}
            {expanded ? (
              <ChevronUp className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            )}
          </button>
          
          <button
            onClick={handleNewNote}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-600 bg-amber-50 rounded-lg hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            {t('notes.addNote', 'Add Note')}
          </button>
        </div>

        {expanded && (
          <div className="p-3">
            {notes.length === 0 ? (
              <div className="text-center py-6">
                <StickyNote className="h-10 w-10 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('notes.noNotes', 'No notes yet')}
                </p>
                <button
                  onClick={handleNewNote}
                  className="mt-2 text-sm text-amber-600 hover:text-amber-700 dark:text-amber-400"
                >
                  {t('notes.createFirst', 'Create your first note')}
                </button>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {notes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onEdit={() => handleEdit(note)}
                    onDelete={() => handleDelete(note.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}

export default NotesWidget
