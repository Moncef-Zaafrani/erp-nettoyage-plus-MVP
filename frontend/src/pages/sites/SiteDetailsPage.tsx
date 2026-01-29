import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  MapPin,
  Building2,
  Clock,
  User as UserIcon,
  Phone,
  Mail,
  FileText,
  Loader2,
  Edit,
  Archive,
  RotateCcw,
  Calendar,
  Users,
  History,
  Ruler,
  AlertCircle,
} from 'lucide-react'
import { sitesApi, Site, clientsApi, Client, SiteSize, SiteStatus } from '@/services/api'
import { useAuth } from '@/contexts/AuthContext'

// Size config
const sizeConfig: Record<SiteSize, { label: string; color: string; bgColor: string }> = {
  SMALL: { label: 'sites.size.small', color: 'text-green-700 dark:text-green-300', bgColor: 'bg-green-100 dark:bg-green-900/50' },
  MEDIUM: { label: 'sites.size.medium', color: 'text-blue-700 dark:text-blue-300', bgColor: 'bg-blue-100 dark:bg-blue-900/50' },
  LARGE: { label: 'sites.size.large', color: 'text-purple-700 dark:text-purple-300', bgColor: 'bg-purple-100 dark:bg-purple-900/50' },
}

// Status config
const statusConfig: Record<SiteStatus, { label: string; color: string; bgColor: string }> = {
  ACTIVE: { label: 'sites.status.active', color: 'text-green-700 dark:text-green-300', bgColor: 'bg-green-100 dark:bg-green-900/50' },
  INACTIVE: { label: 'sites.status.inactive', color: 'text-gray-700 dark:text-gray-300', bgColor: 'bg-gray-100 dark:bg-gray-700' },
  ARCHIVED: { label: 'sites.status.archived', color: 'text-red-700 dark:text-red-300', bgColor: 'bg-red-100 dark:bg-red-900/50' },
}

// Tab types
type TabId = 'overview' | 'agents' | 'contracts' | 'interventions' | 'history'

export function SiteDetailsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { user: currentUser } = useAuth()

  // State
  const [site, setSite] = useState<Site | null>(null)
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabId>('overview')

  // Modal states
  const [showArchiveModal, setShowArchiveModal] = useState(false)
  const [showRestoreModal, setShowRestoreModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  // Role-based access check
  useEffect(() => {
    if (currentUser?.role === 'AGENT' || currentUser?.role === 'CLIENT') {
      navigate('/dashboard')
    }
  }, [currentUser, navigate])

  // Permissions
  const canEdit = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN'
  const canArchive = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN'

  // Fetch site data
  useEffect(() => {
    async function fetchSite() {
      if (!id) return

      try {
        setLoading(true)
        setError(null)
        const siteData = await sitesApi.getById(id)
        setSite(siteData)

        // Fetch associated client
        if (siteData.clientId) {
          try {
            const clientData = await clientsApi.getById(siteData.clientId)
            setClient(clientData)
          } catch (err) {
            console.error('Failed to fetch client:', err)
          }
        }
      } catch (err: any) {
        console.error('Failed to fetch site:', err)
        setError(err.message || 'Failed to load site')
      } finally {
        setLoading(false)
      }
    }
    fetchSite()
  }, [id])

  // Handle archive
  const handleArchive = async () => {
    if (!site) return

    try {
      setActionLoading(true)
      await sitesApi.archive(site.id)
      // Refresh site data
      const updatedSite = await sitesApi.getById(site.id)
      setSite(updatedSite)
      setShowArchiveModal(false)
    } catch (err: any) {
      console.error('Failed to archive site:', err)
    } finally {
      setActionLoading(false)
    }
  }

  // Handle restore
  const handleRestore = async () => {
    if (!site) return

    try {
      setActionLoading(true)
      await sitesApi.restore(site.id)
      // Refresh site data
      const updatedSite = await sitesApi.getById(site.id)
      setSite(updatedSite)
      setShowRestoreModal(false)
    } catch (err: any) {
      console.error('Failed to restore site:', err)
    } finally {
      setActionLoading(false)
    }
  }

  // Tabs configuration
  const tabs: { id: TabId; label: string; icon: typeof MapPin }[] = [
    { id: 'overview', label: t('sites.details.tabs.overview', 'Overview'), icon: MapPin },
    { id: 'agents', label: t('sites.details.tabs.agents', 'Assigned Agents'), icon: Users },
    { id: 'contracts', label: t('sites.details.tabs.contracts', 'Contracts'), icon: FileText },
    { id: 'interventions', label: t('sites.details.tabs.interventions', 'Interventions'), icon: Calendar },
    { id: 'history', label: t('sites.details.tabs.history', 'History'), icon: History },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  if (error || !site) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <AlertCircle className="h-16 w-16 text-red-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          {t('sites.details.notFound', 'Site not found')}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-4">{error}</p>
        <button
          onClick={() => navigate('/sites')}
          className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700"
        >
          {t('sites.details.backToSites', 'Back to Sites')}
        </button>
      </div>
    )
  }

  const sizeInfo = sizeConfig[site.size] || sizeConfig.MEDIUM
  const statusInfo = statusConfig[site.status] || statusConfig.ACTIVE

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="px-4 sm:px-6 py-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <button
                onClick={() => navigate('/sites')}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors mt-1"
              >
                <ArrowLeft className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${sizeInfo.bgColor}`}>
                  <MapPin className={`h-8 w-8 ${sizeInfo.color}`} />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {site.name}
                    </h1>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
                      {t(statusInfo.label)}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Building2 className="h-4 w-4" />
                      {client?.name || t('sites.noClient', 'No client')}
                    </span>
                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${sizeInfo.bgColor} ${sizeInfo.color}`}>
                      <Ruler className="h-3 w-3" />
                      {t(sizeInfo.label)}
                    </span>
                    {site.city && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {site.city}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {canEdit && (
                <button
                  onClick={() => navigate(`/sites/${site.id}/edit`)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <Edit className="h-4 w-4" />
                  {t('common.edit', 'Edit')}
                </button>
              )}
              {canArchive && site.status !== 'ARCHIVED' && (
                <button
                  onClick={() => setShowArchiveModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                >
                  <Archive className="h-4 w-4" />
                  {t('common.archive', 'Archive')}
                </button>
              )}
              {canArchive && site.status === 'ARCHIVED' && (
                <button
                  onClick={() => setShowRestoreModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                >
                  <RotateCcw className="h-4 w-4" />
                  {t('common.restore', 'Restore')}
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-6 flex gap-1 overflow-x-auto">
            {tabs.map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {activeTab === 'overview' && (
          <div className="max-w-4xl space-y-6">
            {/* Location Information */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-emerald-600" />
                {t('sites.details.location', 'Location')}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500 dark:text-gray-400">{t('sites.details.address', 'Address')}</label>
                  <p className="text-gray-900 dark:text-white mt-1">
                    {site.address || t('common.notSet', 'Not set')}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500 dark:text-gray-400">{t('sites.details.city', 'City')}</label>
                  <p className="text-gray-900 dark:text-white mt-1">
                    {site.city || t('common.notSet', 'Not set')}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500 dark:text-gray-400">{t('sites.details.postalCode', 'Postal Code')}</label>
                  <p className="text-gray-900 dark:text-white mt-1">
                    {site.postalCode || t('common.notSet', 'Not set')}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500 dark:text-gray-400">{t('sites.details.country', 'Country')}</label>
                  <p className="text-gray-900 dark:text-white mt-1">
                    {site.country || t('common.notSet', 'Not set')}
                  </p>
                </div>
                {site.accessInstructions && (
                  <div className="md:col-span-2">
                    <label className="text-sm text-gray-500 dark:text-gray-400">{t('sites.details.accessInstructions', 'Access Instructions')}</label>
                    <p className="text-gray-900 dark:text-white mt-1 whitespace-pre-wrap">
                      {site.accessInstructions}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Working Hours & Size */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                {t('sites.details.schedule', 'Schedule & Details')}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500 dark:text-gray-400">{t('sites.details.workingHours', 'Working Hours')}</label>
                  <p className="text-gray-900 dark:text-white mt-1 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    {site.workingHours || t('common.notSet', 'Not set')}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500 dark:text-gray-400">{t('sites.details.size', 'Size Category')}</label>
                  <p className="mt-1">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-sm font-medium ${sizeInfo.bgColor} ${sizeInfo.color}`}>
                      <Ruler className="h-4 w-4" />
                      {t(sizeInfo.label)}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* On-site Contact */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-purple-600" />
                {t('sites.details.contact', 'On-site Contact')}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500 dark:text-gray-400">{t('sites.details.contactPerson', 'Contact Person')}</label>
                  <p className="text-gray-900 dark:text-white mt-1 flex items-center gap-2">
                    <UserIcon className="h-4 w-4 text-gray-400" />
                    {site.contactPerson || t('common.notSet', 'Not set')}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500 dark:text-gray-400">{t('sites.details.contactPhone', 'Phone')}</label>
                  <p className="text-gray-900 dark:text-white mt-1 flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    {site.contactPhone || t('common.notSet', 'Not set')}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm text-gray-500 dark:text-gray-400">{t('sites.details.contactEmail', 'Email')}</label>
                  <p className="text-gray-900 dark:text-white mt-1 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    {site.contactEmail || t('common.notSet', 'Not set')}
                  </p>
                </div>
              </div>
            </div>

            {/* Notes */}
            {site.notes && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-gray-600" />
                  {t('sites.details.notes', 'Notes')}
                </h2>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {site.notes}
                </p>
              </div>
            )}

            {/* Client Link */}
            {client && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  {t('sites.details.clientInfo', 'Client Information')}
                </h2>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{client.name}</p>
                      {client.email && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">{client.email}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/clients/view/${client.id}`)}
                    className="px-4 py-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                  >
                    {t('sites.details.viewClient', 'View Client')}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'agents' && (
          <div className="max-w-4xl">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-center h-48 text-center">
                <div>
                  <Users className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    {t('sites.details.agentsWip', 'Agent Assignments Coming Soon')}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('sites.details.agentsWipDesc', 'This feature will be available in a future update.')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'contracts' && (
          <div className="max-w-4xl">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-center h-48 text-center">
                <div>
                  <FileText className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    {t('sites.details.contractsWip', 'Contracts Coming Soon')}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('sites.details.contractsWipDesc', 'This feature will be available in a future update.')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'interventions' && (
          <div className="max-w-4xl">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-center h-48 text-center">
                <div>
                  <Calendar className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    {t('sites.details.interventionsWip', 'Interventions Coming Soon')}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('sites.details.interventionsWipDesc', 'This feature will be available in a future update.')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="max-w-4xl">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-center h-48 text-center">
                <div>
                  <History className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    {t('sites.details.historyWip', 'Audit History Coming Soon')}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('sites.details.historyWipDesc', 'This feature will be available in a future update.')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Archive Modal */}
      {showArchiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30">
                <Archive className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t('sites.archive.title', 'Archive Site')}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('sites.archive.description', 'Are you sure you want to archive this site?')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setShowArchiveModal(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                onClick={handleArchive}
                disabled={actionLoading}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Archive className="h-4 w-4" />
                )}
                {t('common.archive', 'Archive')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restore Modal */}
      {showRestoreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
                <RotateCcw className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t('sites.restore.title', 'Restore Site')}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('sites.restore.description', 'Are you sure you want to restore this site?')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setShowRestoreModal(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                onClick={handleRestore}
                disabled={actionLoading}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {actionLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RotateCcw className="h-4 w-4" />
                )}
                {t('common.restore', 'Restore')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SiteDetailsPage
