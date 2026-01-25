import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Search, X, ArrowRight, CornerDownLeft, ArrowUp, ArrowDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { getNavigationConfig, NavItem, NavSection } from '@/config/navigation'

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  onWipClick?: (item: NavItem) => void
}

interface FlatNavItem {
  id: string
  label: string
  labelKey: string
  icon: React.ComponentType<{ className?: string }>
  href?: string
  wip?: boolean
  section?: string
  parent?: string
}

export function CommandPalette({ isOpen, onClose, onWipClick }: CommandPaletteProps) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Flatten navigation items for search
  const flatItems = useMemo(() => {
    if (!user) return []
    const navSections = getNavigationConfig(user.role)
    const items: FlatNavItem[] = []

    const flattenItems = (section: NavSection, navItems: NavItem[], parent?: string) => {
      navItems.forEach((item) => {
        items.push({
          id: item.id,
          label: item.label,
          labelKey: item.labelKey,
          icon: item.icon,
          href: item.href,
          wip: item.wip,
          section: section.title,
          parent,
        })
        if (item.children) {
          flattenItems(section, item.children, item.label)
        }
      })
    }

    navSections.forEach((section) => flattenItems(section, section.items))
    return items
  }, [user])

  // Filter items based on query
  const filteredItems = useMemo(() => {
    if (!query.trim()) return flatItems
    const lowerQuery = query.toLowerCase()
    return flatItems.filter((item) => {
      const translatedLabel = t(item.labelKey, item.label).toLowerCase()
      return translatedLabel.includes(lowerQuery) || item.label.toLowerCase().includes(lowerQuery)
    })
  }, [flatItems, query, t])

  // Reset selection when filtered items change
  useEffect(() => {
    setSelectedIndex(0)
  }, [filteredItems])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.querySelector(`[data-index="${selectedIndex}"]`)
      selectedElement?.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex((prev) => Math.min(prev + 1, filteredItems.length - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex((prev) => Math.max(prev - 1, 0))
          break
        case 'Enter':
          e.preventDefault()
          if (filteredItems[selectedIndex]) {
            handleSelect(filteredItems[selectedIndex])
          }
          break
        case 'Escape':
          e.preventDefault()
          onClose()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, filteredItems, selectedIndex, onClose])

  const handleSelect = (item: FlatNavItem) => {
    if (item.wip) {
      onWipClick?.(item as NavItem)
      onClose()
      return
    }
    if (item.href) {
      navigate(item.href)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" onClick={onClose}>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-gray-200 px-4 py-3 dark:border-gray-700">
          <Search className="h-5 w-5 shrink-0 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('commandPalette.placeholder', 'Search for pages, actions...')}
            className="flex-1 bg-transparent text-base text-gray-900 placeholder-gray-400 outline-none dark:text-white"
          />
          {query && (
            <button onClick={() => setQuery('')} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-80 overflow-y-auto p-2">
          {filteredItems.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
              {t('commandPalette.noResults', 'No results found')}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredItems.map((item, index) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.id}
                    data-index={index}
                    onClick={() => handleSelect(item)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
                      index === selectedIndex ? 'bg-blue-50 dark:bg-blue-900/30' : 'hover:bg-gray-100 dark:hover:bg-gray-700',
                      item.wip && 'opacity-50'
                    )}
                  >
                    <Icon className={cn('h-5 w-5 shrink-0', index === selectedIndex ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400')} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {item.parent && <span className="text-xs text-gray-400">{item.parent}</span>}
                        {item.parent && <ArrowRight className="h-3 w-3 text-gray-400" />}
                        <span className={cn('text-sm font-medium truncate', index === selectedIndex ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white')}>
                          {t(item.labelKey, item.label)}
                        </span>
                        {item.wip && (
                          <span className="rounded bg-gray-200 px-1.5 py-0.5 text-[10px] font-medium uppercase text-gray-500 dark:bg-gray-600 dark:text-gray-400">
                            WIP
                          </span>
                        )}
                      </div>
                      {item.section && <span className="text-xs text-gray-500 dark:text-gray-400">{item.section}</span>}
                    </div>
                    {index === selectedIndex && (
                      <CornerDownLeft className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-200 px-4 py-2 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <ArrowUp className="h-3 w-3" />
              <ArrowDown className="h-3 w-3" />
              {t('commandPalette.navigate', 'to navigate')}
            </span>
            <span className="flex items-center gap-1">
              <CornerDownLeft className="h-3 w-3" />
              {t('commandPalette.select', 'to select')}
            </span>
          </div>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-gray-300 bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium dark:border-gray-600 dark:bg-gray-700">
              ESC
            </kbd>
            {t('commandPalette.close', 'to close')}
          </span>
        </div>
      </div>
    </div>
  )
}
