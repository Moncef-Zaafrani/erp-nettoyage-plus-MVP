import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth, UserRole } from '@/contexts/AuthContext'
import { useTranslation } from 'react-i18next'
import { 
  Clock,
  Sparkles,
  Activity,
  Package,
  Receipt,
  BarChart3,
  MessageSquare,
  Calendar,
  ClipboardCheck,
} from 'lucide-react'
import { auditApi, AuditLog } from '@/services/api'
import { useToast } from '@/components/ui/Toast'

// Import new dashboard components
import { NotesWidget } from '@/components/dashboard/NotesWidget'
import { ShiftStatusCard } from '@/components/dashboard/ShiftStatusCard'
import { AttendanceCalendar } from '@/components/dashboard/AttendanceCalendar'
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

// ============ Activity Feed (Super Admin Only) ============
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
  const toast = useToast()

  // Show welcome toast on first visit after login
  useEffect(() => {
    const hasShownWelcome = sessionStorage.getItem('welcomeShown')
    if (!hasShownWelcome && user) {
      toast.success(
        t('dashboard.welcome', 'Welcome back') + `, ${user.firstName}!`,
        t('dashboard.subtitleSimple', 'Your workspace is ready.')
      )
      sessionStorage.setItem('welcomeShown', 'true')
    }
  }, [user, toast, t])

  if (!user) return null

  const comingSoonFeatures = getComingSoonFeatures(user.role)
  
  // Only show employee features for non-clients
  const isEmployee = user.role === 'ADMIN' || user.role === 'SUPERVISOR' || user.role === 'AGENT' || user.role === 'SUPER_ADMIN'
  const showShiftWidget = user.role === 'ADMIN' || user.role === 'SUPERVISOR' || user.role === 'AGENT'

  // Client-specific - redirect to their sites page
  if (user.role === 'CLIENT') {
    return <Navigate to="/my-sites" replace />
  }

  // Employee dashboard (ADMIN, SUPERVISOR, AGENT, SUPER_ADMIN)
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Compact Timer (floating widget) - only for employees */}
      {isEmployee && <CompactTimer />}

      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Main Grid - 2 column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Left Column - Shift Status & Notes */}
          <div className="space-y-6">
            {/* Shift Status */}
            {showShiftWidget && <ShiftStatusCard />}
            
            {/* Notes Widget */}
            <NotesWidget />
          </div>

          {/* Right Column - Calendar & Activity */}
          <div className="space-y-6">
            {/* Attendance Calendar - only for shift workers */}
            {showShiftWidget && <AttendanceCalendar />}

            {/* Activity Feed (Super Admin only) */}
            <ActivityFeed />
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
