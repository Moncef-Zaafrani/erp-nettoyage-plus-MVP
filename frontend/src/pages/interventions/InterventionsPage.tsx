import { useState, useEffect, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  Calendar as CalendarIcon,
  List,
  Plus,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  PlayCircle,
  RefreshCw,
  MapPin,
  Users,
  Eye,
  Edit,
  Loader2,
} from 'lucide-react'
import {
  interventionsApi,
  Intervention,
  InterventionStatus,
  sitesApi,
  Site,
} from '@/services/api'
import { useAuth } from '@/contexts/AuthContext'
import { FilterDrawer } from '@/components/shared/FilterDrawer'

// View mode type
type ViewMode = 'calendar' | 'list'
type CalendarViewType = 'month' | 'week' | 'day'

// Status config for badges
const statusConfig: Record<InterventionStatus, { label: string; color: string; bgColor: string; icon: typeof Clock }> = {
  SCHEDULED: { label: 'interventions.status.scheduled', color: 'text-blue-700 dark:text-blue-300', bgColor: 'bg-blue-100 dark:bg-blue-900/50', icon: Clock },
  IN_PROGRESS: { label: 'interventions.status.inProgress', color: 'text-yellow-700 dark:text-yellow-300', bgColor: 'bg-yellow-100 dark:bg-yellow-900/50', icon: PlayCircle },
  COMPLETED: { label: 'interventions.status.completed', color: 'text-green-700 dark:text-green-300', bgColor: 'bg-green-100 dark:bg-green-900/50', icon: CheckCircle },
  CANCELLED: { label: 'interventions.status.cancelled', color: 'text-red-700 dark:text-red-300', bgColor: 'bg-red-100 dark:bg-red-900/50', icon: XCircle },
  RESCHEDULED: { label: 'interventions.status.rescheduled', color: 'text-purple-700 dark:text-purple-300', bgColor: 'bg-purple-100 dark:bg-purple-900/50', icon: RefreshCw },
}

// Status tabs
const statusTabs = [
  { id: 'all', labelKey: 'interventions.tabs.all', statuses: null as InterventionStatus[] | null },
  { id: 'scheduled', labelKey: 'interventions.tabs.scheduled', statuses: ['SCHEDULED' as InterventionStatus] },
  { id: 'inProgress', labelKey: 'interventions.tabs.inProgress', statuses: ['IN_PROGRESS' as InterventionStatus] },
  { id: 'completed', labelKey: 'interventions.tabs.completed', statuses: ['COMPLETED' as InterventionStatus] },
  { id: 'cancelled', labelKey: 'interventions.tabs.cancelled', statuses: ['CANCELLED' as InterventionStatus, 'RESCHEDULED' as InterventionStatus] },
]

// Calendar colors by status
const calendarColors: Record<InterventionStatus, string> = {
  SCHEDULED: 'bg-blue-500',
  IN_PROGRESS: 'bg-yellow-500',
  COMPLETED: 'bg-green-500',
  CANCELLED: 'bg-red-500',
  RESCHEDULED: 'bg-purple-500',
}

export function InterventionsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()

  // State
  const [interventions, setInterventions] = useState<Intervention[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('calendar')
  const [calendarView, setCalendarView] = useState<CalendarViewType>('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [activeStatusTab, setActiveStatusTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilterDrawer, setShowFilterDrawer] = useState(false)
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({})

  // Reference data
  const [sites, setSites] = useState<Site[]>([])

  // Pagination for list view
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 20

  // Get date range for calendar view
  const getDateRange = useCallback(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    if (calendarView === 'month') {
      const firstDay = new Date(year, month, 1)
      const lastDay = new Date(year, month + 1, 0)
      // Extend to include days from prev/next month shown in calendar
      const startDate = new Date(firstDay)
      startDate.setDate(startDate.getDate() - startDate.getDay())
      const endDate = new Date(lastDay)
      endDate.setDate(endDate.getDate() + (6 - endDate.getDay()))
      return { startDate, endDate }
    } else if (calendarView === 'week') {
      const startOfWeek = new Date(currentDate)
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6)
      return { startDate: startOfWeek, endDate: endOfWeek }
    } else {
      return { startDate: currentDate, endDate: currentDate }
    }
  }, [currentDate, calendarView])

  // Load reference data
  useEffect(() => {
    const loadReferenceData = async () => {
      try {
        const sitesData = await sitesApi.getAll({ limit: 1000 })
        setSites(Array.isArray(sitesData) ? sitesData : sitesData.data || [])
      } catch (err) {
        console.error('Failed to load reference data:', err)
      }
    }
    loadReferenceData()
  }, [])

  // Load interventions
  const loadInterventions = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      if (viewMode === 'calendar') {
        const { startDate, endDate } = getDateRange()
        const data = await interventionsApi.getCalendar({
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
        })
        setInterventions(data || [])
      } else {
        // List view with pagination
        const statusFilter = statusTabs.find(t => t.id === activeStatusTab)?.statuses
        const response = await interventionsApi.getAll({
          page,
          limit: pageSize,
          status: statusFilter?.length === 1 ? statusFilter[0] : undefined,
          siteId: activeFilters.site?.[0],
          clientId: activeFilters.client?.[0],
        })
        setInterventions(response.data || [])
        setTotalPages(response.totalPages || 1)
        setTotal(response.total || 0)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load interventions')
      console.error('Failed to load interventions:', err)
    } finally {
      setLoading(false)
    }
  }, [viewMode, calendarView, currentDate, page, activeStatusTab, activeFilters, getDateRange])

  useEffect(() => {
    loadInterventions()
  }, [loadInterventions])

  // Filter interventions for display
  const filteredInterventions = useMemo(() => {
    let filtered = [...interventions]

    // Filter by status tab
    const statusFilter = statusTabs.find(t => t.id === activeStatusTab)?.statuses
    if (statusFilter) {
      filtered = filtered.filter(i => statusFilter.includes(i.status))
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(i =>
        i.interventionCode.toLowerCase().includes(q) ||
        i.site?.name?.toLowerCase().includes(q) ||
        i.contract?.client?.name?.toLowerCase().includes(q)
      )
    }

    return filtered
  }, [interventions, activeStatusTab, searchQuery])

  // Calendar navigation
  const navigateCalendar = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (calendarView === 'month') {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1))
    } else if (calendarView === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7))
    } else {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1))
    }
    setCurrentDate(newDate)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Get calendar title
  const getCalendarTitle = () => {
    const options: Intl.DateTimeFormatOptions = { month: 'long', year: 'numeric' }
    if (calendarView === 'month') {
      return currentDate.toLocaleDateString(undefined, options)
    } else if (calendarView === 'week') {
      const { startDate, endDate } = getDateRange()
      return `${startDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`
    } else {
      return currentDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    }
  }

  // Generate calendar grid for month view
  const generateMonthGrid = () => {
    const { startDate, endDate } = getDateRange()
    const days: Date[] = []
    const current = new Date(startDate)
    while (current <= endDate) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }
    return days
  }

  // Get interventions for a specific date
  const getInterventionsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return filteredInterventions.filter(i => i.scheduledDate === dateStr)
  }

  // Filter sections for drawer
  const filterSections = useMemo(() => [
    {
      id: 'status',
      label: t('interventions.filters.status', 'Status'),
      options: Object.entries(statusConfig).map(([value, config]) => ({
        value,
        label: t(config.label, value),
      })),
    },
    {
      id: 'site',
      label: t('interventions.filters.site', 'Site'),
      options: sites.map(s => ({ value: s.id, label: s.name })),
    },
  ], [t, sites])

  // Permission checks
  const canCreate = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPERVISOR'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Title and Actions Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('interventions.title', 'Interventions')}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {t('interventions.subtitle', 'Manage and track cleaning interventions')}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* View Toggle */}
              <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'calendar'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <CalendarIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('interventions.view.calendar', 'Calendar')}</span>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <List className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('interventions.view.list', 'List')}</span>
                </button>
              </div>

              {/* Add Intervention Button */}
              {canCreate && (
                <button
                  onClick={() => navigate('/interventions/new')}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('interventions.add', 'Add Intervention')}</span>
                </button>
              )}
            </div>
          </div>

          {/* Calendar Controls (only in calendar view) */}
          {viewMode === 'calendar' && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {/* Calendar View Type Toggle */}
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                  {(['month', 'week', 'day'] as CalendarViewType[]).map((view) => (
                    <button
                      key={view}
                      onClick={() => setCalendarView(view)}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        calendarView === view
                          ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      {t(`interventions.calendar.${view}`, view.charAt(0).toUpperCase() + view.slice(1))}
                    </button>
                  ))}
                </div>
              </div>

              {/* Navigation */}
              <div className="flex items-center gap-3">
                <button
                  onClick={goToToday}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  {t('interventions.calendar.today', 'Today')}
                </button>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => navigateCalendar('prev')}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <span className="text-lg font-semibold text-gray-900 dark:text-white min-w-[200px] text-center">
                    {getCalendarTitle()}
                  </span>
                  <button
                    onClick={() => navigateCalendar('next')}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Status Legend */}
              <div className="flex items-center gap-3 flex-wrap">
                {Object.entries(statusConfig).map(([status, config]) => (
                  <div key={status} className="flex items-center gap-1.5">
                    <div className={`w-3 h-3 rounded ${calendarColors[status as InterventionStatus]}`} />
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {t(config.label, status)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* List View Controls */}
          {viewMode === 'list' && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {/* Status Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1">
                {statusTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveStatusTab(tab.id)
                      setPage(1)
                    }}
                    className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                      activeStatusTab === tab.id
                        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {t(tab.labelKey, tab.id)}
                  </button>
                ))}
              </div>

              {/* Search and Filter */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('interventions.searchPlaceholder', 'Search interventions...')}
                    className="pl-10 pr-4 py-2 w-64 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <button
                  onClick={() => setShowFilterDrawer(true)}
                  className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${
                    Object.keys(activeFilters).length > 0
                      ? 'border-primary-500 text-primary-600 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <Filter className="h-4 w-4" />
                  {t('common.filter', 'Filter')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20">
            <XCircle className="h-12 w-12 text-red-500 mb-4" />
            <p className="text-gray-600 dark:text-gray-400">{error}</p>
            <button
              onClick={loadInterventions}
              className="mt-4 px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              {t('common.retry', 'Retry')}
            </button>
          </div>
        ) : viewMode === 'calendar' ? (
          /* Calendar View */
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            {calendarView === 'month' && (
              <>
                {/* Day Headers */}
                <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div
                      key={day}
                      className="py-3 text-center text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50"
                    >
                      {t(`calendar.days.${day.toLowerCase()}`, day)}
                    </div>
                  ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 divide-x divide-y divide-gray-200 dark:divide-gray-700">
                  {generateMonthGrid().map((date, index) => {
                    const isToday = date.toDateString() === new Date().toDateString()
                    const isCurrentMonth = date.getMonth() === currentDate.getMonth()
                    const dayInterventions = getInterventionsForDate(date)

                    return (
                      <div
                        key={index}
                        className={`min-h-[120px] p-2 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                          !isCurrentMonth ? 'bg-gray-50/50 dark:bg-gray-800/30' : ''
                        }`}
                        onClick={() => {
                          setCurrentDate(date)
                          setCalendarView('day')
                        }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className={`text-sm font-medium ${
                              isToday
                                ? 'bg-primary-600 text-white w-7 h-7 flex items-center justify-center rounded-full'
                                : isCurrentMonth
                                ? 'text-gray-900 dark:text-white'
                                : 'text-gray-400 dark:text-gray-500'
                            }`}
                          >
                            {date.getDate()}
                          </span>
                          {dayInterventions.length > 0 && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {dayInterventions.length}
                            </span>
                          )}
                        </div>

                        {/* Intervention blocks */}
                        <div className="space-y-1">
                          {dayInterventions.slice(0, 3).map((intervention) => (
                            <div
                              key={intervention.id}
                              onClick={(e) => {
                                e.stopPropagation()
                                navigate(`/interventions/view/${intervention.id}`)
                              }}
                              className={`${calendarColors[intervention.status]} text-white text-xs px-2 py-1 rounded truncate cursor-pointer hover:opacity-80 transition-opacity`}
                              title={`${intervention.interventionCode} - ${intervention.site?.name || 'Site'}`}
                            >
                              {intervention.scheduledStartTime?.slice(0, 5)} {intervention.site?.name?.slice(0, 15)}
                            </div>
                          ))}
                          {dayInterventions.length > 3 && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 pl-2">
                              +{dayInterventions.length - 3} {t('interventions.more', 'more')}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}

            {calendarView === 'week' && (
              <WeekView
                interventions={filteredInterventions}
                onInterventionClick={(id) => navigate(`/interventions/view/${id}`)}
                getDateRange={getDateRange}
                calendarColors={calendarColors}
              />
            )}

            {calendarView === 'day' && (
              <DayView
                currentDate={currentDate}
                interventions={filteredInterventions}
                onInterventionClick={(id) => navigate(`/interventions/view/${id}`)}
                calendarColors={calendarColors}
              />
            )}
          </div>
        ) : (
          /* List View */
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('interventions.table.intervention', 'Intervention')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('interventions.table.site', 'Site')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('interventions.table.date', 'Date & Time')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('interventions.table.agents', 'Agents')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('interventions.table.status', 'Status')}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('common.actions', 'Actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredInterventions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center">
                        <CalendarIcon className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400 font-medium">
                          {t('interventions.noInterventions', 'No interventions found')}
                        </p>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                          {t('interventions.noInterventionsHint', 'Try adjusting your filters or create a new intervention')}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredInterventions.map((intervention) => {
                      const status = statusConfig[intervention.status]
                      const StatusIcon = status.icon
                      return (
                        <tr
                          key={intervention.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                          onClick={() => navigate(`/interventions/view/${intervention.id}`)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${status.bgColor}`}>
                                <StatusIcon className={`h-4 w-4 ${status.color}`} />
                              </div>
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {intervention.interventionCode}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {intervention.contract?.contractCode || 'No contract'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-gray-400" />
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {intervention.site?.name || 'Unknown Site'}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {intervention.contract?.client?.name || ''}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-gray-400" />
                              <div>
                                <div className="text-sm text-gray-900 dark:text-white">
                                  {new Date(intervention.scheduledDate).toLocaleDateString()}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {intervention.scheduledStartTime?.slice(0, 5)} - {intervention.scheduledEndTime?.slice(0, 5)}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                {intervention.assignedAgentIds?.length || 0} {t('interventions.agents', 'agents')}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${status.bgColor} ${status.color}`}>
                              <StatusIcon className="h-3.5 w-3.5" />
                              {t(status.label, intervention.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  navigate(`/interventions/view/${intervention.id}`)
                                }}
                                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                title={t('common.view', 'View')}
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              {canCreate && intervention.status === 'SCHEDULED' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    navigate(`/interventions/${intervention.id}/edit`)
                                  }}
                                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                  title={t('common.edit', 'Edit')}
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('pagination.showing', 'Showing {{from}} to {{to}} of {{total}} results', {
                    from: (page - 1) * pageSize + 1,
                    to: Math.min(page * pageSize, total),
                    total,
                  })}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t('pagination.previous', 'Previous')}
                  </button>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t('pagination.next', 'Next')}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filter Drawer */}
      <FilterDrawer
        isOpen={showFilterDrawer}
        onClose={() => setShowFilterDrawer(false)}
        title={t('interventions.filters.title', 'Filter Interventions')}
        sections={filterSections}
        activeFilters={activeFilters}
        onFiltersChange={setActiveFilters}
      />
    </div>
  )
}

// Week View Component
function WeekView({
  interventions,
  onInterventionClick,
  getDateRange,
  calendarColors,
}: {
  interventions: Intervention[]
  onInterventionClick: (id: string) => void
  getDateRange: () => { startDate: Date; endDate: Date }
  calendarColors: Record<InterventionStatus, string>
}) {
  const { startDate } = getDateRange()
  const days: Date[] = []
  const current = new Date(startDate)
  for (let i = 0; i < 7; i++) {
    days.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }

  const hours = Array.from({ length: 12 }, (_, i) => i + 7) // 7:00 AM to 6:00 PM

  const getInterventionsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return interventions.filter(i => i.scheduledDate === dateStr)
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[800px]">
        {/* Header with days */}
        <div className="grid grid-cols-8 border-b border-gray-200 dark:border-gray-700">
          <div className="p-3 text-center text-sm font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50" />
          {days.map((date, i) => {
            const isToday = date.toDateString() === new Date().toDateString()
            return (
              <div
                key={i}
                className={`p-3 text-center border-l border-gray-200 dark:border-gray-700 ${
                  isToday ? 'bg-primary-50 dark:bg-primary-900/20' : 'bg-gray-50 dark:bg-gray-800/50'
                }`}
              >
                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                  {date.toLocaleDateString(undefined, { weekday: 'short' })}
                </div>
                <div className={`text-lg font-semibold ${isToday ? 'text-primary-600 dark:text-primary-400' : 'text-gray-900 dark:text-white'}`}>
                  {date.getDate()}
                </div>
              </div>
            )
          })}
        </div>

        {/* Time grid */}
        <div className="relative">
          {hours.map((hour) => (
            <div key={hour} className="grid grid-cols-8 border-b border-gray-100 dark:border-gray-700/50">
              <div className="p-2 text-right text-xs text-gray-400 pr-3">
                {hour.toString().padStart(2, '0')}:00
              </div>
              {days.map((date, dayIndex) => {
                const dayInterventions = getInterventionsForDate(date).filter(i => {
                  const startHour = parseInt(i.scheduledStartTime?.split(':')[0] || '0')
                  return startHour === hour
                })
                return (
                  <div
                    key={dayIndex}
                    className="relative min-h-[60px] border-l border-gray-100 dark:border-gray-700/50 p-1"
                  >
                    {dayInterventions.map((intervention) => (
                      <div
                        key={intervention.id}
                        onClick={() => onInterventionClick(intervention.id)}
                        className={`${calendarColors[intervention.status]} text-white text-xs px-2 py-1 rounded cursor-pointer hover:opacity-80 transition-opacity mb-1`}
                      >
                        <div className="font-medium truncate">{intervention.site?.name}</div>
                        <div className="opacity-80">{intervention.scheduledStartTime?.slice(0, 5)}</div>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Day View Component
function DayView({
  currentDate,
  interventions,
  onInterventionClick,
  calendarColors,
}: {
  currentDate: Date
  interventions: Intervention[]
  onInterventionClick: (id: string) => void
  calendarColors: Record<InterventionStatus, string>
}) {
  const { t } = useTranslation()
  const dateStr = currentDate.toISOString().split('T')[0]
  const dayInterventions = interventions.filter(i => i.scheduledDate === dateStr)
    .sort((a, b) => (a.scheduledStartTime || '').localeCompare(b.scheduledStartTime || ''))

  const hours = Array.from({ length: 14 }, (_, i) => i + 6) // 6:00 AM to 7:00 PM

  return (
    <div className="p-4">
      {dayInterventions.length === 0 ? (
        <div className="text-center py-16">
          <CalendarIcon className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            {t('interventions.noInterventionsForDay', 'No interventions scheduled for this day')}
          </p>
        </div>
      ) : (
        <div className="relative">
          {hours.map((hour) => {
            const hourInterventions = dayInterventions.filter(i => {
              const startHour = parseInt(i.scheduledStartTime?.split(':')[0] || '0')
              return startHour === hour
            })

            return (
              <div key={hour} className="flex border-b border-gray-100 dark:border-gray-700/50 min-h-[80px]">
                <div className="w-20 flex-shrink-0 p-3 text-right text-sm text-gray-400">
                  {hour.toString().padStart(2, '0')}:00
                </div>
                <div className="flex-1 p-2 space-y-2">
                  {hourInterventions.map((intervention) => {
                    return (
                      <div
                        key={intervention.id}
                        onClick={() => onInterventionClick(intervention.id)}
                        className={`${calendarColors[intervention.status]} text-white rounded-lg p-3 cursor-pointer hover:opacity-90 transition-opacity`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-medium">{intervention.interventionCode}</div>
                            <div className="text-sm opacity-90">{intervention.site?.name}</div>
                            <div className="text-xs opacity-80 mt-1">
                              {intervention.scheduledStartTime?.slice(0, 5)} - {intervention.scheduledEndTime?.slice(0, 5)}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 bg-white/20 rounded-full px-2 py-1 text-xs">
                              <Users className="h-3 w-3" />
                              {intervention.assignedAgentIds?.length || 0}
                            </div>
                          </div>
                        </div>
                        {intervention.notes && (
                          <div className="mt-2 text-xs opacity-80 line-clamp-2">
                            {intervention.notes}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default InterventionsPage
