import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  User,
  Calendar,
  Tag,
  MessageSquare,
  Loader2,
  RefreshCw,
  Inbox,
  ArrowUpRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { reportsApi, Report } from '@/services/api'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/Toast'

// Status configuration
const statusConfig = {
  open: {
    label: 'reports.status.open',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400',
    icon: Clock,
  },
  in_progress: {
    label: 'reports.status.inProgress',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400',
    icon: RefreshCw,
  },
  resolved: {
    label: 'reports.status.resolved',
    color: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400',
    icon: CheckCircle,
  },
  closed: {
    label: 'reports.status.closed',
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    icon: XCircle,
  },
}

const priorityConfig = {
  low: { label: 'reports.priority.low', color: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400' },
  medium: { label: 'reports.priority.medium', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400' },
  high: { label: 'reports.priority.high', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400' },
  urgent: { label: 'reports.priority.urgent', color: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400' },
}

const categoryConfig: Record<string, { label: string; icon: typeof AlertTriangle }> = {
  equipment_issue: { label: 'reports.category.equipment', icon: AlertTriangle },
  safety_concern: { label: 'reports.category.safety', icon: AlertTriangle },
  schedule_problem: { label: 'reports.category.schedule', icon: Calendar },
  site_access: { label: 'reports.category.siteAccess', icon: AlertTriangle },
  client_complaint: { label: 'reports.category.clientComplaint', icon: MessageSquare },
  other: { label: 'reports.category.other', icon: Tag },
}

export default function ReportsPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const toast = useToast()

  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'assigned' | 'my-reports' | 'all'>('assigned')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [expandedReport, setExpandedReport] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  // Determine if user can see "all" reports
  const canSeeAll = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN'

  useEffect(() => {
    fetchReports()
  }, [activeTab])

  const fetchReports = async () => {
    setLoading(true)
    try {
      let data: Report[]
      if (activeTab === 'all' && canSeeAll) {
        data = await reportsApi.getAll()
      } else if (activeTab === 'my-reports') {
        data = await reportsApi.getMyReports()
      } else {
        data = await reportsApi.getAssignedToMe()
      }
      setReports(data)
    } catch (error) {
      console.error('Failed to fetch reports:', error)
      toast.error(t('reports.fetchError', 'Failed to load reports'))
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (reportId: string, newStatus: string) => {
    setUpdatingId(reportId)
    try {
      await reportsApi.update(reportId, { status: newStatus as any })
      toast.success(t('reports.statusUpdated', 'Status updated'))
      fetchReports()
    } catch (error) {
      console.error('Failed to update status:', error)
      toast.error(t('reports.updateError', 'Failed to update status'))
    } finally {
      setUpdatingId(null)
    }
  }

  const handleResolve = async (reportId: string) => {
    setUpdatingId(reportId)
    try {
      await reportsApi.resolve(reportId, {
        resolution: t('reports.resolvedByAdmin', 'Resolved by administrator'),
      })
      toast.success(t('reports.resolved', 'Report resolved'))
      fetchReports()
    } catch (error) {
      console.error('Failed to resolve report:', error)
      toast.error(t('reports.resolveError', 'Failed to resolve report'))
    } finally {
      setUpdatingId(null)
    }
  }

  // Filter reports
  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      !searchQuery ||
      report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="flex flex-1 flex-col p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('reports.title', 'Reports')}
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          {t('reports.subtitle', 'View and manage reported issues')}
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('assigned')}
          className={cn(
            'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
            activeTab === 'assigned'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
          )}
        >
          {t('reports.assignedToMe', 'Assigned to Me')}
        </button>
        <button
          onClick={() => setActiveTab('my-reports')}
          className={cn(
            'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
            activeTab === 'my-reports'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
          )}
        >
          {t('reports.myReports', 'My Reports')}
        </button>
        {canSeeAll && (
          <button
            onClick={() => setActiveTab('all')}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
              activeTab === 'all'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            )}
          >
            {t('reports.allReports', 'All Reports')}
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={t('reports.searchPlaceholder', 'Search reports...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm transition-colors focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          >
            <option value="all">{t('reports.filter.allStatuses', 'All Statuses')}</option>
            <option value="open">{t('reports.status.open', 'Open')}</option>
            <option value="in_progress">{t('reports.status.inProgress', 'In Progress')}</option>
            <option value="resolved">{t('reports.status.resolved', 'Resolved')}</option>
            <option value="closed">{t('reports.status.closed', 'Closed')}</option>
          </select>
        </div>

        {/* Refresh */}
        <button
          onClick={fetchReports}
          disabled={loading}
          className="rounded-lg border border-gray-200 bg-white p-2 text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
        >
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
        </button>
      </div>

      {/* Reports list */}
      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <Inbox className="h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            {t('reports.noReports', 'No reports found')}
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {activeTab === 'assigned'
              ? t('reports.noAssigned', "You don't have any reports assigned to you")
              : activeTab === 'my-reports'
              ? t('reports.noMyReports', "You haven't submitted any reports yet")
              : t('reports.noReportsInSystem', 'No reports in the system')}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReports.map((report) => {
            const status = statusConfig[report.status as keyof typeof statusConfig] || statusConfig.open
            const priority = priorityConfig[report.priority as keyof typeof priorityConfig] || priorityConfig.medium
            const category = categoryConfig[report.category] || categoryConfig.other
            const StatusIcon = status.icon
            const CategoryIcon = category.icon
            const isExpanded = expandedReport === report.id
            const isUpdating = updatingId === report.id

            return (
              <div
                key={report.id}
                className="rounded-lg border border-gray-200 bg-white transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
              >
                {/* Report header */}
                <button
                  onClick={() => setExpandedReport(isExpanded ? null : report.id)}
                  className="flex w-full items-start gap-4 p-4 text-left"
                >
                  {/* Status icon */}
                  <div className={cn('rounded-lg p-2', status.color)}>
                    <StatusIcon className="h-5 w-5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-medium text-gray-900 dark:text-white truncate">
                        {report.title}
                      </h3>
                      <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        #{report.id.slice(0, 8).toUpperCase()}
                      </span>
                    </div>

                    {/* Meta row */}
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span className={cn('rounded px-1.5 py-0.5 font-medium', priority.color)}>
                        {t(priority.label)}
                      </span>
                      <span className="flex items-center gap-1">
                        <CategoryIcon className="h-3 w-3" />
                        {t(category.label)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(report.createdAt)}
                      </span>
                      {report.reporter && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {report.reporter.firstName} {report.reporter.lastName}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Expand icon */}
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-gray-400 shrink-0" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400 shrink-0" />
                  )}
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="border-t border-gray-100 dark:border-gray-700 p-4 space-y-4">
                    {/* Description */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('reports.description', 'Description')}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                        {report.description}
                      </p>
                    </div>

                    {/* Screenshot */}
                    {report.screenshotUrl && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t('reports.screenshot', 'Screenshot')}
                        </h4>
                        <img
                          src={report.screenshotUrl}
                          alt="Report screenshot"
                          className="max-w-md rounded-lg border border-gray-200 dark:border-gray-700"
                        />
                      </div>
                    )}

                    {/* Resolution */}
                    {report.resolution && (
                      <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-3">
                        <h4 className="text-sm font-medium text-green-700 dark:text-green-400 mb-1">
                          {t('reports.resolution', 'Resolution')}
                        </h4>
                        <p className="text-sm text-green-600 dark:text-green-300">
                          {report.resolution}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    {activeTab !== 'my-reports' && report.status !== 'resolved' && report.status !== 'closed' && (
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                        {report.status === 'open' && (
                          <button
                            onClick={() => handleStatusChange(report.id, 'in_progress')}
                            disabled={isUpdating}
                            className="flex items-center gap-1.5 rounded-lg bg-amber-100 px-3 py-1.5 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-200 dark:bg-amber-900/50 dark:text-amber-400 dark:hover:bg-amber-900/70"
                          >
                            {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUpRight className="h-4 w-4" />}
                            {t('reports.markInProgress', 'Mark In Progress')}
                          </button>
                        )}
                        <button
                          onClick={() => handleResolve(report.id)}
                          disabled={isUpdating}
                          className="flex items-center gap-1.5 rounded-lg bg-green-100 px-3 py-1.5 text-sm font-medium text-green-700 transition-colors hover:bg-green-200 dark:bg-green-900/50 dark:text-green-400 dark:hover:bg-green-900/70"
                        >
                          {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                          {t('reports.markResolved', 'Mark Resolved')}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
