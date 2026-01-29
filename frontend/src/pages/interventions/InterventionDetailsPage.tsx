import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Edit,
  Calendar,
  Users,
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Building2,
  Play,
  XCircle,
  RotateCcw,
  MoreVertical,
  Image,
  Star,
  History,
  User,
  Phone,
  Mail,
  Navigation,
  ChevronRight,
  Trash2,
  CalendarClock,
} from 'lucide-react'
import {
  interventionsApi,
  Intervention,
  InterventionStatus,
  sitesApi,
  Site,
  usersApi,
  User as UserType,
} from '@/services/api'
import { useAuth } from '@/contexts/AuthContext'

// Status configuration
const statusConfig: Record<InterventionStatus, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  SCHEDULED: {
    label: 'Scheduled',
    color: 'text-blue-700 dark:text-blue-300',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    icon: Calendar,
  },
  IN_PROGRESS: {
    label: 'In Progress',
    color: 'text-yellow-700 dark:text-yellow-300',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    icon: Play,
  },
  COMPLETED: {
    label: 'Completed',
    color: 'text-green-700 dark:text-green-300',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    icon: CheckCircle2,
  },
  CANCELLED: {
    label: 'Cancelled',
    color: 'text-red-700 dark:text-red-300',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    icon: XCircle,
  },
  RESCHEDULED: {
    label: 'Rescheduled',
    color: 'text-purple-700 dark:text-purple-300',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    icon: RotateCcw,
  },
}

// Tab configuration
const tabs = [
  { id: 'overview', labelKey: 'interventions.details.tabs.overview', icon: FileText },
  { id: 'team', labelKey: 'interventions.details.tabs.team', icon: Users },
  { id: 'photos', labelKey: 'interventions.details.tabs.photos', icon: Image },
  { id: 'history', labelKey: 'interventions.details.tabs.history', icon: History },
]

export function InterventionDetailsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  useAuth()

  // State
  const [intervention, setIntervention] = useState<Intervention | null>(null)
  const [site, setSite] = useState<Site | null>(null)
  const [agents, setAgents] = useState<UserType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showActionMenu, setShowActionMenu] = useState(false)
  const [showRescheduleModal, setShowRescheduleModal] = useState(false)
  const [rescheduleData, setRescheduleData] = useState({
    newDate: '',
    newStartTime: '',
    newEndTime: '',
    reason: '',
  })

  // Load intervention data
  useEffect(() => {
    const loadData = async () => {
      if (!id) return

      setLoading(true)
      setError(null)

      try {
        const interventionData = await interventionsApi.getById(id)
        setIntervention(interventionData)

        // Load site details
        if (interventionData.siteId) {
          try {
            const siteData = await sitesApi.getById(interventionData.siteId)
            setSite(siteData)
          } catch {
            console.error('Failed to load site')
          }
        }

        // Load agent details
        if (interventionData.assignedAgentIds?.length) {
          try {
            const agentsData = await Promise.all(
              interventionData.assignedAgentIds.map(agentId =>
                usersApi.getById(agentId).catch(() => null)
              )
            )
            setAgents(agentsData.filter((a): a is UserType => a !== null))
          } catch {
            console.error('Failed to load agents')
          }
        }
      } catch (err: any) {
        setError(err.message || t('interventions.details.loadError', 'Failed to load intervention'))
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [id, t])

  // Format date/time helpers
  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatTime = (timeStr: string | undefined) => {
    if (!timeStr) return '-'
    // Handle HH:mm:ss or HH:mm format
    const [hours, minutes] = timeStr.split(':')
    const date = new Date()
    date.setHours(parseInt(hours, 10), parseInt(minutes, 10))
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  }

  // Action handlers
  const handleStart = async () => {
    if (!id) return
    setActionLoading('start')
    try {
      const updated = await interventionsApi.start(id)
      setIntervention(updated)
    } catch (err: any) {
      alert(err.message || 'Failed to start intervention')
    } finally {
      setActionLoading(null)
    }
  }

  const handleComplete = async () => {
    if (!id) return
    setActionLoading('complete')
    try {
      const updated = await interventionsApi.complete(id)
      setIntervention(updated)
    } catch (err: any) {
      alert(err.message || 'Failed to complete intervention')
    } finally {
      setActionLoading(null)
    }
  }

  const handleCancel = async () => {
    if (!id) return
    if (!confirm(t('interventions.details.confirmCancel', 'Are you sure you want to cancel this intervention?'))) {
      return
    }
    setActionLoading('cancel')
    try {
      const updated = await interventionsApi.cancel(id)
      setIntervention(updated)
    } catch (err: any) {
      alert(err.message || 'Failed to cancel intervention')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReschedule = async () => {
    if (!id) return
    setActionLoading('reschedule')
    try {
      const updated = await interventionsApi.reschedule(id, {
        newDate: rescheduleData.newDate,
        newStartTime: rescheduleData.newStartTime,
        newEndTime: rescheduleData.newEndTime,
        reason: rescheduleData.reason,
      })
      setIntervention(updated)
      setShowRescheduleModal(false)
      setRescheduleData({ newDate: '', newStartTime: '', newEndTime: '', reason: '' })
    } catch (err: any) {
      alert(err.message || 'Failed to reschedule intervention')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async () => {
    if (!id) return
    if (!confirm(t('interventions.details.confirmDelete', 'Are you sure you want to delete this intervention? This action cannot be undone.'))) {
      return
    }
    setActionLoading('delete')
    try {
      await interventionsApi.delete(id)
      navigate('/interventions')
    } catch (err: any) {
      alert(err.message || 'Failed to delete intervention')
    } finally {
      setActionLoading(null)
    }
  }

  // Get available actions based on status
  const availableActions = useMemo(() => {
    if (!intervention) return []
    const actions = []

    if (intervention.status === 'SCHEDULED') {
      actions.push({ id: 'start', label: t('interventions.actions.start', 'Start Intervention'), icon: Play, color: 'text-green-600', handler: handleStart })
      actions.push({ id: 'reschedule', label: t('interventions.actions.reschedule', 'Reschedule'), icon: CalendarClock, color: 'text-purple-600', handler: () => setShowRescheduleModal(true) })
      actions.push({ id: 'cancel', label: t('interventions.actions.cancel', 'Cancel'), icon: XCircle, color: 'text-red-600', handler: handleCancel })
    } else if (intervention.status === 'IN_PROGRESS') {
      actions.push({ id: 'complete', label: t('interventions.actions.complete', 'Complete'), icon: CheckCircle2, color: 'text-green-600', handler: handleComplete })
      actions.push({ id: 'cancel', label: t('interventions.actions.cancel', 'Cancel'), icon: XCircle, color: 'text-red-600', handler: handleCancel })
    }

    return actions
  }, [intervention, t])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (error || !intervention) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {t('interventions.details.notFound', 'Intervention Not Found')}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {error || t('interventions.details.notFoundDesc', 'The intervention you are looking for does not exist.')}
          </p>
          <button
            onClick={() => navigate('/interventions')}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            {t('interventions.details.backToList', 'Back to Interventions')}
          </button>
        </div>
      </div>
    )
  }

  const status = statusConfig[intervention.status]
  const StatusIcon = status.icon

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Left: Back + Title */}
            <div className="flex items-start gap-4">
              <button
                onClick={() => navigate('/interventions')}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {intervention.interventionCode}
                  </h1>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${status.bgColor} ${status.color}`}>
                    <StatusIcon className="h-4 w-4" />
                    {t(`interventions.status.${intervention.status}`, status.label)}
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {site?.name || intervention.siteId}
                </p>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
              {/* Primary Actions */}
              {availableActions.length > 0 && (
                <>
                  {availableActions[0] && (
                    <button
                      onClick={availableActions[0].handler}
                      disabled={actionLoading !== null}
                      className={`flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50`}
                    >
                      {actionLoading === availableActions[0].id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        (() => {
                          const Icon = availableActions[0].icon
                          return <Icon className="h-4 w-4" />
                        })()
                      )}
                      {availableActions[0].label}
                    </button>
                  )}

                  {/* More Actions */}
                  {availableActions.length > 1 && (
                    <div className="relative">
                      <button
                        onClick={() => setShowActionMenu(!showActionMenu)}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <MoreVertical className="h-5 w-5" />
                      </button>
                      {showActionMenu && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setShowActionMenu(false)}
                          />
                          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20 py-1">
                            {availableActions.slice(1).map((action) => (
                              <button
                                key={action.id}
                                onClick={() => {
                                  setShowActionMenu(false)
                                  action.handler()
                                }}
                                disabled={actionLoading !== null}
                                className={`w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${action.color}`}
                              >
                                <action.icon className="h-4 w-4" />
                                {action.label}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Edit Button */}
              <Link
                to={`/interventions/${intervention.id}/edit`}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors"
              >
                <Edit className="h-4 w-4" />
                {t('interventions.details.edit', 'Edit')}
              </Link>

              {/* Delete Button */}
              {intervention.status === 'SCHEDULED' && (
                <button
                  onClick={handleDelete}
                  disabled={actionLoading === 'delete'}
                  className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  {actionLoading === 'delete' ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Trash2 className="h-5 w-5" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-8 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-1 py-4 border-b-2 text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {t(tab.labelKey, tab.id)}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Schedule Card */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  {t('interventions.details.schedule', 'Schedule')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                      {t('interventions.details.scheduledDate', 'Scheduled Date')}
                    </p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatDate(intervention.scheduledDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                      {t('interventions.details.time', 'Time')}
                    </p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatTime(intervention.scheduledStartTime)} - {formatTime(intervention.scheduledEndTime)}
                    </p>
                  </div>
                  {intervention.actualStartTime && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                        {t('interventions.details.actualStart', 'Actual Start')}
                      </p>
                      <p className="font-medium text-green-600 dark:text-green-400">
                        {formatTime(intervention.actualStartTime)}
                      </p>
                    </div>
                  )}
                  {intervention.actualEndTime && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                        {t('interventions.details.actualEnd', 'Actual End')}
                      </p>
                      <p className="font-medium text-green-600 dark:text-green-400">
                        {formatTime(intervention.actualEndTime)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes Card */}
              {intervention.notes && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-gray-400" />
                    {t('interventions.details.notes', 'Notes & Instructions')}
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {intervention.notes}
                  </p>
                </div>
              )}

              {/* GPS Check-in/out Card */}
              {(intervention.gpsCheckInLat || intervention.gpsCheckOutLat) && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Navigation className="h-5 w-5 text-gray-400" />
                    {t('interventions.details.gps', 'GPS Location')}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {intervention.gpsCheckInLat && (
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <p className="text-sm text-green-700 dark:text-green-300 font-medium mb-1">
                          {t('interventions.details.checkIn', 'Check-in Location')}
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-400">
                          {intervention.gpsCheckInLat}, {intervention.gpsCheckInLng}
                        </p>
                      </div>
                    )}
                    {intervention.gpsCheckOutLat && (
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-sm text-blue-700 dark:text-blue-300 font-medium mb-1">
                          {t('interventions.details.checkOut', 'Check-out Location')}
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-400">
                          {intervention.gpsCheckOutLat}, {intervention.gpsCheckOutLng}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Quality Score Card */}
              {(intervention.qualityScore !== undefined || intervention.clientRating !== undefined) && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Star className="h-5 w-5 text-gray-400" />
                    {t('interventions.details.quality', 'Quality & Rating')}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {intervention.qualityScore !== undefined && (
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                          {t('interventions.details.qualityScore', 'Quality Score')}
                        </p>
                        <div className="flex items-center gap-2">
                          <div className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                            {intervention.qualityScore}%
                          </div>
                          <div className="flex-1 h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary-600 rounded-full"
                              style={{ width: `${intervention.qualityScore}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                    {intervention.clientRating !== undefined && (
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                          {t('interventions.details.clientRating', 'Client Rating')}
                        </p>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-6 w-6 ${
                                star <= (intervention.clientRating || 0)
                                  ? 'text-yellow-400 fill-yellow-400'
                                  : 'text-gray-300 dark:text-gray-600'
                              }`}
                            />
                          ))}
                          <span className="ml-2 text-lg font-medium text-gray-900 dark:text-white">
                            {intervention.clientRating}/5
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Site Info Card */}
              {site && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-gray-400" />
                    {t('interventions.details.site', 'Site')}
                  </h3>
                  <div className="space-y-3">
                    <Link
                      to={`/sites/view/${site.id}`}
                      className="block p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{site.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{site.address}</p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      </div>
                    </Link>
                  </div>
                </div>
              )}

              {/* Quick Stats Card */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {t('interventions.details.quickInfo', 'Quick Info')}
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {t('interventions.details.agents', 'Agents')}
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {agents.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {t('interventions.details.duration', 'Duration')}
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {(() => {
                        if (!intervention.scheduledStartTime || !intervention.scheduledEndTime) return '-'
                        const [sh, sm] = intervention.scheduledStartTime.split(':').map(Number)
                        const [eh, em] = intervention.scheduledEndTime.split(':').map(Number)
                        const duration = (eh * 60 + em) - (sh * 60 + sm)
                        const hours = Math.floor(duration / 60)
                        const mins = duration % 60
                        return `${hours}h ${mins > 0 ? `${mins}m` : ''}`
                      })()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {t('interventions.details.photos', 'Photos')}
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {intervention.photoUrls?.length || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Team Tab */}
        {activeTab === 'team' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              {t('interventions.details.assignedTeam', 'Assigned Team')}
            </h3>
            {agents.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                {t('interventions.details.noAgents', 'No agents assigned to this intervention')}
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {agents.map((agent) => (
                  <div
                    key={agent.id}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {`${agent.firstName || ''} ${agent.lastName || ''}`.trim() || agent.email}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-1">
                          <Mail className="h-3.5 w-3.5" />
                          <span className="truncate">{agent.email}</span>
                        </div>
                        {agent.phone && (
                          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-1">
                            <Phone className="h-3.5 w-3.5" />
                            <span>{agent.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Photos Tab */}
        {activeTab === 'photos' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              {t('interventions.details.interventionPhotos', 'Intervention Photos')}
            </h3>
            {!intervention.photoUrls?.length ? (
              <div className="text-center py-12">
                <Image className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  {t('interventions.details.noPhotos', 'No photos have been uploaded for this intervention')}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {intervention.photoUrls.map((url, index) => (
                  <a
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 hover:opacity-80 transition-opacity"
                  >
                    <img
                      src={url}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              {t('interventions.details.activityHistory', 'Activity History')}
            </h3>
            <div className="space-y-4">
              {/* Timeline placeholder - would be populated from audit logs */}
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 bg-primary-600 rounded-full" />
                  <div className="w-0.5 h-full bg-gray-200 dark:bg-gray-700" />
                </div>
                <div className="pb-8">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {t('interventions.details.created', 'Intervention Created')}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {intervention.createdAt ? new Date(intervention.createdAt).toLocaleString() : '-'}
                  </p>
                </div>
              </div>
              {intervention.status !== 'SCHEDULED' && (
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full ${
                      intervention.status === 'COMPLETED' ? 'bg-green-500' :
                      intervention.status === 'CANCELLED' ? 'bg-red-500' :
                      intervention.status === 'IN_PROGRESS' ? 'bg-yellow-500' :
                      'bg-purple-500'
                    }`} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {t(`interventions.status.${intervention.status}`, status.label)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {intervention.updatedAt ? new Date(intervention.updatedAt).toLocaleString() : '-'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Reschedule Modal */}
      {showRescheduleModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowRescheduleModal(false)} />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {t('interventions.details.rescheduleTitle', 'Reschedule Intervention')}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('interventions.form.date', 'New Date')}
                  </label>
                  <input
                    type="date"
                    value={rescheduleData.newDate}
                    onChange={(e) => setRescheduleData(prev => ({ ...prev, newDate: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('interventions.form.startTime', 'Start Time')}
                    </label>
                    <input
                      type="time"
                      value={rescheduleData.newStartTime}
                      onChange={(e) => setRescheduleData(prev => ({ ...prev, newStartTime: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('interventions.form.endTime', 'End Time')}
                    </label>
                    <input
                      type="time"
                      value={rescheduleData.newEndTime}
                      onChange={(e) => setRescheduleData(prev => ({ ...prev, newEndTime: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('interventions.details.rescheduleReason', 'Reason')}
                  </label>
                  <textarea
                    value={rescheduleData.reason}
                    onChange={(e) => setRescheduleData(prev => ({ ...prev, reason: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder={t('interventions.details.rescheduleReasonPlaceholder', 'Why is this intervention being rescheduled?')}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowRescheduleModal(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  {t('common.cancel', 'Cancel')}
                </button>
                <button
                  onClick={handleReschedule}
                  disabled={!rescheduleData.newDate || !rescheduleData.newStartTime || !rescheduleData.newEndTime || actionLoading === 'reschedule'}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {actionLoading === 'reschedule' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    t('interventions.actions.reschedule', 'Reschedule')
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default InterventionDetailsPage
