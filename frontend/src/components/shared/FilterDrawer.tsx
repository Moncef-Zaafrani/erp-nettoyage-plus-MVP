import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { X, Filter, ChevronDown, Check, RotateCcw } from 'lucide-react'

interface FilterOption {
  value: string
  label: string
  count?: number
}

interface FilterSection {
  id: string
  label: string
  options: FilterOption[]
  multiSelect?: boolean
}

interface FilterDrawerProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  sections: FilterSection[]
  activeFilters: Record<string, string[]>
  onFiltersChange: (filters: Record<string, string[]>) => void
  onApply?: () => void
  onReset?: () => void
}

export function FilterDrawer({
  isOpen,
  onClose,
  title,
  sections,
  activeFilters,
  onFiltersChange,
  onApply,
  onReset,
}: FilterDrawerProps) {
  const { t } = useTranslation()
  const [expandedSections, setExpandedSections] = useState<string[]>(sections.map(s => s.id))
  const [localFilters, setLocalFilters] = useState<Record<string, string[]>>(activeFilters)

  // Sync local filters with prop changes
  useEffect(() => {
    setLocalFilters(activeFilters)
  }, [activeFilters])

  // Toggle section expansion
  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    )
  }

  // Toggle filter option
  const toggleFilter = (sectionId: string, value: string, multiSelect: boolean = true) => {
    setLocalFilters(prev => {
      const current = prev[sectionId] || []
      let updated: string[]

      if (multiSelect) {
        if (current.includes(value)) {
          updated = current.filter(v => v !== value)
        } else {
          updated = [...current, value]
        }
      } else {
        // Single select - toggle off if already selected, otherwise select
        updated = current.includes(value) ? [] : [value]
      }

      const newFilters = { ...prev, [sectionId]: updated }
      onFiltersChange(newFilters)
      return newFilters
    })
  }

  // Count active filters
  const activeFilterCount = Object.values(localFilters).flat().length

  // Reset all filters
  const handleReset = () => {
    const emptyFilters: Record<string, string[]> = {}
    sections.forEach(section => {
      emptyFilters[section.id] = []
    })
    setLocalFilters(emptyFilters)
    onFiltersChange(emptyFilters)
    onReset?.()
  }

  // Handle apply
  const handleApply = () => {
    onFiltersChange(localFilters)
    onApply?.()
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-80 max-w-full bg-white dark:bg-gray-800 shadow-xl z-50 flex flex-col transform transition-transform">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title || t('filters.title', 'Filters')}
            </h2>
            {activeFilterCount > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                {activeFilterCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Filter Sections */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {sections.map(section => (
            <div key={section.id} className="border-b border-gray-100 dark:border-gray-700 pb-4 last:border-0">
              {/* Section Header */}
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between py-2 text-left"
              >
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {section.label}
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-gray-400 transition-transform ${
                    expandedSections.includes(section.id) ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Section Options */}
              {expandedSections.includes(section.id) && (
                <div className="mt-2 space-y-1">
                  {section.options.map(option => {
                    const isSelected = (localFilters[section.id] || []).includes(option.value)
                    return (
                      <button
                        key={option.value}
                        onClick={() => toggleFilter(section.id, option.value, section.multiSelect !== false)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                          isSelected
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                            : 'hover:bg-gray-50 text-gray-700 dark:hover:bg-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <span>{option.label}</span>
                        <div className="flex items-center gap-2">
                          {option.count !== undefined && (
                            <span className="text-xs text-gray-400">{option.count}</span>
                          )}
                          {isSelected && (
                            <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center gap-3">
          <button
            onClick={handleReset}
            disabled={activeFilterCount === 0}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCcw className="h-4 w-4" />
            {t('filters.reset', 'Reset')}
          </button>
          <button
            onClick={handleApply}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            {t('filters.apply', 'Apply Filters')}
          </button>
        </div>
      </div>
    </>
  )
}

// Pre-built filter sections for Users
export function useUserFilterSections() {
  const { t } = useTranslation()

  const sections: FilterSection[] = [
    {
      id: 'status',
      label: t('users.filters.status', 'Status'),
      options: [
        { value: 'ACTIVE', label: t('users.status.active', 'Active') },
        { value: 'INACTIVE', label: t('users.status.inactive', 'Inactive') },
        { value: 'PENDING', label: t('users.status.pending', 'Pending Verification') },
        { value: 'ARCHIVED', label: t('users.status.archived', 'Archived') },
      ],
    },
    {
      id: 'role',
      label: t('users.filters.role', 'Role'),
      options: [
        { value: 'SUPER_ADMIN', label: t('role.SUPER_ADMIN', 'Super Admin') },
        { value: 'ADMIN', label: t('role.ADMIN', 'Admin') },
        { value: 'SUPERVISOR', label: t('role.SUPERVISOR', 'Supervisor') },
        { value: 'AGENT', label: t('role.AGENT', 'Agent') },
      ],
    },
    {
      id: 'lastOnline',
      label: t('users.filters.lastOnline', 'Last Online'),
      multiSelect: false,
      options: [
        { value: 'today', label: t('users.filters.today', 'Today') },
        { value: 'week', label: t('users.filters.thisWeek', 'This Week') },
        { value: 'month', label: t('users.filters.thisMonth', 'This Month') },
        { value: 'inactive', label: t('users.filters.inactive30Days', 'Inactive 30+ days') },
      ],
    },
  ]

  return sections
}

// Pre-built filter sections for Clients
export function useClientFilterSections() {
  const { t } = useTranslation()

  const sections: FilterSection[] = [
    {
      id: 'status',
      label: t('clients.filters.status', 'Status'),
      options: [
        { value: 'CURRENT', label: t('clients.status.current', 'Current') },
        { value: 'PROSPECT', label: t('clients.status.prospect', 'Prospect') },
        { value: 'ARCHIVED', label: t('clients.status.archived', 'Archived') },
      ],
    },
    {
      id: 'type',
      label: t('clients.filters.type', 'Client Type'),
      options: [
        { value: 'COMPANY', label: t('clients.type.company', 'Company') },
        { value: 'INDIVIDUAL', label: t('clients.type.individual', 'Individual') },
        { value: 'MULTI_SITE', label: t('clients.type.multi_site', 'Multi-Site') },
      ],
    },
    {
      id: 'hasContracts',
      label: t('clients.filters.contracts', 'Contracts'),
      multiSelect: false,
      options: [
        { value: 'active', label: t('clients.filters.hasActiveContracts', 'Has Active Contracts') },
        { value: 'none', label: t('clients.filters.noContracts', 'No Contracts') },
        { value: 'expired', label: t('clients.filters.expiredContracts', 'Expired Contracts Only') },
      ],
    },
  ]

  return sections
}

export default FilterDrawer
