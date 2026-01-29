import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Edit,
  Key,
  Archive,
  RotateCcw,
  Shield,
  UserCog,
  UserCheck,
  Building2,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  User as UserIcon,
  Briefcase,
  Languages,
  Award,
  Settings,
  Activity,
  MoreVertical,
} from 'lucide-react'
import { usersApi, User } from '@/services/api'
import { useAuth } from '@/contexts/AuthContext'

// Tab configuration
type TabId = 'overview' | 'employment' | 'skills' | 'activity' | 'settings'
const tabs: { id: TabId; labelKey: string; icon: React.ElementType }[] = [
  { id: 'overview', labelKey: 'users.details.tabs.overview', icon: UserIcon },
  { id: 'employment', labelKey: 'users.details.tabs.employment', icon: Briefcase },
  { id: 'skills', labelKey: 'users.details.tabs.skills', icon: Award },
  { id: 'activity', labelKey: 'users.details.tabs.activity', icon: Activity },
  { id: 'settings', labelKey: 'users.details.tabs.settings', icon: Settings },
]

// Role badge configuration
const roleBadges = {
  SUPER_ADMIN: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', icon: Shield },
  ADMIN: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', icon: Shield },
  SUPERVISOR: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', icon: UserCog },
  AGENT: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', icon: UserCheck },
  CLIENT: { bg: 'bg-gray-100 dark:bg-gray-900/30', text: 'text-gray-700 dark:text-gray-300', icon: Building2 },
}

// Status badge configuration
const statusBadges = {
  ACTIVE: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', icon: CheckCircle },
  INACTIVE: { bg: 'bg-gray-100 dark:bg-gray-900/30', text: 'text-gray-700 dark:text-gray-300', icon: XCircle },
  ARCHIVED: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', icon: Archive },
}

export function UserDetailsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { user: currentUser } = useAuth()
  
  // Role-based access restriction: AGENT and CLIENT cannot view user details
  useEffect(() => {
    if (currentUser?.role === 'AGENT' || currentUser?.role === 'CLIENT') {
      navigate('/dashboard', { replace: true })
    }
  }, [currentUser, navigate])
  
  // State
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [showActionsMenu, setShowActionsMenu] = useState(false)
  
  // Modals
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false)
  const [showArchiveModal, setShowArchiveModal] = useState(false)
  const [resetPasswordMode, setResetPasswordMode] = useState<'temp' | 'link'>('temp')
  const [actionLoading, setActionLoading] = useState(false)
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  
  // Permission checks
  const canEdit = currentUser?.role === 'SUPER_ADMIN' || 
    (currentUser?.role === 'ADMIN' && user?.role !== 'SUPER_ADMIN' && user?.role !== 'ADMIN') ||
    (currentUser?.role === 'SUPERVISOR' && (user?.role === 'AGENT' || user?.role === 'CLIENT'))
  
  const canResetPassword = currentUser?.role === 'SUPER_ADMIN' || 
    (currentUser?.role === 'ADMIN' && user?.role !== 'SUPER_ADMIN' && user?.role !== 'ADMIN')
  
  const canArchive = currentUser?.role === 'SUPER_ADMIN' || 
    (currentUser?.role === 'ADMIN' && user?.role !== 'SUPER_ADMIN' && user?.role !== 'ADMIN')
  
  // Fetch user
  useEffect(() => {
    async function fetchUser() {
      if (!id) return
      
      // Skip if user doesn't have access
      if (currentUser?.role === 'AGENT' || currentUser?.role === 'CLIENT') return
      
      try {
        setLoading(true)
        setError(null)
        const userData = await usersApi.getById(id)
        setUser(userData)
      } catch (err: any) {
        console.error('Failed to fetch user:', err)
        if (err.statusCode === 403) {
          setError(t('users.details.errors.accessDenied', 'You do not have access to view this user'))
        } else if (err.statusCode === 404) {
          setError(t('users.details.errors.notFound', 'User not found'))
        } else {
          setError(err.message || t('users.details.errors.loadFailed', 'Failed to load user'))
        }
      } finally {
        setLoading(false)
      }
    }
    
    fetchUser()
  }, [id, t])
  
  // Reset password handler
  const handleResetPassword = async () => {
    if (!id) return
    
    try {
      setActionLoading(true)
      setActionMessage(null)
      const result = await usersApi.resetPassword(id, resetPasswordMode)
      
      if (resetPasswordMode === 'temp' && result.tempPassword) {
        setTempPassword(result.tempPassword)
        setActionMessage({ type: 'success', text: t('users.details.actions.resetPasswordSuccess', 'Password has been reset') })
      } else {
        setActionMessage({ type: 'success', text: result.message })
        setShowResetPasswordModal(false)
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || t('users.details.actions.resetPasswordError', 'Failed to reset password') })
    } finally {
      setActionLoading(false)
    }
  }
  
  // Archive/Restore handler
  const handleArchive = async () => {
    if (!id || !user) return
    
    try {
      setActionLoading(true)
      setActionMessage(null)
      
      if (user.status === 'ARCHIVED') {
        await usersApi.restore(id)
        setActionMessage({ type: 'success', text: t('users.details.actions.restoreSuccess', 'User has been restored') })
      } else {
        await usersApi.archive(id)
        setActionMessage({ type: 'success', text: t('users.details.actions.archiveSuccess', 'User has been archived') })
      }
      
      // Refresh user data
      const userData = await usersApi.getById(id)
      setUser(userData)
      setShowArchiveModal(false)
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || t('users.details.actions.actionError', 'Action failed') })
    } finally {
      setActionLoading(false)
    }
  }
  
  // Format date helper
  const formatDate = (date: string | Date | undefined | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }
  
  const formatDateTime = (date: string | Date | undefined | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }
  
  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent" />
      </div>
    )
  }
  
  // Error state
  if (error || !user) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <p className="text-lg text-gray-600 dark:text-gray-400">{error || t('users.details.errors.notFound', 'User not found')}</p>
        <button
          onClick={() => navigate('/users')}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('common.backToList', 'Back to list')}
        </button>
      </div>
    )
  }
  
  const roleConfig = roleBadges[user.role as keyof typeof roleBadges] || roleBadges.AGENT
  const statusConfig = statusBadges[user.status as keyof typeof statusBadges] || statusBadges.INACTIVE
  const RoleIcon = roleConfig.icon
  const StatusIcon = statusConfig.icon
  
  return (
    <div className="flex flex-col h-full">
      {/* Top Bar */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/users')}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {user.firstName} {user.lastName}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-2">
            {canEdit && (
              <Link
                to={`/users/${id}/edit`}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <Edit className="h-4 w-4" />
                {t('common.edit', 'Edit')}
              </Link>
            )}
            
            {/* More Actions Menu */}
            <div className="relative">
              <button
                onClick={() => setShowActionsMenu(!showActionsMenu)}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <MoreVertical className="h-5 w-5" />
              </button>
              
              {showActionsMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowActionsMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 z-20 w-48 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg py-1">
                    {canResetPassword && (
                      <button
                        onClick={() => {
                          setShowActionsMenu(false)
                          setShowResetPasswordModal(true)
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <Key className="h-4 w-4" />
                        {t('users.actions.resetPassword', 'Reset Password')}
                      </button>
                    )}
                    {canArchive && (
                      <button
                        onClick={() => {
                          setShowActionsMenu(false)
                          setShowArchiveModal(true)
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm ${
                          user.status === 'ARCHIVED'
                            ? 'text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                            : 'text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                        }`}
                      >
                        {user.status === 'ARCHIVED' ? (
                          <>
                            <RotateCcw className="h-4 w-4" />
                            {t('users.actions.restore', 'Restore')}
                          </>
                        ) : (
                          <>
                            <Archive className="h-4 w-4" />
                            {t('users.actions.archive', 'Archive')}
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Action Messages */}
      {actionMessage && (
        <div className={`mx-4 sm:mx-6 mt-4 p-4 rounded-lg flex items-center gap-2 ${
          actionMessage.type === 'success' 
            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
        }`}>
          {actionMessage.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          <span>{actionMessage.text}</span>
          <button onClick={() => setActionMessage(null)} className="ml-auto">
            <XCircle className="h-4 w-4" />
          </button>
        </div>
      )}
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto p-4 sm:p-6">
        {/* User Card Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {user.profilePhotoUrl ? (
                <img
                  src={user.profilePhotoUrl}
                  alt={`${user.firstName} ${user.lastName}`}
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <span className="text-3xl font-semibold text-gray-500 dark:text-gray-400">
                    {user.firstName?.[0]}{user.lastName?.[0]}
                  </span>
                </div>
              )}
            </div>
            
            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {user.firstName} {user.lastName}
                </h2>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${roleConfig.bg} ${roleConfig.text}`}>
                  <RoleIcon className="h-3.5 w-3.5" />
                  {t(`users.roles.${user.role}`, user.role)}
                </span>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                  <StatusIcon className="h-3.5 w-3.5" />
                  {t(`users.status.${user.status}`, user.status)}
                </span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Mail className="h-4 w-4" />
                  <span className="text-sm">{user.email}</span>
                </div>
                {user.phone && (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Phone className="h-4 w-4" />
                    <span className="text-sm">{user.phone}</span>
                  </div>
                )}
                {user.city && (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">{user.city}{user.region ? `, ${user.region}` : ''}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">{t('users.details.joined', 'Joined')} {formatDate(user.createdAt)}</span>
                </div>
                {user.lastLoginAt && (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">{t('users.details.lastLogin', 'Last login')} {formatDateTime(user.lastLoginAt)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
          <nav className="flex space-x-8">
            {tabs.map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-3 px-1 border-b-2 text-sm font-medium flex items-center gap-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {t(tab.labelKey, tab.id)}
                </button>
              )
            })}
          </nav>
        </div>
        
        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Personal Information */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {t('users.details.personalInfo', 'Personal Information')}
              </h3>
              <dl className="space-y-4">
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500 dark:text-gray-400">{t('users.fields.firstName', 'First Name')}</dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-white">{user.firstName || '-'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500 dark:text-gray-400">{t('users.fields.lastName', 'Last Name')}</dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-white">{user.lastName || '-'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500 dark:text-gray-400">{t('users.fields.displayName', 'Display Name')}</dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-white">{user.displayName || '-'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500 dark:text-gray-400">{t('users.fields.email', 'Email')}</dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-white">{user.email}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500 dark:text-gray-400">{t('users.fields.phone', 'Phone')}</dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-white">{user.phone || '-'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500 dark:text-gray-400">{t('users.fields.secondaryPhone', 'Secondary Phone')}</dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-white">{user.secondaryPhone || '-'}</dd>
                </div>
              </dl>
            </div>
            
            {/* Address */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {t('users.details.address', 'Address')}
              </h3>
              <dl className="space-y-4">
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500 dark:text-gray-400">{t('users.fields.address', 'Address')}</dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-white">{user.address || '-'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500 dark:text-gray-400">{t('users.fields.city', 'City')}</dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-white">{user.city || '-'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500 dark:text-gray-400">{t('users.fields.region', 'Region')}</dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-white">{user.region || '-'}</dd>
                </div>
              </dl>
            </div>
            
            {/* Emergency Contact */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {t('users.details.emergencyContact', 'Emergency Contact')}
              </h3>
              {user.emergencyContact ? (
                <dl className="space-y-4">
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500 dark:text-gray-400">{t('users.fields.name', 'Name')}</dt>
                    <dd className="text-sm font-medium text-gray-900 dark:text-white">{user.emergencyContact.name}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500 dark:text-gray-400">{t('users.fields.relationship', 'Relationship')}</dt>
                    <dd className="text-sm font-medium text-gray-900 dark:text-white">{user.emergencyContact.relationship}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500 dark:text-gray-400">{t('users.fields.phone', 'Phone')}</dt>
                    <dd className="text-sm font-medium text-gray-900 dark:text-white">{user.emergencyContact.phone}</dd>
                  </div>
                </dl>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('users.details.noEmergencyContact', 'No emergency contact set')}</p>
              )}
            </div>
            
            {/* Supervisor Info (for Agents) */}
            {user.role === 'AGENT' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {t('users.details.supervisor', 'Supervisor')}
                </h3>
                {user.supervisor ? (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        {user.supervisor.firstName?.[0]}{user.supervisor.lastName?.[0]}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {user.supervisor.firstName} {user.supervisor.lastName}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{user.supervisor.email}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('users.details.noSupervisor', 'No supervisor assigned')}</p>
                )}
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'employment' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {t('users.details.employmentDetails', 'Employment Details')}
              </h3>
              <dl className="space-y-4">
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500 dark:text-gray-400">{t('users.fields.employeeId', 'Employee ID')}</dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-white">{user.employeeId || '-'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500 dark:text-gray-400">{t('users.fields.hireDate', 'Hire Date')}</dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-white">{formatDate(user.hireDate)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500 dark:text-gray-400">{t('users.fields.contractType', 'Contract Type')}</dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-white">{user.contractType || '-'}</dd>
                </div>
              </dl>
            </div>
          </div>
        )}
        
        {activeTab === 'skills' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Certifications */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {t('users.details.certifications', 'Certifications')}
              </h3>
              {user.certifications && user.certifications.length > 0 ? (
                <ul className="space-y-3">
                  {user.certifications.map((cert: any, index: number) => (
                    <li key={index} className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-amber-500" />
                      <span className="text-sm text-gray-900 dark:text-white">{cert.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        cert.status === 'valid' ? 'bg-green-100 text-green-700' :
                        cert.status === 'expiring_soon' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {cert.status}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('users.details.noCertifications', 'No certifications')}</p>
              )}
            </div>
            
            {/* Languages */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {t('users.details.languages', 'Languages')}
              </h3>
              {user.languages && user.languages.length > 0 ? (
                <ul className="space-y-3">
                  {user.languages.map((lang: any, index: number) => (
                    <li key={index} className="flex items-center gap-2">
                      <Languages className="h-4 w-4 text-blue-500" />
                      <span className="text-sm text-gray-900 dark:text-white">{lang.language}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">({lang.proficiency})</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('users.details.noLanguages', 'No languages specified')}</p>
              )}
            </div>
            
            {/* Special Skills */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {t('users.details.specialSkills', 'Special Skills')}
              </h3>
              {user.specialSkills && user.specialSkills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {user.specialSkills.map((skill: string, index: number) => (
                    <span key={index} className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('users.details.noSkills', 'No special skills')}</p>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'activity' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('users.details.recentActivity', 'Recent Activity')}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('users.details.activityComingSoon', 'Activity log coming in Phase 2')}
            </p>
          </div>
        )}
        
        {activeTab === 'settings' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('users.details.userSettings', 'User Settings')}
            </h3>
            <dl className="space-y-4">
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500 dark:text-gray-400">{t('users.fields.emailVerified', 'Email Verified')}</dt>
                <dd className="text-sm font-medium">
                  {user.emailVerified ? (
                    <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
                      <CheckCircle className="h-4 w-4" />
                      {t('common.yes', 'Yes')}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-gray-500 dark:text-gray-400">
                      <XCircle className="h-4 w-4" />
                      {t('common.no', 'No')}
                    </span>
                  )}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500 dark:text-gray-400">{t('users.fields.forcePasswordChange', 'Force Password Change')}</dt>
                <dd className="text-sm font-medium">
                  {user.forcePasswordChange ? (
                    <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                      <AlertCircle className="h-4 w-4" />
                      {t('common.yes', 'Yes')}
                    </span>
                  ) : (
                    <span className="text-gray-500 dark:text-gray-400">{t('common.no', 'No')}</span>
                  )}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500 dark:text-gray-400">{t('users.fields.lastPasswordChange', 'Last Password Change')}</dt>
                <dd className="text-sm font-medium text-gray-900 dark:text-white">{formatDateTime(user.lastPasswordChangeAt)}</dd>
              </div>
            </dl>
          </div>
        )}
      </div>
      
      {/* Reset Password Modal */}
      {showResetPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('users.details.resetPasswordTitle', 'Reset Password')}
            </h3>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {t('users.details.resetPasswordDesc', 'Choose how to reset the password for this user.')}
            </p>
            
            <div className="space-y-3 mb-6">
              <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer ${
                resetPasswordMode === 'temp' 
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' 
                  : 'border-gray-200 dark:border-gray-700'
              }`}>
                <input
                  type="radio"
                  name="resetMode"
                  value="temp"
                  checked={resetPasswordMode === 'temp'}
                  onChange={() => setResetPasswordMode('temp')}
                  className="mt-1"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {t('users.details.tempPassword', 'Generate Temporary Password')}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('users.details.tempPasswordDesc', 'Create a one-time password that the user must change on first login.')}
                  </p>
                </div>
              </label>
              
              <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer ${
                resetPasswordMode === 'link' 
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' 
                  : 'border-gray-200 dark:border-gray-700'
              }`}>
                <input
                  type="radio"
                  name="resetMode"
                  value="link"
                  checked={resetPasswordMode === 'link'}
                  onChange={() => setResetPasswordMode('link')}
                  className="mt-1"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {t('users.details.sendResetLink', 'Send Reset Link')}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('users.details.sendResetLinkDesc', 'Send an email with a secure link to reset their password.')}
                  </p>
                </div>
              </label>
            </div>
            
            {/* Show temp password if generated */}
            {tempPassword && (
              <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-2">
                  {t('users.details.tempPasswordGenerated', 'Temporary Password Generated:')}
                </p>
                <code className="text-lg font-mono text-amber-900 dark:text-amber-200 select-all">{tempPassword}</code>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                  {t('users.details.copyPassword', 'Copy this password and share it securely with the user.')}
                </p>
              </div>
            )}
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowResetPasswordModal(false)
                  setTempPassword(null)
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {tempPassword ? t('common.close', 'Close') : t('common.cancel', 'Cancel')}
              </button>
              {!tempPassword && (
                <button
                  onClick={handleResetPassword}
                  disabled={actionLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                >
                  {actionLoading ? t('common.loading', 'Loading...') : t('users.details.resetPassword', 'Reset Password')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Archive/Restore Confirmation Modal */}
      {showArchiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {user.status === 'ARCHIVED' 
                ? t('users.details.restoreTitle', 'Restore User')
                : t('users.details.archiveTitle', 'Archive User')
              }
            </h3>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              {user.status === 'ARCHIVED' 
                ? t('users.details.restoreConfirm', 'Are you sure you want to restore this user? They will be set to inactive and need to be activated.')
                : t('users.details.archiveConfirm', 'Are you sure you want to archive this user? They will no longer be able to access the system.')
              }
            </p>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowArchiveModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                onClick={handleArchive}
                disabled={actionLoading}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 ${
                  user.status === 'ARCHIVED'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {actionLoading 
                  ? t('common.loading', 'Loading...') 
                  : user.status === 'ARCHIVED' 
                    ? t('users.actions.restore', 'Restore')
                    : t('users.actions.archive', 'Archive')
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserDetailsPage
