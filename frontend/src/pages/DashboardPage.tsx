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
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react'

// Stats cards for different roles
interface StatCard {
  title: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  color: string
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
}

const getRoleStats = (role: UserRole): StatCard[] => {
  switch (role) {
    case 'SUPER_ADMIN':
    case 'ADMIN':
      return [
        { title: 'Total Users', value: 156, icon: Users, color: 'blue', change: '+12%', changeType: 'positive' },
        { title: 'Active Clients', value: 42, icon: Building2, color: 'green', change: '+5%', changeType: 'positive' },
        { title: 'Active Contracts', value: 38, icon: FileText, color: 'purple', change: '+2', changeType: 'positive' },
        { title: 'Sites', value: 87, icon: MapPin, color: 'orange', change: '+8', changeType: 'positive' },
      ]
    case 'SUPERVISOR':
      return [
        { title: 'Your Agents', value: 12, icon: Users, color: 'blue' },
        { title: 'Sites Today', value: 8, icon: MapPin, color: 'green' },
        { title: 'Pending Tasks', value: 5, icon: ClipboardCheck, color: 'orange', change: '3 urgent', changeType: 'negative' },
        { title: 'Completed Today', value: 24, icon: CheckCircle2, color: 'purple' },
      ]
    case 'AGENT':
      return [
        { title: 'My Missions Today', value: 4, icon: Calendar, color: 'blue' },
        { title: 'Hours This Week', value: '32h', icon: Clock, color: 'green' },
        { title: 'Completed Tasks', value: 18, icon: CheckCircle2, color: 'purple' },
        { title: 'Upcoming', value: 2, icon: TrendingUp, color: 'orange' },
      ]
    case 'CLIENT':
      return [
        { title: 'My Contracts', value: 3, icon: FileText, color: 'blue' },
        { title: 'My Sites', value: 5, icon: MapPin, color: 'green' },
        { title: 'Interventions This Month', value: 42, icon: Calendar, color: 'purple' },
        { title: 'Pending Issues', value: 1, icon: AlertTriangle, color: 'orange' },
      ]
    default:
      return []
  }
}

const colorClasses: Record<string, { bg: string; icon: string }> = {
  blue: { bg: 'bg-blue-50 dark:bg-blue-900/30', icon: 'text-blue-600 dark:text-blue-400' },
  green: { bg: 'bg-green-50 dark:bg-green-900/30', icon: 'text-green-600 dark:text-green-400' },
  purple: { bg: 'bg-purple-50 dark:bg-purple-900/30', icon: 'text-purple-600 dark:text-purple-400' },
  orange: { bg: 'bg-orange-50 dark:bg-orange-900/30', icon: 'text-orange-600 dark:text-orange-400' },
}

export default function DashboardPage() {
  const { t } = useTranslation()
  const { user } = useAuth()

  if (!user) return null

  const stats = getRoleStats(user.role)

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      SUPER_ADMIN: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      ADMIN: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      SUPERVISOR: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
      AGENT: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      CLIENT: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    }
    return colors[role] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Welcome header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('dashboard.welcome', 'Welcome back')}, {user.firstName}!
          </h1>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
            {t(`roles.${user.role}`, user.role)}
          </span>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          {t('dashboard.subtitle', "Here's what's happening today.")}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          const colors = colorClasses[stat.color]
          return (
            <div
              key={index}
              className="rounded-xl border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="flex items-center justify-between">
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${colors.bg}`}>
                  <Icon className={`h-6 w-6 ${colors.icon}`} />
                </div>
                {stat.change && (
                  <span
                    className={`text-sm font-medium ${
                      stat.changeType === 'positive'
                        ? 'text-green-600 dark:text-green-400'
                        : stat.changeType === 'negative'
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {stat.change}
                  </span>
                )}
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{stat.title}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick actions & Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('dashboard.quickActions', 'Quick Actions')}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <button className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 text-left transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700">
              <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {t('dashboard.viewSchedule', 'View Schedule')}
              </span>
            </button>
            <button className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 text-left transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700">
              <ClipboardCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {t('dashboard.viewTasks', 'View Tasks')}
              </span>
            </button>
            <button className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 text-left transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700">
              <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {t('dashboard.manageTeam', 'Manage Team')}
              </span>
            </button>
            <button className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 text-left transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700">
              <FileText className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {t('dashboard.reports', 'Reports')}
              </span>
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('dashboard.recentActivity', 'Recent Activity')}
          </h2>
          <div className="space-y-4">
            {[
              { action: 'Completed cleaning at Site Alpha', time: '2 hours ago', type: 'success' },
              { action: 'New contract assigned: Office Building B', time: '4 hours ago', type: 'info' },
              { action: 'Schedule updated for next week', time: '1 day ago', type: 'info' },
              { action: 'Quality check passed at Site C', time: '2 days ago', type: 'success' },
            ].map((activity, index) => (
              <div key={index} className="flex items-start gap-3">
                <div
                  className={`mt-1 h-2 w-2 rounded-full ${
                    activity.type === 'success' ? 'bg-green-500' : 'bg-blue-500'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 dark:text-white truncate">{activity.action}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
