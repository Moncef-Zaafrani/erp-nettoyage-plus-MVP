import { useState, useEffect, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  Search,
  Filter,
  Grid,
  List,
  Plus,
  ChevronDown,
  FileText,
  X,
  CheckSquare,
  ArrowUpDown,
  RefreshCw,
  Calendar,
} from 'lucide-react'
import { contractsApi, Contract, clientsApi, Client, sitesApi, Site, ContractStatus, ServiceContractType } from '@/services/api'
import { useAuth } from '@/contexts/AuthContext'
import ContractCard from '@/components/contracts/ContractCard'
import { FilterDrawer } from '@/components/shared/FilterDrawer'

// View mode type
type ViewMode = 'card' | 'table'

// Sort options
type SortOption = 'contractCode' | 'clientId' | 'createdAt' | 'startDate' | 'status' | 'type'
type SortDirection = 'asc' | 'desc'

// Type tabs configuration
const typeTabs = [
  { id: 'all', labelKey: 'contracts.tabs.all', icon: FileText, types: null as ServiceContractType[] | null },
  { id: 'permanent', labelKey: 'contracts.tabs.permanent', icon: RefreshCw, types: ['PERMANENT' as ServiceContractType] },
  { id: 'punctual', labelKey: 'contracts.tabs.punctual', icon: Calendar, types: ['ONE_TIME' as ServiceContractType] },
]

// Status badge config
const statusConfig: Record<ContractStatus, { label: string; color: string; bgColor: string }> = {
  DRAFT: { label: 'contracts.status.draft', color: 'text-gray-700 dark:text-gray-300', bgColor: 'bg-gray-100 dark:bg-gray-700' },
  ACTIVE: { label: 'contracts.status.active', color: 'text-green-700 dark:text-green-300', bgColor: 'bg-green-100 dark:bg-green-900/50' },
  INACTIVE: { label: 'contracts.status.inactive', color: 'text-yellow-700 dark:text-yellow-300', bgColor: 'bg-yellow-100 dark:bg-yellow-900/50' },
  COMPLETED: { label: 'contracts.status.completed', color: 'text-blue-700 dark:text-blue-300', bgColor: 'bg-blue-100 dark:bg-blue-900/50' },
  ARCHIVED: { label: 'contracts.status.archived', color: 'text-red-700 dark:text-red-300', bgColor: 'bg-red-100 dark:bg-red-900/50' },
}

// Type badge config
const typeConfig: Record<ServiceContractType, { label: string; color: string; bgColor: string }> = {
  PERMANENT: { label: 'contracts.type.permanent', color: 'text-indigo-700 dark:text-indigo-300', bgColor: 'bg-indigo-100 dark:bg-indigo-900/50' },
  ONE_TIME: { label: 'contracts.type.oneTime', color: 'text-orange-700 dark:text-orange-300', bgColor: 'bg-orange-100 dark:bg-orange-900/50' },
}

export function ContractsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const { typeFilter } = useParams<{ typeFilter?: string }>()

  // State
  const [contracts, setContracts] = useState<Contract[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  
  // UI State
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem('contracts-view-mode')
    return (saved as ViewMode) || 'card'
  })
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [showFilterDrawer, setShowFilterDrawer] = useState(false)
  const [sortBy, setSortBy] = useState<SortOption>('createdAt')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  
  // Selection state
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedContracts, setSelectedContracts] = useState<Contract[]>([])
  
  // Filters
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({
    status: [],
    type: [],
    clientId: [],
  })

  // Create client lookup map
  const clientMap = useMemo(() => {
    const map: Record<string, Client> = {}
    clients.forEach(c => { map[c.id] = c })
    return map
  }, [clients])

  // Create site lookup map
  const siteMap = useMemo(() => {
    const map: Record<string, Site> = {}
    sites.forEach(s => { map[s.id] = s })
    return map
  }, [sites])

  // Determine current type filter from URL
  const currentTypeTab = useMemo(() => {
    if (!typeFilter) return 'all'
    const tab = typeTabs.find(t => t.id === typeFilter)
    return tab ? tab.id : 'all'
  }, [typeFilter])

  // Build filter sections dynamically
  const filterSections = useMemo(() => {
    const sections = [
      {
        id: 'status',
        label: t('contracts.filters.status', 'Status'),
        options: [
          { value: 'DRAFT', label: t('contracts.status.draft', 'Draft') },
          { value: 'ACTIVE', label: t('contracts.status.active', 'Active') },
          { value: 'INACTIVE', label: t('contracts.status.inactive', 'Suspended') },
          { value: 'COMPLETED', label: t('contracts.status.completed', 'Completed') },
          { value: 'ARCHIVED', label: t('contracts.status.archived', 'Archived') },
        ],
      },
      {
        id: 'type',
        label: t('contracts.filters.type', 'Type'),
        options: [
          { value: 'PERMANENT', label: t('contracts.type.permanent', 'Permanent') },
          { value: 'ONE_TIME', label: t('contracts.type.oneTime', 'One-time') },
        ],
      },
    ]
    
    // Add client filter if we have clients
    if (clients.length > 0) {
      sections.push({
        id: 'clientId',
        label: t('contracts.filters.client', 'Client'),
        options: clients.map(c => ({ value: c.id, label: c.name })),
      })
    }
    
    return sections
  }, [t, clients])

  // Hide type filter on specific type pages
  const allFilterSections = useMemo(() => {
    if (currentTypeTab !== 'all') {
      return filterSections.filter(s => s.id !== 'type')
    }
    return filterSections
  }, [filterSections, currentTypeTab])

  // Persist view mode
  useEffect(() => {
    localStorage.setItem('contracts-view-mode', viewMode)
  }, [viewMode])

  // Fetch clients for dropdown
  useEffect(() => {
    async function fetchClients() {
      try {
        const response = await clientsApi.getAll({ limit: 100 })
        setClients(response.data || [])
      } catch (err) {
        console.error('Failed to fetch clients:', err)
      }
    }
    fetchClients()
  }, [])

  // Fetch sites for dropdown
  useEffect(() => {
    async function fetchSites() {
      try {
        const response = await sitesApi.getAll({ limit: 100 })
        setSites(response.data || [])
      } catch (err) {
        console.error('Failed to fetch sites:', err)
      }
    }
    fetchSites()
  }, [])

  // Fetch contracts
  const fetchContracts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Build filters
      const statusFilter = activeFilters.status || []
      const typeFilter = activeFilters.type || []
      const clientFilter = activeFilters.clientId || []

      // Get type from URL tab
      const tabType = currentTypeTab !== 'all'
        ? typeTabs.find(t => t.id === currentTypeTab)?.types?.[0]
        : undefined

      const response = await contractsApi.getAll({
        page,
        limit: pageSize,
        status: statusFilter.length === 1 ? statusFilter[0] as ContractStatus : undefined,
        type: tabType || (typeFilter.length === 1 ? typeFilter[0] as ServiceContractType : undefined),
        clientId: clientFilter.length === 1 ? clientFilter[0] : undefined,
        sortBy,
        sortOrder: sortDirection.toUpperCase() as 'ASC' | 'DESC',
      })

      let filteredContracts = response.data || []
      
      // Client-side filter for multiple statuses
      if (statusFilter.length > 1) {
        filteredContracts = filteredContracts.filter(c => statusFilter.includes(c.status))
      }
      
      // Client-side filter for multiple types (when not filtered by URL)
      if (!tabType && typeFilter.length > 1) {
        filteredContracts = filteredContracts.filter(c => typeFilter.includes(c.type))
      }

      // Client-side filter for multiple clients
      if (clientFilter.length > 1) {
        filteredContracts = filteredContracts.filter(c => clientFilter.includes(c.clientId))
      }

      // Client-side search
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        filteredContracts = filteredContracts.filter(c => {
          const client = clientMap[c.clientId]
          const site = siteMap[c.siteId]
          return (
            c.contractCode.toLowerCase().includes(query) ||
            client?.name.toLowerCase().includes(query) ||
            site?.name.toLowerCase().includes(query) ||
            c.notes?.toLowerCase().includes(query)
          )
        })
      }

      setContracts(filteredContracts)
      setTotalCount(response.total || filteredContracts.length)
    } catch (err: any) {
      console.error('Failed to fetch contracts:', err)
      setError(err.message || 'Failed to load contracts')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, activeFilters, sortBy, sortDirection, currentTypeTab, searchQuery, clientMap, siteMap])

  useEffect(() => {
    fetchContracts()
  }, [fetchContracts])

  // Update URL search params
  useEffect(() => {
    const params = new URLSearchParams()
    if (searchQuery) params.set('search', searchQuery)
    setSearchParams(params, { replace: true })
  }, [searchQuery, setSearchParams])

  // Handle contract selection
  const handleSelectContract = (contract: Contract) => {
    setSelectedContracts(prev => [...prev, contract])
  }

  const handleDeselectContract = (contract: Contract) => {
    setSelectedContracts(prev => prev.filter(c => c.id !== contract.id))
  }

  const handleSelectAll = () => {
    setSelectedContracts(contracts)
  }

  const handleDeselectAll = () => {
    setSelectedContracts([])
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
    if (selectedContracts.length === 0) return
    try {
      await contractsApi.batchArchive(selectedContracts.map(c => c.id))
      setSelectedContracts([])
      setSelectionMode(false)
      fetchContracts()
    } catch (err) {
      console.error('Failed to archive contracts:', err)
    }
  }

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
                {t('contracts.title', 'Contracts')}
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {t('contracts.subtitle', 'Manage client contracts and service agreements')}
              </p>
            </div>
            
            {/* Primary Actions */}
            <div className="flex items-center gap-2">
              {(currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPERVISOR') && (
                <button
                  onClick={() => navigate('/contracts/new')}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  {t('contracts.addContract', 'New Contract')}
                </button>
              )}
            </div>
          </div>

          {/* Type Tabs */}
          <div className="mt-4 flex items-center gap-1 border-b border-gray-200 dark:border-gray-700 -mb-px">
            {typeTabs.map((tab) => {
              const Icon = tab.icon
              const isActive = currentTypeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (tab.id === 'all') {
                      navigate('/contracts')
                    } else {
                      navigate(`/contracts/${tab.id}`)
                    }
                  }}
                  className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    isActive
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {t(tab.labelKey)}
                </button>
              )
            })}
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
              placeholder={t('contracts.searchPlaceholder', 'Search by code, client, or site...')}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
                  ? 'border-indigo-500 text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Filter className="h-4 w-4" />
              {t('common.filters', 'Filters')}
              {activeFilterCount > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium rounded-full bg-indigo-600 text-white">
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
                    { value: 'contractCode', label: t('contracts.sort.code', 'Contract Code') },
                    { value: 'clientId', label: t('contracts.sort.client', 'Client') },
                    { value: 'startDate', label: t('contracts.sort.startDate', 'Start Date') },
                    { value: 'createdAt', label: t('contracts.sort.created', 'Date Added') },
                    { value: 'status', label: t('contracts.sort.status', 'Status') },
                    { value: 'type', label: t('contracts.sort.type', 'Type') },
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => handleSortChange(option.value as SortOption)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                        sortBy === option.value
                          ? 'text-indigo-600 dark:text-indigo-400'
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
                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                title={t('contracts.view.card', 'Card View')}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 transition-colors ${
                  viewMode === 'table'
                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                title={t('contracts.view.table', 'Table View')}
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            {/* Selection Mode Toggle */}
            <button
              onClick={() => {
                setSelectionMode(!selectionMode)
                if (selectionMode) {
                  setSelectedContracts([])
                }
              }}
              className={`p-2 border rounded-lg transition-colors ${
                selectionMode
                  ? 'border-indigo-500 text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title={t('contracts.selectionMode', 'Selection Mode')}
            >
              <CheckSquare className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Selection Toolbar */}
        {selectionMode && selectedContracts.length > 0 && (
          <div className="mt-3 flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
            <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
              {t('contracts.selected', '{{count}} selected').replace('{{count}}', String(selectedContracts.length))}
            </span>
            <div className="flex-1" />
            <button
              onClick={handleDeselectAll}
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              {t('common.deselectAll', 'Deselect All')}
            </button>
            <button
              onClick={handleSelectAll}
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              {t('common.selectAll', 'Select All')}
            </button>
            <div className="h-4 w-px bg-indigo-300 dark:bg-indigo-700" />
            <button
              onClick={handleBatchArchive}
              className="px-3 py-1.5 text-sm font-medium text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50"
            >
              {t('contracts.batchArchive', 'Archive')}
            </button>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto p-4 sm:p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="text-red-500 dark:text-red-400 mb-2">
              {error}
            </div>
            <button
              onClick={fetchContracts}
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              {t('common.retry', 'Try again')}
            </button>
          </div>
        ) : contracts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <FileText className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
              {t('contracts.empty.title', 'No contracts found')}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {searchQuery || activeFilterCount > 0
                ? t('contracts.empty.filtered', 'Try adjusting your search or filters')
                : t('contracts.empty.description', 'Get started by creating your first contract')}
            </p>
            {(currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPERVISOR') && !searchQuery && activeFilterCount === 0 && (
              <button
                onClick={() => navigate('/contracts/new')}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                {t('contracts.addContract', 'New Contract')}
              </button>
            )}
          </div>
        ) : viewMode === 'card' ? (
          // Card View
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {contracts.map(contract => (
              <ContractCard
                key={contract.id}
                contract={contract}
                client={clientMap[contract.clientId]}
                site={siteMap[contract.siteId]}
                isSelected={selectedContracts.some(c => c.id === contract.id)}
                onSelect={handleSelectContract}
                onDeselect={handleDeselectContract}
                selectionMode={selectionMode}
                onRefresh={fetchContracts}
              />
            ))}
          </div>
        ) : (
          // Table View
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                    {selectionMode && (
                      <th className="w-12 px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedContracts.length === contracts.length && contracts.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              handleSelectAll()
                            } else {
                              handleDeselectAll()
                            }
                          }}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      </th>
                    )}
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('contracts.table.code', 'Code')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('contracts.table.client', 'Client')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('contracts.table.site', 'Site')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('contracts.table.type', 'Type')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('contracts.table.status', 'Status')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('contracts.table.dates', 'Dates')}
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('contracts.table.actions', 'Actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {contracts.map(contract => {
                    const client = clientMap[contract.clientId]
                    const site = siteMap[contract.siteId]
                    const statusInfo = statusConfig[contract.status]
                    const typeInfo = typeConfig[contract.type]
                    const isSelected = selectedContracts.some(c => c.id === contract.id)
                    
                    return (
                      <tr
                        key={contract.id}
                        className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                          isSelected ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
                        }`}
                      >
                        {selectionMode && (
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  handleSelectContract(contract)
                                } else {
                                  handleDeselectContract(contract)
                                }
                              }}
                              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                          </td>
                        )}
                        <td className="px-4 py-3">
                          <button
                            onClick={() => navigate(`/contracts/view/${contract.id}`)}
                            className="font-mono text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                          >
                            {contract.contractCode}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-900 dark:text-white">
                            {client?.name || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {site?.name || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${typeInfo.bgColor} ${typeInfo.color}`}>
                            {t(typeInfo.label)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
                            {t(statusInfo.label)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            <div>{new Date(contract.startDate).toLocaleDateString()}</div>
                            {contract.endDate && (
                              <div>→ {new Date(contract.endDate).toLocaleDateString()}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => navigate(`/contracts/view/${contract.id}`)}
                            className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
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
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && contracts.length > 0 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {t('common.showing', 'Showing {{from}} to {{to}} of {{total}}')
                .replace('{{from}}', String((page - 1) * pageSize + 1))
                .replace('{{to}}', String(Math.min(page * pageSize, totalCount)))
                .replace('{{total}}', String(totalCount))}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {t('common.previous', 'Previous')}
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {t('common.page', 'Page {{page}}').replace('{{page}}', String(page))}
              </span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page * pageSize >= totalCount}
                className="px-3 py-1.5 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {t('common.next', 'Next')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Filter Drawer */}
      <FilterDrawer
        isOpen={showFilterDrawer}
        onClose={() => setShowFilterDrawer(false)}
        title={t('contracts.filters.title', 'Filter Contracts')}
        sections={allFilterSections}
        activeFilters={activeFilters}
        onFiltersChange={setActiveFilters}
      />
    </div>
  )
}

export default ContractsPage
