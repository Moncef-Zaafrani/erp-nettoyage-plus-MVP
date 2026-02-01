import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Edit,
  Archive,
  RotateCcw,
  Building2,
  User,
  Building,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle,
  MoreVertical,
  Briefcase,
  Globe,
  Activity,
  Construction,
  Key,
  Send,
} from 'lucide-react'
import { clientsApi, Client } from '@/services/api'
import { useAuth } from '@/contexts/AuthContext'

// Tab configuration
type TabId = 'overview' | 'sites' | 'contracts' | 'activity'
const tabs: { id: TabId; labelKey: string; icon: React.ElementType; isWip?: boolean }[] = [
  { id: 'overview', labelKey: 'clients.details.tabs.overview', icon: Building2 },
  { id: 'sites', labelKey: 'clients.details.tabs.sites', icon: Building, isWip: true },
  { id: 'contracts', labelKey: 'clients.details.tabs.contracts', icon: Briefcase, isWip: true },
  { id: 'activity', labelKey: 'clients.details.tabs.activity', icon: Activity, isWip: true },
]

// Type badge configuration
const typeBadges = {
  INDIVIDUAL: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', icon: User },
  COMPANY: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', icon: Building2 },
  MULTI_SITE: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', icon: Globe },
}

// Status badge configuration
const statusBadges = {
  PROSPECT: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-300', icon: AlertCircle },
  ACTIVE: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', icon: CheckCircle },
  INACTIVE: { bg: 'bg-gray-100 dark:bg-gray-900/30', text: 'text-gray-700 dark:text-gray-300', icon: XCircle },
  ARCHIVED: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', icon: Archive },
}

export function ClientDetailsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { user: currentUser } = useAuth()
  
  // Role-based access restriction: AGENT and CLIENT cannot view client details
  useEffect(() => {
    if (currentUser?.role === 'AGENT' || currentUser?.role === 'CLIENT') {
      navigate('/dashboard', { replace: true })
    }
  }, [currentUser, navigate])
  
  // State
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [showActionsMenu, setShowActionsMenu] = useState(false)
  const [showWipModal, setShowWipModal] = useState(false)
  
  // Modals
  const [showArchiveModal, setShowArchiveModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  // Permission checks
  const canEdit = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN'
  const canArchive = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN'
  
  // Fetch client
  useEffect(() => {
    async function fetchClient() {
      if (!id) return
      
      // Skip if user doesn't have access
      if (currentUser?.role === 'AGENT' || currentUser?.role === 'CLIENT') return
      
      try {
        setLoading(true)
        setError(null)
        const clientData = await clientsApi.getById(id)
        setClient(clientData)
      } catch (err: any) {
        console.error('Failed to fetch client:', err)
        if (err.statusCode === 403) {
          setError(t('clients.details.errors.accessDenied', 'You do not have access to view this client'))
        } else if (err.statusCode === 404) {
          setError(t('clients.details.errors.notFound', 'Client not found'))
        } else {
          setError(err.message || t('clients.details.errors.loadFailed', 'Failed to load client'))
        }
      } finally {
        setLoading(false)
      }
    }
    
    fetchClient()
  }, [id, t])
  
  // Archive/Restore handler
  const handleArchive = async () => {
    if (!id || !client) return
    
    try {
      setActionLoading(true)
      setActionMessage(null)
      
      if (client.status === 'ARCHIVED') {
        await clientsApi.restore(id)
        setActionMessage({ type: 'success', text: t('clients.details.actions.restoreSuccess', 'Client has been restored') })
      } else {
        await clientsApi.archive(id)
        setActionMessage({ type: 'success', text: t('clients.details.actions.archiveSuccess', 'Client has been archived') })
      }
      
      // Refresh client data
      const clientData = await clientsApi.getById(id)
      setClient(clientData)
      setShowArchiveModal(false)
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || t('clients.details.actions.actionError', 'Action failed') })
    } finally {
      setActionLoading(false)
    }
  }
  
  // Handle tab click
  const handleTabClick = (tab: typeof tabs[0]) => {
    if (tab.isWip) {
      setShowWipModal(true)
    } else {
      setActiveTab(tab.id)
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
  
  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent" />
      </div>
    )
  }
  
  // Error state
  if (error || !client) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <p className="text-lg text-gray-600 dark:text-gray-400">{error || t('clients.details.errors.notFound', 'Client not found')}</p>
        <button
          onClick={() => navigate('/clients')}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('common.backToList', 'Back to list')}
        </button>
      </div>
    )
  }
  
  const typeConfig = typeBadges[client.type as keyof typeof typeBadges] || typeBadges.COMPANY
  const statusConfig = statusBadges[client.status as keyof typeof statusBadges] || statusBadges.INACTIVE
  const TypeIcon = typeConfig.icon
  const StatusIcon = statusConfig.icon
  
  return (
    <div className="flex flex-col h-full">
      {/* Top Bar */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/clients')}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {client.name}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">{client.clientCode}</p>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-2">
            {canEdit && (
              <Link
                to={`/clients/${id}/edit`}
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
                    {canArchive && (
                      <button
                        onClick={() => {
                          setShowActionsMenu(false)
                          setShowArchiveModal(true)
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm ${
                          client.status === 'ARCHIVED'
                            ? 'text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                            : 'text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                        }`}
                      >
                        {client.status === 'ARCHIVED' ? (
                          <>
                            <RotateCcw className="h-4 w-4" />
                            {t('clients.actions.restore', 'Restore')}
                          </>
                        ) : (
                          <>
                            <Archive className="h-4 w-4" />
                            {t('clients.actions.archive', 'Archive')}
                          </>
                        )}
                      </button>
                    )}
                    {/* Password Reset - Only for clients with linked user account */}
                    {client.userId && canEdit && (
                      <button
                        onClick={async () => {
                          setShowActionsMenu(false)
                          setActionLoading(true)
                          try {
                            const result = await clientsApi.resetPassword(client.id)
                            setActionMessage({ type: 'success', text: result.message })
                          } catch (err: any) {
                            setActionMessage({ type: 'error', text: err.message || t('clients.actions.resetPasswordError', 'Failed to reset password') })
                          } finally {
                            setActionLoading(false)
                          }
                        }}
                        disabled={actionLoading}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <Key className="h-4 w-4" />
                        {t('clients.actions.resetPassword', 'Reset Password')}
                      </button>
                    )}
                    {/* Send Verification - Only for clients with linked user account */}
                    {client.userId && canEdit && (
                      <button
                        onClick={async () => {
                          setShowActionsMenu(false)
                          setActionLoading(true)
                          try {
                            const result = await clientsApi.sendVerification(client.id)
                            setActionMessage({ type: 'success', text: result.message })
                          } catch (err: any) {
                            setActionMessage({ type: 'error', text: err.message || t('clients.actions.sendVerificationError', 'Failed to send verification') })
                          } finally {
                            setActionLoading(false)
                          }
                        }}
                        disabled={actionLoading}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <Send className="h-4 w-4" />
                        {t('clients.actions.sendVerification', 'Send Verification Email')}
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
        {/* Client Card Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-start gap-6">
            {/* Icon */}
            <div className="flex-shrink-0">
              <div className={`w-24 h-24 rounded-lg ${typeConfig.bg} flex items-center justify-center`}>
                <TypeIcon className={`h-12 w-12 ${typeConfig.text}`} />
              </div>
            </div>
            
            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {client.name}
                </h2>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${typeConfig.bg} ${typeConfig.text}`}>
                  <TypeIcon className="h-3.5 w-3.5" />
                  {t(`clients.types.${client.type}`, client.type)}
                </span>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                  <StatusIcon className="h-3.5 w-3.5" />
                  {t(`clients.status.${client.status}`, client.status)}
                </span>
              </div>
              
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {t('clients.details.clientCode', 'Code')}: {client.clientCode}
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {client.email && (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Mail className="h-4 w-4" />
                    <span className="text-sm">{client.email}</span>
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Phone className="h-4 w-4" />
                    <span className="text-sm">{client.phone}</span>
                  </div>
                )}
                {client.city && (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">{client.city}{client.country ? `, ${client.country}` : ''}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">{t('clients.details.created', 'Created')} {formatDate(client.createdAt)}</span>
                </div>
              </div>
              
              {/* Stats */}
              <div className="flex gap-6 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{client.sitesCount || 0}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('clients.details.sites', 'Sites')}</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{client.activeContractsCount || 0}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('clients.details.activeContracts', 'Active Contracts')}</p>
                </div>
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
                  onClick={() => handleTabClick(tab)}
                  className={`py-3 px-1 border-b-2 text-sm font-medium flex items-center gap-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {t(tab.labelKey, tab.id)}
                  {tab.isWip && (
                    <span className="text-xs px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded">
                      WIP
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>
        
        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Contact Information */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {t('clients.details.contactInfo', 'Contact Information')}
              </h3>
              <dl className="space-y-4">
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500 dark:text-gray-400">{t('clients.fields.email', 'Email')}</dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-white">{client.email || '-'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500 dark:text-gray-400">{t('clients.fields.phone', 'Phone')}</dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-white">{client.phone || '-'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500 dark:text-gray-400">{t('clients.fields.contactPerson', 'Contact Person')}</dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-white">{client.contactPerson || '-'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500 dark:text-gray-400">{t('clients.fields.contactPhone', 'Contact Phone')}</dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-white">{client.contactPhone || '-'}</dd>
                </div>
              </dl>
            </div>
            
            {/* Address */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {t('clients.details.address', 'Address')}
              </h3>
              <dl className="space-y-4">
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500 dark:text-gray-400">{t('clients.fields.address', 'Address')}</dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-white">{client.address || '-'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500 dark:text-gray-400">{t('clients.fields.city', 'City')}</dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-white">{client.city || '-'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500 dark:text-gray-400">{t('clients.fields.postalCode', 'Postal Code')}</dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-white">{client.postalCode || '-'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500 dark:text-gray-400">{t('clients.fields.country', 'Country')}</dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-white">{client.country || '-'}</dd>
                </div>
              </dl>
            </div>
            
            {/* Notes */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 lg:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {t('clients.details.notes', 'Notes')}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                {client.notes || t('clients.details.noNotes', 'No notes added')}
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* Archive/Restore Confirmation Modal */}
      {showArchiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {client.status === 'ARCHIVED' 
                ? t('clients.details.restoreTitle', 'Restore Client')
                : t('clients.details.archiveTitle', 'Archive Client')
              }
            </h3>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              {client.status === 'ARCHIVED' 
                ? t('clients.details.restoreConfirm', 'Are you sure you want to restore this client?')
                : t('clients.details.archiveConfirm', 'Are you sure you want to archive this client? They will be removed from active lists.')
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
                  client.status === 'ARCHIVED'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {actionLoading 
                  ? t('common.loading', 'Loading...') 
                  : client.status === 'ARCHIVED' 
                    ? t('clients.actions.restore', 'Restore')
                    : t('clients.actions.archive', 'Archive')
                }
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* WIP Modal */}
      {showWipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Construction className="h-8 w-8 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {t('common.wipTitle', 'Coming Soon')}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              {t('common.wipMessage', 'This feature is under development and will be available in Phase 2.')}
            </p>
            <button
              onClick={() => setShowWipModal(false)}
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700"
            >
              {t('common.gotIt', 'Got it')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ClientDetailsPage
