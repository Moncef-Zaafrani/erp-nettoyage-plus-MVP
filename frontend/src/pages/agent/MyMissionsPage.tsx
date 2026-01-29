import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  PlayCircle,
  XCircle,
  RefreshCw,
  ChevronRight,
  Navigation,
  AlertCircle,
  Loader2,
  CalendarDays,
  ClipboardList,
} from 'lucide-react'
import {
  interventionsApi,
  Intervention,
  InterventionStatus,
} from '@/services/api'
import { useAuth } from '@/contexts/AuthContext'

// Status configuration with colors and icons
const statusConfig: Record<InterventionStatus, { 
  label: string
  color: string
  bgColor: string
  borderColor: string
  icon: React.ElementType
}> = {
  SCHEDULED: {
    label: 'Scheduled',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/30',
    borderColor: 'border-blue-200 dark:border-blue-800',
    icon: Clock,
  },
  IN_PROGRESS: {
    label: 'In Progress',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-900/30',
    borderColor: 'border-amber-200 dark:border-amber-800',
    icon: PlayCircle,
  },
  COMPLETED: {
    label: 'Completed',
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/30',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
    icon: CheckCircle2,
  },
  CANCELLED: {
    label: 'Cancelled',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-900/30',
    borderColor: 'border-red-200 dark:border-red-800',
    icon: XCircle,
  },
  RESCHEDULED: {
    label: 'Rescheduled',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-900/30',
    borderColor: 'border-purple-200 dark:border-purple-800',
    icon: RefreshCw,
  },
}

// Date tabs
const dateTabs = [
  { id: 'today', labelKey: 'missions.tabs.today' },
  { id: 'tomorrow', labelKey: 'missions.tabs.tomorrow' },
  { id: 'week', labelKey: 'missions.tabs.week' },
  { id: 'all', labelKey: 'missions.tabs.all' },
]

export function MyMissionsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()

  // State
  const [missions, setMissions] = useState<Intervention[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('today')
  const [refreshing, setRefreshing] = useState(false)

  // Load missions
  const loadMissions = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)

    try {
      const data = await interventionsApi.getAll({
        agentId: user?.id,
        sortBy: 'scheduledDate',
        sortOrder: 'ASC',
      })
      setMissions(Array.isArray(data) ? data : data.data || [])
    } catch (err: any) {
      setError(err.message || t('missions.loadError', 'Failed to load missions'))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (user?.id) {
      loadMissions()
    }
  }, [user?.id])

  // Filter missions by date tab
  const filteredMissions = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const weekEnd = new Date(today)
    weekEnd.setDate(weekEnd.getDate() + 7)

    return missions.filter((m) => {
      const missionDate = new Date(m.scheduledDate)
      missionDate.setHours(0, 0, 0, 0)

      switch (activeTab) {
        case 'today':
          return missionDate.getTime() === today.getTime()
        case 'tomorrow':
          return missionDate.getTime() === tomorrow.getTime()
        case 'week':
          return missionDate >= today && missionDate < weekEnd
        default:
          return true
      }
    })
  }, [missions, activeTab])

  // Stats for today
  const todayStats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    const todayMissions = missions.filter((m) => m.scheduledDate === today)
    return {
      total: todayMissions.length,
      completed: todayMissions.filter((m) => m.status === 'COMPLETED').length,
      inProgress: todayMissions.filter((m) => m.status === 'IN_PROGRESS').length,
      scheduled: todayMissions.filter((m) => m.status === 'SCHEDULED').length,
    }
  }, [missions])

  // Current/Next mission
  const activeMission = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    // First check for in-progress
    const inProgress = missions.find(
      (m) => m.scheduledDate === today && m.status === 'IN_PROGRESS'
    )
    if (inProgress) return { mission: inProgress, type: 'current' }

    // Then find next scheduled
    const now = new Date()
    const scheduled = missions
      .filter((m) => m.status === 'SCHEDULED')
      .sort((a, b) => {
        const dateA = new Date(`${a.scheduledDate}T${a.scheduledStartTime}`)
        const dateB = new Date(`${b.scheduledDate}T${b.scheduledStartTime}`)
        return dateA.getTime() - dateB.getTime()
      })
      .find((m) => {
        const start = new Date(`${m.scheduledDate}T${m.scheduledStartTime}`)
        return start >= now
      })

    if (scheduled) return { mission: scheduled, type: 'next' }
    return null
  }, [missions])

  // Format time
  const formatTime = (time: string | null) => {
    if (!time) return '--:--'
    return time.slice(0, 5)
  }

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.toDateString() === today.toDateString()) {
      return t('missions.today', 'Today')
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return t('missions.tomorrow', 'Tomorrow')
    }
    return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
  }

  // Handle mission actions
  const handleStartMission = async (id: string) => {
    try {
      await interventionsApi.start(id)
      loadMissions(true)
    } catch (err: any) {
      alert(err.message || 'Failed to start mission')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary-600 mx-auto" />
          <p className="mt-3 text-gray-500 dark:text-gray-400">
            {t('missions.loading', 'Loading your missions...')}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24 lg:pb-8">
      {/* Mobile Header */}
      <div className="sticky top-0 z-20 bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-700 dark:to-primary-800 text-white px-4 pt-6 pb-20 lg:pb-6">
        <div className="max-w-4xl mx-auto">
          {/* Greeting */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-primary-100 text-sm">
                {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
              <h1 className="text-xl font-bold">
                {t('missions.greeting', 'Hello')}, {user?.firstName || user?.email?.split('@')[0]}! 👋
              </h1>
            </div>
            <button
              onClick={() => loadMissions(true)}
              disabled={refreshing}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Today's Stats - Mobile Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <div className="text-2xl font-bold">{todayStats.total}</div>
              <div className="text-xs text-primary-100">{t('missions.stats.total', 'Total')}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-emerald-300">{todayStats.completed}</div>
              <div className="text-xs text-primary-100">{t('missions.stats.completed', 'Done')}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-amber-300">{todayStats.inProgress + todayStats.scheduled}</div>
              <div className="text-xs text-primary-100">{t('missions.stats.pending', 'Pending')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Content - Overlaps Header */}
      <div className="max-w-4xl mx-auto px-4 -mt-12 lg:mt-0 relative z-10">
        {/* Active Mission Card */}
        {activeMission && (
          <div
            className={`mb-6 rounded-2xl shadow-lg overflow-hidden ${
              activeMission.type === 'current'
                ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white'
                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
            }`}
          >
            <div className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-medium uppercase tracking-wide ${
                  activeMission.type === 'current' ? 'text-amber-100' : 'text-primary-600 dark:text-primary-400'
                }`}>
                  {activeMission.type === 'current'
                    ? t('missions.currentMission', '🔴 Current Mission')
                    : t('missions.nextMission', '⏰ Next Mission')
                  }
                </span>
                <span className={`text-sm font-mono ${
                  activeMission.type === 'current' ? 'text-amber-100' : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {activeMission.mission.interventionCode}
                </span>
              </div>

              <h3 className={`text-lg font-bold mb-2 ${
                activeMission.type === 'current' ? 'text-white' : 'text-gray-900 dark:text-white'
              }`}>
                {activeMission.mission.site?.name || t('missions.unknownSite', 'Unknown Site')}
              </h3>

              <div className={`flex items-center gap-4 text-sm mb-4 ${
                activeMission.type === 'current' ? 'text-amber-100' : 'text-gray-500 dark:text-gray-400'
              }`}>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {formatTime(activeMission.mission.scheduledStartTime)} - {formatTime(activeMission.mission.scheduledEndTime)}
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  {activeMission.mission.site?.address?.split(',')[0] || t('missions.noAddress', 'No address')}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                {activeMission.type === 'current' ? (
                  <>
                    <button
                      onClick={() => navigate(`/my-missions/${activeMission.mission.id}`)}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/20 hover:bg-white/30 rounded-xl font-medium transition-colors"
                    >
                      <ClipboardList className="h-5 w-5" />
                      {t('missions.viewDetails', 'Details')}
                    </button>
                    <button
                      onClick={() => navigate(`/my-missions/${activeMission.mission.id}`)}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-white text-amber-600 rounded-xl font-medium hover:bg-amber-50 transition-colors"
                    >
                      <Navigation className="h-5 w-5" />
                      {t('missions.checkIn', 'Check In')}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => navigate(`/my-missions/${activeMission.mission.id}`)}
                      className="flex-1 flex items-center justify-center gap-2 py-3 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <ClipboardList className="h-5 w-5" />
                      {t('missions.viewDetails', 'Details')}
                    </button>
                    <button
                      onClick={() => handleStartMission(activeMission.mission.id)}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-colors"
                    >
                      <PlayCircle className="h-5 w-5" />
                      {t('missions.startMission', 'Start')}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Date Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-none">
          {dateTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
              }`}
            >
              {t(tab.labelKey, tab.id)}
            </button>
          ))}
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Mission List */}
        {filteredMissions.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center border border-gray-200 dark:border-gray-700">
            <CalendarDays className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {t('missions.noMissions', 'No missions')}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {activeTab === 'today'
                ? t('missions.noMissionsToday', "You don't have any missions scheduled for today.")
                : t('missions.noMissionsFound', 'No missions found for the selected period.')
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMissions.map((mission) => {
              const status = statusConfig[mission.status]
              const StatusIcon = status.icon
              const isToday = mission.scheduledDate === new Date().toISOString().split('T')[0]

              return (
                <div
                  key={mission.id}
                  onClick={() => navigate(`/my-missions/${mission.id}`)}
                  className={`bg-white dark:bg-gray-800 rounded-xl border ${status.borderColor} overflow-hidden cursor-pointer hover:shadow-md transition-all group`}
                >
                  {/* Status Strip */}
                  <div className={`h-1 ${status.bgColor.replace('bg-', 'bg-').replace('-50', '-400').replace('-900/30', '-500')}`} />

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        {/* Site Name */}
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate mb-1">
                          {mission.site?.name || t('missions.unknownSite', 'Unknown Site')}
                        </h3>

                        {/* Address */}
                        <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 mb-2">
                          <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                          <span className="truncate">
                            {mission.site?.address || t('missions.noAddress', 'No address')}
                          </span>
                        </div>

                        {/* Time & Status */}
                        <div className="flex items-center gap-3 flex-wrap">
                          {/* Date Badge (if not today) */}
                          {!isToday && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs font-medium">
                              <Calendar className="h-3 w-3" />
                              {formatDate(mission.scheduledDate)}
                            </span>
                          )}

                          {/* Time */}
                          <span className="inline-flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
                            <Clock className="h-3.5 w-3.5" />
                            {formatTime(mission.scheduledStartTime)} - {formatTime(mission.scheduledEndTime)}
                          </span>

                          {/* Status Badge */}
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.bgColor} ${status.color}`}>
                            <StatusIcon className="h-3 w-3" />
                            {t(`interventions.status.${mission.status}`, status.label)}
                          </span>
                        </div>
                      </div>

                      {/* Arrow */}
                      <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-primary-600 transition-colors flex-shrink-0 mt-1" />
                    </div>

                    {/* Quick Actions (for scheduled missions) */}
                    {mission.status === 'SCHEDULED' && isToday && (
                      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleStartMission(mission.id)
                          }}
                          className="w-full flex items-center justify-center gap-2 py-2 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-lg text-sm font-medium hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
                        >
                          <PlayCircle className="h-4 w-4" />
                          {t('missions.startMission', 'Start Mission')}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Mobile Bottom Nav Spacer - handled by MainLayout */}
    </div>
  )
}

export default MyMissionsPage
