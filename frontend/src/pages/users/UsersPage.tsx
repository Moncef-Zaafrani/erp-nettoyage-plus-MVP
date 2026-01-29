import { useState, useEffect, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Search,
  Filter,
  Grid,
  List,
  ChevronDown,
  Shield,
  UserCog,
  UserCheck,
  X,
  CheckSquare,
  Users,
  UserPlus,
  ArrowUpDown,
} from 'lucide-react'
import { usersApi, User, zonesApi, Zone } from '@/services/api'
import { useAuth } from '@/contexts/AuthContext'
import UserCard from '@/components/users/UserCard'
import { FilterDrawer, useUserFilterSections } from '@/components/shared/FilterDrawer'

// View mode type
type ViewMode = 'card' | 'table'

// Sort options
type SortOption = 'firstName' | 'email' | 'createdAt' | 'lastLoginAt' | 'role'
type SortDirection = 'asc' | 'desc'

// Role tabs configuration
const roleTabs = [
  { id: 'all', labelKey: 'users.tabs.all', icon: Users, roles: null as string[] | null },
  { id: 'admins', labelKey: 'users.tabs.admins', icon: Shield, roles: ['SUPER_ADMIN', 'ADMIN'] },
  { id: 'supervisors', labelKey: 'users.tabs.supervisors', icon: UserCog, roles: ['SUPERVISOR'] },
  { id: 'agents', labelKey: 'users.tabs.agents', icon: UserCheck, roles: ['AGENT'] },
]

export function UsersPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const { roleFilter } = useParams<{ roleFilter?: string }>()

  // State
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  
  // UI State
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem('users-view-mode')
    return (saved as ViewMode) || 'card'
  })
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [showFilterDrawer, setShowFilterDrawer] = useState(false)
  const [sortBy, setSortBy] = useState<SortOption>('createdAt')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  
  // Selection state
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState<User[]>([])
  
  // Filters
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({
    status: ['ACTIVE'], // Default to showing active users
    role: [],
    lastOnline: [],
  })
  
  // Zones for filter
  const [zones, setZones] = useState<Zone[]>([])
  
  // Get filter sections
  const filterSections = useUserFilterSections()

  // Determine current role filter from URL
  const currentRoleTab = useMemo(() => {
    if (!roleFilter) return 'all'
    const tab = roleTabs.find(t => t.id === roleFilter)
    return tab ? tab.id : 'all'
  }, [roleFilter])

  // Fetch zones for filtering
  useEffect(() => {
    async function fetchZones() {
      try {
        const response = await zonesApi.getAll()
        setZones(response || [])
      } catch (err) {
        console.error('Failed to fetch zones:', err)
      }
    }
    fetchZones()
  }, [])

  // Add zone filter section dynamically - hide role filter on specific role pages
  const allFilterSections = useMemo(() => {
    let sections = filterSections
    
    // Hide role filter when on a specific role page (not "all")
    if (currentRoleTab !== 'all') {
      sections = sections.filter(s => s.id !== 'role')
    }
    
    // Add zone filter if zones exist
    if (zones.length > 0) {
      return [
        ...sections,
        {
          id: 'zone',
          label: t('users.filters.zone', 'Zone'),
          options: zones.map(z => ({ value: z.id, label: z.zoneName })),
        },
      ]
    }
    return sections
  }, [filterSections, zones, t, currentRoleTab])

  // Persist view mode
  useEffect(() => {
    localStorage.setItem('users-view-mode', viewMode)
  }, [viewMode])

  // Fetch users
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Build role filter based on tab or filter selection
      const tabConfig = roleTabs.find(t => t.id === currentRoleTab)
      const currentRoleFilter = tabConfig?.roles || activeFilters.role

      // Build status filter (handle "PENDING" as emailVerified = false)
      const statusFilter = activeFilters.status.filter(s => s !== 'PENDING')
      const isPendingFilter = activeFilters.status.includes('PENDING')

      // Backend only accepts single values for role/status, so send first value only
      // For multi-select, we'll filter client-side
      const response = await usersApi.getAll({
        page,
        limit: pageSize,
        search: searchQuery || undefined,
        // Send single role (first from tab or first from filter) - let client-side handle multi
        role: currentRoleFilter?.length === 1 ? currentRoleFilter[0] as any : undefined,
        // Send single status (first one) - let client-side handle multi
        status: statusFilter.length === 1 ? statusFilter[0] as any : undefined,
        zoneId: activeFilters.zone?.length ? activeFilters.zone[0] : undefined,
        sortBy,
        sortOrder: sortDirection.toUpperCase() as 'ASC' | 'DESC',
      })

      let filteredUsers = response.data || []
      
      // Client-side filter for multiple roles (when tab specifies multiple like SUPER_ADMIN,ADMIN)
      if (currentRoleFilter && currentRoleFilter.length > 1) {
        filteredUsers = filteredUsers.filter(u => currentRoleFilter.includes(u.role))
      }
      
      // Client-side filter for multiple statuses
      if (statusFilter.length > 1) {
        filteredUsers = filteredUsers.filter(u => statusFilter.includes(u.status))
      }
      
      // Client-side filter for pending (emailVerified = false)
      if (isPendingFilter && statusFilter.length === 0) {
        filteredUsers = filteredUsers.filter(u => !u.emailVerified)
      }

      setUsers(filteredUsers)
      setTotalCount(response.total || filteredUsers.length)
    } catch (err: any) {
      console.error('Failed to fetch users:', err)
      setError(err.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, searchQuery, currentRoleTab, activeFilters, sortBy, sortDirection])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // Update URL search params
  useEffect(() => {
    const params = new URLSearchParams()
    if (searchQuery) params.set('search', searchQuery)
    setSearchParams(params, { replace: true })
  }, [searchQuery, setSearchParams])

  // Handle user selection
  const handleSelectUser = (user: User) => {
    setSelectedUsers(prev => [...prev, user])
  }

  const handleDeselectUser = (user: User) => {
    setSelectedUsers(prev => prev.filter(u => u.id !== user.id))
  }

  const handleSelectAll = () => {
    setSelectedUsers(users)
  }

  const handleDeselectAll = () => {
    setSelectedUsers([])
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
  const handleBatchDeactivate = async () => {
    if (selectedUsers.length === 0) return
    try {
      await usersApi.batchDeactivate(selectedUsers.map(u => u.id))
      setSelectedUsers([])
      setSelectionMode(false)
      fetchUsers()
    } catch (err) {
      console.error('Failed to deactivate users:', err)
    }
  }

  const handleBatchActivate = async () => {
    if (selectedUsers.length === 0) return
    try {
      await usersApi.batchActivate(selectedUsers.map(u => u.id))
      setSelectedUsers([])
      setSelectionMode(false)
      fetchUsers()
    } catch (err) {
      console.error('Failed to activate users:', err)
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
                {t('users.title', 'Users')}
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {t('users.subtitle', 'Manage your team members and their roles')}
              </p>
            </div>
            
            {/* Primary Actions */}
            <div className="flex items-center gap-2">
              {currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN' ? (
                <button
                  onClick={() => navigate('/users/new')}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  <UserPlus className="h-4 w-4" />
                  {t('users.addUser', 'Add User')}
                </button>
              ) : null}
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
              placeholder={t('users.searchPlaceholder', 'Search by name, email, or phone...')}
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
                    { value: 'firstName', label: t('users.sort.name', 'Name') },
                    { value: 'email', label: t('users.sort.email', 'Email') },
                    { value: 'createdAt', label: t('users.sort.created', 'Date Created') },
                    { value: 'lastLoginAt', label: t('users.sort.lastLogin', 'Last Login') },
                    { value: 'role', label: t('users.sort.role', 'Role') },
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
                title={t('users.view.card', 'Card View')}
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
                title={t('users.view.table', 'Table View')}
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            {/* Selection Mode Toggle */}
            <button
              onClick={() => {
                setSelectionMode(!selectionMode)
                if (selectionMode) {
                  setSelectedUsers([])
                }
              }}
              className={`p-2 border rounded-lg transition-colors ${
                selectionMode
                  ? 'border-emerald-500 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
                  : 'border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title={t('users.selectionMode', 'Selection Mode')}
            >
              <CheckSquare className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Selection Toolbar */}
        {selectionMode && selectedUsers.length > 0 && (
          <div className="mt-3 flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
              {t('users.selected', '{{count}} selected').replace('{{count}}', String(selectedUsers.length))}
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
              {t('users.batchActivate', 'Activate')}
            </button>
            <button
              onClick={handleBatchDeactivate}
              className="px-3 py-1.5 text-sm font-medium text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50"
            >
              {t('users.batchDeactivate', 'Deactivate')}
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
              onClick={fetchUsers}
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700"
            >
              {t('common.retry', 'Retry')}
            </button>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Users className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {searchQuery
                ? t('users.noSearchResults', 'No users found')
                : t('users.noUsers', 'No users yet')}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {searchQuery
                ? t('users.tryDifferentSearch', 'Try a different search term')
                : t('users.addFirstUser', 'Add your first team member to get started')}
            </p>
            {!searchQuery && (currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN') && (
              <button
                onClick={() => navigate('/users/new')}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700"
              >
                <UserPlus className="h-4 w-4" />
                {t('users.addUser', 'Add User')}
              </button>
            )}
          </div>
        ) : viewMode === 'card' ? (
          /* Card View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {users.map(user => (
              <UserCard
                key={user.id}
                user={user}
                isSelected={selectedUsers.some(u => u.id === user.id)}
                onSelect={handleSelectUser}
                onDeselect={handleDeselectUser}
                selectionMode={selectionMode}
                onEdit={(u) => navigate(`/users/${u.id}/edit`)}
                onViewProfile={(u) => navigate(`/users/view/${u.id}`)}
                onResetPassword={async (u) => {
                  try {
                    await usersApi.resetPassword(u.id)
                    // TODO: Show success toast
                  } catch (err) {
                    console.error('Failed to reset password:', err)
                  }
                }}
                onDeactivate={async (u) => {
                  try {
                    await usersApi.archive(u.id)
                    fetchUsers()
                  } catch (err) {
                    console.error('Failed to deactivate user:', err)
                  }
                }}
                onActivate={async (u) => {
                  try {
                    await usersApi.restore(u.id)
                    fetchUsers()
                  } catch (err) {
                    console.error('Failed to activate user:', err)
                  }
                }}
              />
            ))}
          </div>
        ) : (
          /* Table View */
          <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                  {selectionMode && (
                    <th className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedUsers.length === users.length && users.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            handleSelectAll()
                          } else {
                            handleDeselectAll()
                          }
                        }}
                        className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-emerald-600 focus:ring-emerald-500 dark:bg-gray-700"
                      />
                    </th>
                  )}
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('users.table.name', 'Name')}
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('users.table.email', 'Email')}
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('users.table.role', 'Role')}
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('users.table.status', 'Status')}
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('users.table.zone', 'Zone/Site')}
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('users.table.supervisor', 'Supervisor')}
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('users.table.lastActive', 'Last Active')}
                  </th>
                  <th className="w-24 px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">
                    {t('users.table.actions', 'Actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {users.map(user => {
                  const isSelected = selectedUsers.some(u => u.id === user.id)
                  const fullName = user.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email
                  
                  return (
                    <tr
                      key={user.id}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                        isSelected ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''
                      }`}
                    >
                      {selectionMode && (
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              if (isSelected) {
                                handleDeselectUser(user)
                              } else {
                                handleSelectUser(user)
                              }
                            }}
                            className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-emerald-600 focus:ring-emerald-500 dark:bg-gray-700"
                          />
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <button
                          onClick={() => navigate(`/users/view/${user.id}`)}
                          className="flex items-center gap-3 hover:underline text-left"
                        >
                          <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300 shrink-0">
                            {user.profilePhotoUrl ? (
                              <img src={user.profilePhotoUrl} alt={fullName} className="h-8 w-8 rounded-full object-cover" />
                            ) : (
                              fullName.slice(0, 2).toUpperCase()
                            )}
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white">{fullName}</span>
                        </button>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {user.email}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {t(`role.${user.role}`, user.role)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          user.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
                            : user.status === 'INACTIVE'
                            ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                        }`}>
                          {t(`users.status.${user.status.toLowerCase()}`, user.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {user.zone?.zoneName || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {user.supervisor 
                          ? `${user.supervisor.firstName || ''} ${user.supervisor.lastName || ''}`.trim() || user.supervisor.email
                          : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => navigate(`/users/view/${user.id}`)}
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
        {!loading && users.length > 0 && totalCount > pageSize && (
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
        title={t('users.filterTitle', 'Filter Users')}
        sections={allFilterSections}
        activeFilters={activeFilters}
        onFiltersChange={setActiveFilters}
      />
    </div>
  )
}

export default UsersPage
