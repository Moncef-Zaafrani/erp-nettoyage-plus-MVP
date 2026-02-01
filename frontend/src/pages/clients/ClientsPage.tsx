import { useState, useEffect, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Search,
  Filter,
  Grid,
  List,
  Plus,
  ChevronDown,
  Building2,
  User as UserIcon,
  X,
  CheckSquare,
  Users,
  ArrowUpDown,
  Briefcase,
  Send,
} from 'lucide-react'
import { clientsApi, Client } from '@/services/api'
import { useAuth } from '@/contexts/AuthContext'
import ClientCard from '@/components/clients/ClientCard'
import { FilterDrawer, useClientFilterSections } from '@/components/shared/FilterDrawer'

// View mode type
type ViewMode = 'card' | 'table'

// Sort options
type SortOption = 'name' | 'email' | 'createdAt' | 'type' | 'contractsCount'
type SortDirection = 'asc' | 'desc'

// Type tabs configuration
const typeTabs = [
  { id: 'all', labelKey: 'clients.tabs.all', icon: Users, types: null as string[] | null },
  { id: 'companies', labelKey: 'clients.tabs.companies', icon: Building2, types: ['COMPANY', 'MULTI_SITE'] },
  { id: 'individuals', labelKey: 'clients.tabs.individuals', icon: UserIcon, types: ['INDIVIDUAL'] },
]

export function ClientsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const { typeFilter } = useParams<{ typeFilter?: string }>()

  // State
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  
  // UI State
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem('clients-view-mode')
    return (saved as ViewMode) || 'card'
  })
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [showFilterDrawer, setShowFilterDrawer] = useState(false)
  const [sortBy, setSortBy] = useState<SortOption>('createdAt')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  
  // Selection state
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedClients, setSelectedClients] = useState<Client[]>([])
  
  // Filters
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({
    status: [], // Start with no filter - show all clients
    type: [],
    hasContracts: [],
  })
  
  // Get filter sections
  const filterSections = useClientFilterSections()

  // Determine current type filter from URL
  const currentTypeTab = useMemo(() => {
    if (!typeFilter) return 'all'
    const tab = typeTabs.find(t => t.id === typeFilter)
    return tab ? tab.id : 'all'
  }, [typeFilter])

  // Build filter sections dynamically - hide type filter on specific type pages
  const allFilterSections = useMemo(() => {
    if (currentTypeTab !== 'all') {
      return filterSections.filter(s => s.id !== 'type')
    }
    return filterSections
  }, [filterSections, currentTypeTab])

  // Persist view mode
  useEffect(() => {
    localStorage.setItem('clients-view-mode', viewMode)
  }, [viewMode])

  // Fetch clients
  const fetchClients = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Build type filter based on tab or filter selection
      const tabConfig = typeTabs.find(t => t.id === currentTypeTab)
      const typeFilterValue = tabConfig?.types || activeFilters.type

      // Build status filter
      const statusFilter = activeFilters.status || []

      // Backend only accepts single values for type/status, so send first value only
      // For multi-select, we'll filter client-side
      const response = await clientsApi.getAll({
        page,
        limit: pageSize,
        search: searchQuery || undefined,
        // Send single type (first from tab or first from filter) - let client-side handle multi
        type: typeFilterValue?.length === 1 ? typeFilterValue[0] as any : undefined,
        // Send single status (first one) - let client-side handle multi
        status: statusFilter.length === 1 ? statusFilter[0] as any : undefined,
        sortBy,
        sortOrder: sortDirection.toUpperCase() as 'ASC' | 'DESC',
      })

      let filteredClients = response.data || []
      
      // Client-side filter for multiple types (when tab specifies multiple like COMPANY,MULTI_SITE)
      if (typeFilterValue && typeFilterValue.length > 1) {
        filteredClients = filteredClients.filter(c => typeFilterValue.includes(c.type))
      }
      
      // Client-side filter for multiple statuses
      if (statusFilter.length > 1) {
        filteredClients = filteredClients.filter(c => statusFilter.includes(c.status))
      }

      // Sort archived clients to the bottom while maintaining other sort order
      filteredClients.sort((a, b) => {
        // Archived clients always go to the bottom
        if (a.status === 'ARCHIVED' && b.status !== 'ARCHIVED') return 1
        if (a.status !== 'ARCHIVED' && b.status === 'ARCHIVED') return -1
        // Both same archive status - maintain original order (already sorted by backend)
        return 0
      })

      setClients(filteredClients)
      setTotalCount(response.total || filteredClients.length)
    } catch (err: any) {
      console.error('Failed to fetch clients:', err)
      setError(err.message || 'Failed to load clients')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, searchQuery, currentTypeTab, activeFilters, sortBy, sortDirection])

  useEffect(() => {
    fetchClients()
  }, [fetchClients])

  // Update URL search params
  useEffect(() => {
    const params = new URLSearchParams()
    if (searchQuery) params.set('search', searchQuery)
    setSearchParams(params, { replace: true })
  }, [searchQuery, setSearchParams])

  // Handle client selection
  const handleSelectClient = (client: Client) => {
    setSelectedClients(prev => [...prev, client])
  }

  const handleDeselectClient = (client: Client) => {
    setSelectedClients(prev => prev.filter(c => c.id !== client.id))
  }

  const handleSelectAll = () => {
    setSelectedClients(clients)
  }

  const handleDeselectAll = () => {
    setSelectedClients([])
  }

  // Handle sort change
  const handleSortChange = (option: SortOption) => {
    if (sortBy === option) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(option)
      setSortDirection('asc')
    }
    setShowSortDropdown(false)
  }

  // Handle batch actions
  const handleBatchArchive = async () => {
    if (selectedClients.length === 0) return
    try {
      await clientsApi.batchArchive(selectedClients.map(c => c.id))
      setSelectedClients([])
      setSelectionMode(false)
      fetchClients()
    } catch (err) {
      console.error('Failed to archive clients:', err)
    }
  }

  const handleBatchActivate = async () => {
    if (selectedClients.length === 0) return
    try {
      await clientsApi.batchActivate(selectedClients.map(c => c.id))
      setSelectedClients([])
      setSelectionMode(false)
      fetchClients()
    } catch (err) {
      console.error('Failed to activate clients:', err)
    }
  }

  // Handle batch send verification emails (only for clients with userId)
  const handleBatchSendVerification = async () => {
    const clientsWithAccounts = selectedClients.filter(c => c.userId)
    if (clientsWithAccounts.length === 0) return
    try {
      await clientsApi.batchSendVerification(clientsWithAccounts.map(c => c.id))
      setSelectedClients([])
      setSelectionMode(false)
      fetchClients()
    } catch (err) {
      console.error('Failed to send verification emails:', err)
    }
  }

  // Count of selected clients that have a linked user account
  const selectedClientsWithAccounts = selectedClients.filter(c => c.userId).length

  // Count active filters
  const activeFilterCount = Object.values(activeFilters).flat().length

  return (
    <div className="flex flex-col h-full">
      {/* Page Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('clients.title', 'Clients')}
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {t('clients.subtitle', 'Manage your clients and their contracts')}
              </p>
            </div>
            
            {/* Primary Actions */}
            <div className="flex items-center gap-2">
              {(currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN') && (
                <button
                  onClick={() => navigate('/clients/new')}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  {t('clients.addClient', 'Add Client')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="px-4 sm:px-6 py-3 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('clients.searchPlaceholder', 'Search by name, email, or contact...')}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-2">
            {/* Filter Button */}
            <button
              onClick={() => setShowFilterDrawer(true)}
              className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium border rounded-lg transition-colors ${
                activeFilterCount > 0
                  ? 'border-emerald-500 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
                  : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Filter className="h-4 w-4" />
              {t('common.filters', 'Filters')}
              {activeFilterCount > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium rounded-full bg-emerald-600 text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Sort Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <ArrowUpDown className="h-4 w-4" />
                {t('common.sort', 'Sort')}
                <ChevronDown className="h-4 w-4" />
              </button>

              {showSortDropdown && (
                <div className="absolute right-0 top-full mt-1 z-20 w-48 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg py-1">
                  {[
                    { value: 'name', label: t('clients.sort.name', 'Name') },
                    { value: 'email', label: t('clients.sort.email', 'Email') },
                    { value: 'createdAt', label: t('clients.sort.created', 'Date Added') },
                    { value: 'type', label: t('clients.sort.type', 'Type') },
                    { value: 'contractsCount', label: t('clients.sort.contracts', 'Contracts') },
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => handleSortChange(option.value as SortOption)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                        sortBy === option.value
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {option.label}
                      {sortBy === option.value && (
                        <span className="text-xs text-gray-400">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* View Toggle */}
            <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('card')}
                className={`p-2 transition-colors ${
                  viewMode === 'card'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                title={t('clients.view.card', 'Card View')}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 transition-colors ${
                  viewMode === 'table'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                title={t('clients.view.table', 'Table View')}
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            {/* Selection Mode Toggle */}
            <button
              onClick={() => {
                setSelectionMode(!selectionMode)
                if (selectionMode) {
                  setSelectedClients([])
                }
              }}
              className={`p-2 border rounded-lg transition-colors ${
                selectionMode
                  ? 'border-emerald-500 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
                  : 'border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title={t('clients.selectionMode', 'Selection Mode')}
            >
              <CheckSquare className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Selection Toolbar */}
        {selectionMode && selectedClients.length > 0 && (
          <div className="mt-3 flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
              {t('clients.selected', '{{count}} selected').replace('{{count}}', String(selectedClients.length))}
            </span>
            <div className="flex-1" />
            <button
              onClick={handleDeselectAll}
              className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              {t('common.deselectAll', 'Deselect All')}
            </button>
            <button
              onClick={handleSelectAll}
              className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              {t('common.selectAll', 'Select All')}
            </button>
            <div className="h-4 w-px bg-emerald-300 dark:bg-emerald-700" />
            <button
              onClick={handleBatchActivate}
              className="px-3 py-1.5 text-sm font-medium text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50"
            >
              {t('clients.batchActivate', 'Activate')}
            </button>
            <button
              onClick={handleBatchArchive}
              className="px-3 py-1.5 text-sm font-medium text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50"
            >
              {t('clients.batchArchive', 'Archive')}
            </button>
            {/* Send Verification Email button - always visible but disabled if no clients have accounts */}
            <button
              onClick={handleBatchSendVerification}
              disabled={selectedClientsWithAccounts === 0}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg ${
                selectedClientsWithAccounts > 0
                  ? 'text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50'
                  : 'text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 cursor-not-allowed'
              }`}
              title={selectedClientsWithAccounts === 0 
                ? t('clients.batch.noAccountsTooltip', 'No selected clients have login accounts')
                : t('clients.batch.sendVerificationTooltip', 'Send verification email to {{count}} client(s) with accounts').replace('{{count}}', String(selectedClientsWithAccounts))
              }
            >
              <Send className="h-4 w-4" />
              {t('clients.batch.sendVerification', 'Send Verification')}
              {selectedClientsWithAccounts > 0 && ` (${selectedClientsWithAccounts})`}
            </button>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <button
              onClick={fetchClients}
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700"
            >
              {t('common.retry', 'Retry')}
            </button>
          </div>
        ) : clients.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Briefcase className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {searchQuery
                ? t('clients.noSearchResults', 'No clients found')
                : t('clients.noClients', 'No clients yet')}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {searchQuery
                ? t('clients.tryDifferentSearch', 'Try a different search term')
                : t('clients.addFirstClient', 'Add your first client to get started')}
            </p>
            {!searchQuery && (currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN') && (
              <button
                onClick={() => navigate('/clients/new')}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700"
              >
                <Plus className="h-4 w-4" />
                {t('clients.addClient', 'Add Client')}
              </button>
            )}
          </div>
        ) : viewMode === 'card' ? (
          /* Card View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {clients.map(client => (
              <ClientCard
                key={client.id}
                client={client}
                isSelected={selectedClients.some(c => c.id === client.id)}
                onSelect={handleSelectClient}
                onDeselect={handleDeselectClient}
                selectionMode={selectionMode}
                onEdit={(c) => navigate(`/clients/${c.id}/edit`)}
                onViewDetails={(c) => navigate(`/clients/view/${c.id}`)}
                onViewContracts={(c) => navigate(`/clients/view/${c.id}`)}
                onResetPassword={async (c) => {
                  if (!c.userId) return
                  try {
                    await clientsApi.resetPassword(c.id)
                    // TODO: Show success toast
                  } catch (err) {
                    console.error('Failed to reset password:', err)
                  }
                }}
                onVerifyEmail={async (c) => {
                  if (!c.userId) return
                  try {
                    await clientsApi.verifyEmail(c.id)
                    fetchClients()
                  } catch (err) {
                    console.error('Failed to verify email:', err)
                  }
                }}
                onArchive={async (c) => {
                  try {
                    await clientsApi.archive(c.id)
                    fetchClients()
                  } catch (err) {
                    console.error('Failed to archive client:', err)
                  }
                }}
                onRestore={async (c) => {
                  try {
                    await clientsApi.restore(c.id)
                    fetchClients()
                  } catch (err) {
                    console.error('Failed to restore client:', err)
                  }
                }}
              />
            ))}
          </div>
        ) : (
          /* Table View */
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  {selectionMode && (
                    <th className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedClients.length === clients.length && clients.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            handleSelectAll()
                          } else {
                            handleDeselectAll()
                          }
                        }}
                        className="rounded border-gray-300 dark:border-gray-600 text-emerald-600 focus:ring-emerald-500"
                      />
                    </th>
                  )}
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('clients.table.client', 'Client')}
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('clients.table.type', 'Type')}
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('clients.table.contact', 'Contact')}
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('clients.table.status', 'Status')}
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('clients.table.contracts', 'Contracts')}
                  </th>
                  <th className="w-20 px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {clients.map(client => {
                  const isSelected = selectedClients.some(c => c.id === client.id)
                  
                  return (
                    <tr
                      key={client.id}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer ${
                        isSelected ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''
                      }`}
                      onClick={() => navigate(`/clients/view/${client.id}`)}
                    >
                      {selectionMode && (
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              if (isSelected) {
                                handleDeselectClient(client)
                              } else {
                                handleSelectClient(client)
                              }
                            }}
                            className="rounded border-gray-300 dark:border-gray-600 text-emerald-600 focus:ring-emerald-500"
                          />
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                            client.type === 'COMPANY' || client.type === 'MULTI_SITE'
                              ? 'bg-blue-100 dark:bg-blue-900/30'
                              : 'bg-green-100 dark:bg-green-900/30'
                          }`}>
                            {client.type === 'COMPANY' || client.type === 'MULTI_SITE' ? (
                              <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            ) : (
                              <UserIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{client.name}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{client.email || '-'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                          {t(`clients.type.${client.type.toLowerCase()}`, client.type)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                          {client.contactPerson || '-'}
                        </div>
                        {client.phone && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">{client.phone}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          client.status === 'CURRENT'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
                            : client.status === 'PROSPECT'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
                            : client.status === 'FORMER'
                            ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                        }`}>
                          {t(`clients.status.${client.status.toLowerCase()}`, client.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {client.activeContractsCount || 0}
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => navigate(`/clients/view/${client.id}`)}
                          className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
                        >
                          {t('common.view', 'View')}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && clients.length > 0 && totalCount > pageSize && (
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('pagination.showing', 'Showing {{from}} to {{to}} of {{total}} results')
                .replace('{{from}}', String((page - 1) * pageSize + 1))
                .replace('{{to}}', String(Math.min(page * pageSize, totalCount)))
                .replace('{{total}}', String(totalCount))}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {t('pagination.previous', 'Previous')}
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page * pageSize >= totalCount}
                className="px-3 py-1.5 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {t('pagination.next', 'Next')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Filter Drawer */}
      <FilterDrawer
        isOpen={showFilterDrawer}
        onClose={() => setShowFilterDrawer(false)}
        title={t('clients.filterTitle', 'Filter Clients')}
        sections={allFilterSections}
        activeFilters={activeFilters}
        onFiltersChange={setActiveFilters}
      />
    </div>
  )
}

export default ClientsPage
