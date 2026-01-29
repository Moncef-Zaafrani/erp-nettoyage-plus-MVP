import { useState, useEffect } from 'react'
import { useAuth, UserRole } from '@/contexts/AuthContext'
import { useTranslation } from 'react-i18next'
import { 
  Users, 
  Building2, 
  FileText, 
  MapPin, 
  Calendar, 
  ClipboardCheck,
  Clock,
  Sparkles,
  Activity,
  Package,
  Receipt,
  BarChart3,
  MessageSquare,
  Flag,
} from 'lucide-react'
import { auditApi, AuditLog } from '@/services/api'

// Import new dashboard components
import { NotesWidget } from '@/components/dashboard/NotesWidget'
import { ShiftStatusCard } from '@/components/dashboard/ShiftStatusCard'
import { AttendanceCalendar } from '@/components/dashboard/AttendanceCalendar'
import { ReportIssueModal } from '@/components/dashboard/ReportIssueModal'
import { CompactTimer } from '@/components/dashboard/CompactTimer'

// ============ Color Classes ============
const colorClasses: Record<string, { bg: string; icon: string; gradient: string }> = {
  blue: { bg: 'bg-blue-50 dark:bg-blue-900/30', icon: 'text-blue-600 dark:text-blue-400', gradient: 'from-blue-500 to-indigo-600' },
  green: { bg: 'bg-green-50 dark:bg-green-900/30', icon: 'text-green-600 dark:text-green-400', gradient: 'from-green-500 to-emerald-600' },
  purple: { bg: 'bg-purple-50 dark:bg-purple-900/30', icon: 'text-purple-600 dark:text-purple-400', gradient: 'from-purple-500 to-violet-600' },
  orange: { bg: 'bg-orange-50 dark:bg-orange-900/30', icon: 'text-orange-600 dark:text-orange-400', gradient: 'from-orange-500 to-amber-600' },
  teal: { bg: 'bg-teal-50 dark:bg-teal-900/30', icon: 'text-teal-600 dark:text-teal-400', gradient: 'from-teal-500 to-cyan-600' },
  red: { bg: 'bg-red-50 dark:bg-red-900/30', icon: 'text-red-600 dark:text-red-400', gradient: 'from-red-500 to-rose-600' },
}

// ============ Coming Soon Features ============
interface ComingSoonFeature {
  icon: React.ComponentType<{ className?: string }>
  titleKey: string
  descriptionKey: string
  color: string
  phase: number
}

const getComingSoonFeatures = (role: UserRole): ComingSoonFeature[] => {
  const common: ComingSoonFeature[] = [
    { icon: BarChart3, titleKey: 'dashboard.coming.reports', descriptionKey: 'dashboard.coming.reportsDesc', color: 'blue', phase: 2 },
  ]

  switch (role) {
    case 'SUPER_ADMIN':
    case 'ADMIN':
      return [
        { icon: Package, titleKey: 'dashboard.coming.stock', descriptionKey: 'dashboard.coming.stockDesc', color: 'purple', phase: 2 },
        { icon: Receipt, titleKey: 'dashboard.coming.billing', descriptionKey: 'dashboard.coming.billingDesc', color: 'green', phase: 2 },
        ...common,
      ]
    case 'SUPERVISOR':
      return [
        { icon: ClipboardCheck, titleKey: 'dashboard.coming.quality', descriptionKey: 'dashboard.coming.qualityDesc', color: 'teal', phase: 2 },
        { icon: Calendar, titleKey: 'dashboard.coming.planning', descriptionKey: 'dashboard.coming.planningDesc', color: 'orange', phase: 1 },
        ...common,
      ]
    case 'AGENT':
      return [
        { icon: Clock, titleKey: 'dashboard.coming.timeTracking', descriptionKey: 'dashboard.coming.timeTrackingDesc', color: 'blue', phase: 2 },
        { icon: ClipboardCheck, titleKey: 'dashboard.coming.checklists', descriptionKey: 'dashboard.coming.checklistsDesc', color: 'green', phase: 1 },
        ...common,
      ]
    case 'CLIENT':
      return [
        { icon: MessageSquare, titleKey: 'dashboard.coming.feedback', descriptionKey: 'dashboard.coming.feedbackDesc', color: 'purple', phase: 2 },
        { icon: Receipt, titleKey: 'dashboard.coming.invoices', descriptionKey: 'dashboard.coming.invoicesDesc', color: 'blue', phase: 2 },
        ...common,
      ]
    default:
      return common
  }
}

// ============ Activity Feed ============
function ActivityFeed() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user?.role !== 'SUPER_ADMIN') {
      setLoading(false)
      return
    }

    const fetchLogs = async () => {
      try {
        const data = await auditApi.getRecentLogs(10)
        setLogs(data)
      } catch (err) {
        setError('Failed to load activity')
        console.error('Failed to fetch audit logs:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchLogs()
  }, [user?.role])

  if (user?.role !== 'SUPER_ADMIN') {
    return null
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (seconds < 60) return t('time.justNow', 'Just now')
    if (seconds < 3600) return t('time.minutesAgo', '{{count}} min ago', { count: Math.floor(seconds / 60) })
    if (seconds < 86400) return t('time.hoursAgo', '{{count}} hr ago', { count: Math.floor(seconds / 3600) })
    return t('time.daysAgo', '{{count}} days ago', { count: Math.floor(seconds / 86400) })
  }

  const getActionBadge = (action: string) => {
    const styles: Record<string, string> = {
      CREATE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      UPDATE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      DELETE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      LOGIN: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      STATUS_CHANGE: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    }
    return styles[action] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700/50">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
            <Activity className="h-4 w-4 text-white" />
          </div>
          <h2 className="font-semibold text-gray-900 dark:text-white">
            {t('dashboard.systemActivity', 'System Activity')}
          </h2>
        </div>
        <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
          {t('dashboard.liveAudit', 'Live')}
        </span>
      </div>

      <div className="p-2">
        {loading ? (
          <div className="space-y-2 p-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 p-2 animate-pulse">
                <div className="h-8 w-8 rounded-lg bg-gray-200 dark:bg-gray-700" />
                <div className="flex-1">
                  <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700 mb-1" />
                  <div className="h-3 w-1/4 rounded bg-gray-100 dark:bg-gray-800" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <p className="text-sm text-red-500 p-4">{error}</p>
        ) : logs.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
            {t('dashboard.noActivity', 'No recent activity')}
          </p>
        ) : (
          <div className="space-y-1 max-h-80 overflow-y-auto">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-semibold text-gray-600 dark:text-gray-400">
                  {log.actor?.firstName?.[0] || 'S'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {log.actor?.firstName || 'System'}
                    </span>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${getActionBadge(log.action)}`}>
                      {log.action}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {log.description || `${log.entityType}`}
                  </p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                    {formatTimeAgo(log.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ============ Main Dashboard ============
export default function DashboardPage() {
  const { t } = useTranslation()
  const { user } = useAuth()

  const [showReportModal, setShowReportModal] = useState(false)

  if (!user) return null

  const comingSoonFeatures = getComingSoonFeatures(user.role)
  const showShiftWidget = user.role === 'ADMIN' || user.role === 'SUPERVISOR' || user.role === 'AGENT'

  const getRoleBadgeStyle = (role: string) => {
    const styles: Record<string, string> = {
      SUPER_ADMIN: 'bg-gradient-to-r from-purple-500 to-violet-600 text-white shadow-lg shadow-purple-500/25',
      ADMIN: 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25',
      SUPERVISOR: 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-lg shadow-teal-500/25',
      AGENT: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/25',
      CLIENT: 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/25',
    }
    return styles[role] || 'bg-gray-100 text-gray-800'
  }

  const getQuickNavItems = (role: UserRole) => {
    switch (role) {
      case 'SUPER_ADMIN':
      case 'ADMIN':
        return [
          { icon: Users, label: t('nav.users', 'Users'), href: '/users', color: 'blue' },
          { icon: Building2, label: t('nav.clients', 'Clients'), href: '/clients', color: 'green' },
          { icon: FileText, label: t('nav.contracts', 'Contracts'), href: '/contracts', color: 'purple' },
          { icon: MapPin, label: t('nav.sites', 'Sites'), href: '/sites', color: 'orange' },
        ]
      case 'SUPERVISOR':
        return [
          { icon: Users, label: t('nav.myAgents', 'My Agents'), href: '/my-agents', color: 'blue' },
          { icon: MapPin, label: t('nav.sites', 'Sites'), href: '/sites', color: 'green' },
          { icon: Calendar, label: t('nav.planning', 'Planning'), href: '/planning', color: 'purple' },
        ]
      case 'AGENT':
        return [
          { icon: Calendar, label: t('nav.mySchedule', 'My Schedule'), href: '/my-schedule', color: 'blue' },
          { icon: ClipboardCheck, label: t('nav.myMissions', 'My Missions'), href: '/my-missions', color: 'green' },
        ]
      case 'CLIENT':
        return [
          { icon: FileText, label: t('nav.myContracts', 'My Contracts'), href: '/my-contracts', color: 'blue' },
          { icon: MapPin, label: t('nav.mySites', 'My Sites'), href: '/my-sites', color: 'green' },
        ]
      default:
        return []
    }
  }

  const quickNavItems = getQuickNavItems(user.role)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Report Modal */}
      <ReportIssueModal isOpen={showReportModal} onClose={() => setShowReportModal(false)} />

      {/* Compact Timer (floating widget) */}
      <CompactTimer />

      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Welcome Header */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
              {t('dashboard.welcome', 'Welcome back')}, {user.firstName}
            </h1>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getRoleBadgeStyle(user.role)}`}>
              {t(`roles.${user.role}`, user.role)}
            </span>
          </div>
          <p className="text-gray-500 dark:text-gray-400">
            {t('dashboard.subtitleSimple', 'Your workspace is ready.')}
          </p>
        </div>

        {/* Main Grid - 3 column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          {/* Left Column - Shift & Quick Nav */}
          <div className="lg:col-span-4 space-y-6">
            {/* Shift Status */}
            {showShiftWidget && <ShiftStatusCard />}
            
            {/* Quick Navigation */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
              <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 mb-4 uppercase tracking-wider">
                {t('dashboard.quickNav', 'Quick Navigation')}
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {quickNavItems.map((item, index) => {
                  const Icon = item.icon
                  const colors = colorClasses[item.color]
                  return (
                    <a
                      key={index}
                      href={item.href}
                      className="group flex flex-col items-center gap-2 rounded-xl border border-gray-100 bg-gray-50/50 p-3 transition-all hover:shadow-md hover:border-gray-200 hover:-translate-y-0.5 dark:border-gray-700 dark:bg-gray-800/50 dark:hover:border-gray-600"
                    >
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${colors.gradient} shadow-lg group-hover:scale-110 transition-transform`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400 text-center">{item.label}</span>
                    </a>
                  )
                })}
              </div>

              {/* Report Issue Button */}
              <button
                onClick={() => setShowReportModal(true)}
                className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 dark:border-red-800/50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
              >
                <Flag className="h-4 w-4" />
                {t('dashboard.reportIssue', 'Report Issue')}
              </button>
            </div>
          </div>

          {/* Center Column - Calendar & Activity */}
          <div className="lg:col-span-5 space-y-6">
            {/* Attendance Calendar */}
            <AttendanceCalendar />

            {/* Activity Feed (Super Admin only) */}
            <ActivityFeed />
          </div>

          {/* Right Column - Notes */}
          <div className="lg:col-span-3 space-y-6">
            <NotesWidget />
          </div>
        </div>

        {/* Coming Soon Section */}
        {comingSoonFeatures.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 mb-3 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5" />
              {t('dashboard.comingSoon', 'Coming Soon')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {comingSoonFeatures.map((feature, index) => {
                const Icon = feature.icon
                const colors = colorClasses[feature.color]
                return (
                  <div
                    key={index}
                    className="group rounded-xl border border-dashed border-gray-300 bg-gray-50/50 p-4 dark:border-gray-600 dark:bg-gray-800/30 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors.bg} opacity-75 group-hover:opacity-100 transition-opacity`}>
                        <Icon className={`h-5 w-5 ${colors.icon}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors">
                          {t(feature.titleKey, feature.titleKey)}
                        </h3>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                          {t(feature.descriptionKey, feature.descriptionKey)}
                        </p>
                        <span className="inline-flex items-center gap-1 mt-2 text-[10px] text-gray-400 font-medium">
                          <Clock className="h-3 w-3" />
                          Phase {feature.phase}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
