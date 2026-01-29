import { useState, useRef, useEffect, useMemo } from 'react'
import { ChevronDown, Check, Search, X, Loader2 } from 'lucide-react'

export interface SelectOption {
  value: string
  label: string
  sublabel?: string
  icon?: React.ReactNode
}

interface SearchableSelectProps {
  options: SelectOption[]
  value: string | null
  onChange: (value: string | null) => void
  placeholder?: string
  searchPlaceholder?: string
  noResultsText?: string
  error?: string
  disabled?: boolean
  loading?: boolean
  className?: string
  icon?: React.ReactNode
  id?: string
  name?: string
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  searchPlaceholder = 'Search...',
  noResultsText = 'No results found',
  error,
  disabled = false,
  loading = false,
  className = '',
  icon,
  id,
  name,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Find selected option
  const selectedOption = useMemo(
    () => options.find(opt => opt.value === value),
    [options, value]
  )

  // Filter options based on search
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options
    const query = searchQuery.toLowerCase()
    return options.filter(
      opt =>
        opt.label.toLowerCase().includes(query) ||
        opt.sublabel?.toLowerCase().includes(query)
    )
  }, [options, searchQuery])

  // Reset highlighted index when filtered options change
  useEffect(() => {
    setHighlightedIndex(0)
  }, [filteredOptions.length])

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchQuery('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Scroll highlighted option into view
  useEffect(() => {
    if (isOpen && listRef.current) {
      const highlighted = listRef.current.children[highlightedIndex] as HTMLElement
      if (highlighted) {
        highlighted.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [highlightedIndex, isOpen])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault()
        setIsOpen(true)
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev =>
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : prev))
        break
      case 'Enter':
        e.preventDefault()
        if (filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex].value)
        }
        break
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        setSearchQuery('')
        break
      case 'Tab':
        setIsOpen(false)
        setSearchQuery('')
        break
    }
  }

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue)
    setIsOpen(false)
    setSearchQuery('')
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(null)
    setSearchQuery('')
  }

  const handleOpen = () => {
    if (!disabled) {
      setIsOpen(true)
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Hidden input for form submission */}
      {name && <input type="hidden" name={name} value={value || ''} />}
      
      {/* Trigger Button */}
      <button
        type="button"
        id={id}
        onClick={handleOpen}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-labelledby={id}
        className={`
          w-full flex items-center gap-2 px-3 py-2.5 text-left
          border rounded-lg transition-all duration-200
          ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800' : 'bg-white dark:bg-gray-900 cursor-pointer hover:border-gray-400 dark:hover:border-gray-500'}
          ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600'}
          ${isOpen ? 'ring-2 ring-emerald-500 border-emerald-500' : ''}
        `}
      >
        {icon && <span className="text-gray-400 flex-shrink-0">{icon}</span>}
        
        <span className={`flex-1 truncate ${selectedOption ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>

        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
        ) : value ? (
          <button
            type="button"
            onClick={handleClear}
            className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>
        ) : (
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                id={id ? `${id}-search` : undefined}
                name={name ? `${name}-search` : undefined}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                autoComplete="off"
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Options List */}
          <div ref={listRef} className="max-h-60 overflow-y-auto py-1">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                {noResultsText}
              </div>
            ) : (
              filteredOptions.map((option, index) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors
                    ${index === highlightedIndex ? 'bg-emerald-50 dark:bg-emerald-900/30' : ''}
                    ${option.value === value ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}
                  `}
                >
                  {option.icon && (
                    <span className="flex-shrink-0 text-gray-400">{option.icon}</span>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {option.label}
                    </div>
                    {option.sublabel && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {option.sublabel}
                      </div>
                    )}
                  </div>
                  {option.value === value && (
                    <Check className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  )
}

export default SearchableSelect
