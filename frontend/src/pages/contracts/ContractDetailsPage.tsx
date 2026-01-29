import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  FileText,
  Building2,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  ClipboardList,
  Edit,
  Archive,
  RotateCcw,
  Play,
  Pause,
  CheckCircle,
  Loader2,
  MoreHorizontal,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react'
import {
  contractsApi,
  Contract,
  ServiceContractType,
  ContractStatus,
  ContractFrequency,
  Client,
  Site,
  clientsApi,
  sitesApi,
} from '@/services/api'
import { useAuth } from '@/contexts/AuthContext'

// Type badge config
const typeConfig: Record<ServiceContractType, { label: string; icon: typeof RefreshCw; color: string; bgColor: string }> = {
  PERMANENT: { label: 'contracts.type.permanent', icon: RefreshCw, color: 'text-indigo-700 dark:text-indigo-300', bgColor: 'bg-indigo-100 dark:bg-indigo-900/50' },
  ONE_TIME: { label: 'contracts.type.oneTime', icon: Calendar, color: 'text-orange-700 dark:text-orange-300', bgColor: 'bg-orange-100 dark:bg-orange-900/50' },
}

// Status badge config
const statusConfig: Record<ContractStatus, { label: string; color: string; bgColor: string; icon: typeof CheckCircle }> = {
  DRAFT: { label: 'contracts.status.draft', color: 'text-gray-700 dark:text-gray-300', bgColor: 'bg-gray-100 dark:bg-gray-700', icon: FileText },
  ACTIVE: { label: 'contracts.status.active', color: 'text-green-700 dark:text-green-300', bgColor: 'bg-green-100 dark:bg-green-900/50', icon: CheckCircle },
  INACTIVE: { label: 'contracts.status.inactive', color: 'text-yellow-700 dark:text-yellow-300', bgColor: 'bg-yellow-100 dark:bg-yellow-900/50', icon: Pause },
  COMPLETED: { label: 'contracts.status.completed', color: 'text-blue-700 dark:text-blue-300', bgColor: 'bg-blue-100 dark:bg-blue-900/50', icon: CheckCircle },
  ARCHIVED: { label: 'contracts.status.archived', color: 'text-red-700 dark:text-red-300', bgColor: 'bg-red-100 dark:bg-red-900/50', icon: Archive },
}

// Frequency labels
const frequencyLabels: Record<ContractFrequency, string> = {
  DAILY: 'contracts.frequency.daily',
  WEEKLY: 'contracts.frequency.weekly',
  BIWEEKLY: 'contracts.frequency.biweekly',
  MONTHLY: 'contracts.frequency.monthly',
  QUARTERLY: 'contracts.frequency.quarterly',
  CUSTOM: 'contracts.frequency.custom',
}

export function ContractDetailsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { user: currentUser } = useAuth()

  const [contract, setContract] = useState<Contract | null>(null)
  const [client, setClient] = useState<Client | null>(null)
  const [site, setSite] = useState<Site | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  // Permissions
  const canEdit = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPERVISOR'
  const canArchive = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN'

  // Fetch contract data
  useEffect(() => {
    async function fetchData() {
      if (!id) return

      try {
        setLoading(true)
        setError(null)

        const contractData = await contractsApi.getById(id)
        setContract(contractData)

        // Fetch client and site
        const [clientData, siteData] = await Promise.all([
          clientsApi.getById(contractData.clientId),
          sitesApi.getById(contractData.siteId),
        ])
        setClient(clientData)
        setSite(siteData)
      } catch (err: any) {
        console.error('Failed to fetch contract:', err)
        setError(err.message || 'Failed to load contract')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  // Action handlers
  const handleActivate = async () => {
    if (!contract) return
    try {
      setActionLoading(true)
      await contractsApi.activate(contract.id)
      setContract(prev => prev ? { ...prev, status: 'ACTIVE' } : null)
    } catch (err) {
      console.error('Failed to activate contract:', err)
    } finally {
      setActionLoading(false)
      setShowMenu(false)
    }
  }

  const handleSuspend = async () => {
    if (!contract) return
    try {
      setActionLoading(true)
      await contractsApi.suspend(contract.id)
      setContract(prev => prev ? { ...prev, status: 'INACTIVE' } : null)
    } catch (err) {
      console.error('Failed to suspend contract:', err)
    } finally {
      setActionLoading(false)
      setShowMenu(false)
    }
  }

  const handleComplete = async () => {
    if (!contract) return
    try {
      setActionLoading(true)
      await contractsApi.complete(contract.id)
      setContract(prev => prev ? { ...prev, status: 'COMPLETED' } : null)
    } catch (err) {
      console.error('Failed to complete contract:', err)
    } finally {
      setActionLoading(false)
      setShowMenu(false)
    }
  }

  const handleArchive = async () => {
    if (!contract) return
    try {
      setActionLoading(true)
      await contractsApi.archive(contract.id)
      navigate('/contracts')
    } catch (err) {
      console.error('Failed to archive contract:', err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleRestore = async () => {
    if (!contract) return
    try {
      setActionLoading(true)
      await contractsApi.restore(contract.id)
      setContract(prev => prev ? { ...prev, status: 'DRAFT' } : null)
    } catch (err) {
      console.error('Failed to restore contract:', err)
    } finally {
      setActionLoading(false)
      setShowMenu(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    )
  }

  if (error || !contract) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {t('contracts.error.notFound', 'Contract not found')}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          {error || t('contracts.error.notFoundDesc', 'The contract you are looking for does not exist.')}
        </p>
        <button
          onClick={() => navigate('/contracts')}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('contracts.backToList', 'Back to Contracts')}
        </button>
      </div>
    )
  }

  const typeInfo = typeConfig[contract.type]
  const statusInfo = statusConfig[contract.status]
  const TypeIcon = typeInfo.icon
  const StatusIcon = statusInfo.icon

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/contracts')}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white font-mono">
                {contract.contractCode}
              </h1>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${typeInfo.bgColor} ${typeInfo.color}`}>
                <TypeIcon className="h-3.5 w-3.5" />
                {t(typeInfo.label)}
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
                <StatusIcon className="h-3.5 w-3.5" />
                {t(statusInfo.label)}
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {client?.name} • {site?.name}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {canEdit && (
              <button
                onClick={() => navigate(`/contracts/${contract.id}/edit`)}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <Edit className="h-4 w-4" />
                {t('common.edit', 'Edit')}
              </button>
            )}

            {/* More Actions Menu */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                disabled={actionLoading}
                className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                {actionLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <MoreHorizontal className="h-5 w-5" />
                )}
              </button>

              {showMenu && (
                <div className="absolute right-0 top-full mt-1 z-20 w-48 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg py-1">
                  {canEdit && contract.status === 'DRAFT' && (
                    <button
                      onClick={handleActivate}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-green-600 dark:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Play className="h-4 w-4" />
                      {t('contracts.activate', 'Activate')}
                    </button>
                  )}

                  {canEdit && contract.status === 'ACTIVE' && (
                    <button
                      onClick={handleSuspend}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-yellow-600 dark:text-yellow-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Pause className="h-4 w-4" />
                      {t('contracts.suspend', 'Suspend')}
                    </button>
                  )}

                  {canEdit && contract.status === 'INACTIVE' && (
                    <button
                      onClick={handleActivate}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-green-600 dark:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Play className="h-4 w-4" />
                      {t('contracts.resume', 'Resume')}
                    </button>
                  )}

                  {canEdit && (contract.status === 'ACTIVE' || contract.status === 'INACTIVE') && (
                    <button
                      onClick={handleComplete}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <CheckCircle className="h-4 w-4" />
                      {t('contracts.complete', 'Mark Complete')}
                    </button>
                  )}

                  <div className="border-t border-gray-100 dark:border-gray-700 my-1" />

                  {canArchive && contract.status !== 'ARCHIVED' && (
                    <button
                      onClick={handleArchive}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Archive className="h-4 w-4" />
                      {t('common.archive', 'Archive')}
                    </button>
                  )}

                  {canArchive && contract.status === 'ARCHIVED' && (
                    <button
                      onClick={handleRestore}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-green-600 dark:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <RotateCcw className="h-4 w-4" />
                      {t('common.restore', 'Restore')}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Client Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                  <Building2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {t('contracts.details.client', 'Client')}
                </h3>
              </div>
              <p className="font-semibold text-gray-900 dark:text-white">
                {client?.name}
              </p>
              {client?.email && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{client.email}</p>
              )}
              <button
                onClick={() => navigate(`/clients/view/${client?.id}`)}
                className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                {t('contracts.details.viewClient', 'View Client')} →
              </button>
            </div>

            {/* Site Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                  <MapPin className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {t('contracts.details.site', 'Site')}
                </h3>
              </div>
              <p className="font-semibold text-gray-900 dark:text-white">
                {site?.name}
              </p>
              {site?.address && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{site.address}</p>
              )}
              <button
                onClick={() => navigate(`/sites/view/${site?.id}`)}
                className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                {t('contracts.details.viewSite', 'View Site')} →
              </button>
            </div>

            {/* Duration Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {t('contracts.details.duration', 'Duration')}
                </h3>
              </div>
              <p className="font-semibold text-gray-900 dark:text-white">
                {new Date(contract.startDate).toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {contract.endDate
                  ? `→ ${new Date(contract.endDate).toLocaleDateString()}`
                  : t('contracts.ongoing', 'Ongoing')}
              </p>
            </div>
          </div>

          {/* Contract Details */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-500" />
                {t('contracts.details.information', 'Contract Information')}
              </h2>
            </div>
            <div className="p-4 sm:p-6">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {t('contracts.details.contractCode', 'Contract Code')}
                  </dt>
                  <dd className="mt-1 text-sm font-mono text-gray-900 dark:text-white">
                    {contract.contractCode}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {t('contracts.details.type', 'Type')}
                  </dt>
                  <dd className="mt-1">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${typeInfo.bgColor} ${typeInfo.color}`}>
                      <TypeIcon className="h-3.5 w-3.5" />
                      {t(typeInfo.label)}
                    </span>
                  </dd>
                </div>

                {contract.type === 'PERMANENT' && contract.frequency && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {t('contracts.details.frequency', 'Frequency')}
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      {t(frequencyLabels[contract.frequency])}
                    </dd>
                  </div>
                )}

                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {t('contracts.details.status', 'Status')}
                  </dt>
                  <dd className="mt-1">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
                      <StatusIcon className="h-3.5 w-3.5" />
                      {t(statusInfo.label)}
                    </span>
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {t('contracts.details.createdAt', 'Created')}
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                    {new Date(contract.createdAt).toLocaleString()}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {t('contracts.details.updatedAt', 'Last Updated')}
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                    {new Date(contract.updatedAt).toLocaleString()}
                  </dd>
                </div>
              </dl>

              {contract.notes && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                    {t('contracts.details.notes', 'Notes')}
                  </dt>
                  <dd className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                    {contract.notes}
                  </dd>
                </div>
              )}
            </div>
          </div>

          {/* Pricing Section */}
          {contract.pricing && (contract.pricing.monthlyFee || contract.pricing.perInterventionFee || contract.pricing.hourlyRate) && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-indigo-500" />
                  {t('contracts.details.pricing', 'Pricing')}
                </h2>
              </div>
              <div className="p-4 sm:p-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {contract.pricing.monthlyFee && (
                    <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t('contracts.pricing.monthlyFee', 'Monthly')}
                      </p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {contract.pricing.monthlyFee.toLocaleString()} {contract.pricing.currency}
                      </p>
                    </div>
                  )}
                  {contract.pricing.perInterventionFee && (
                    <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t('contracts.pricing.perIntervention', 'Per Intervention')}
                      </p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {contract.pricing.perInterventionFee.toLocaleString()} {contract.pricing.currency}
                      </p>
                    </div>
                  )}
                  {contract.pricing.hourlyRate && (
                    <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t('contracts.pricing.hourlyRate', 'Hourly Rate')}
                      </p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {contract.pricing.hourlyRate.toLocaleString()} {contract.pricing.currency}
                      </p>
                    </div>
                  )}
                  {contract.pricing.billingCycle && (
                    <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t('contracts.pricing.billingCycle', 'Billing Cycle')}
                      </p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {t(`contracts.billing.${contract.pricing.billingCycle.toLowerCase()}`)}
                      </p>
                    </div>
                  )}
                </div>
                {contract.pricing.paymentTerms && (
                  <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-medium">{t('contracts.pricing.paymentTerms', 'Terms')}:</span> {contract.pricing.paymentTerms}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Service Scope Section */}
          {contract.serviceScope && (contract.serviceScope.zones.length > 0 || contract.serviceScope.tasks.length > 0) && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-indigo-500" />
                  {t('contracts.details.serviceScope', 'Service Scope')}
                </h2>
              </div>
              <div className="p-4 sm:p-6 space-y-4">
                {contract.serviceScope.zones.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('contracts.scope.zones', 'Zones / Areas')}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {contract.serviceScope.zones.map((zone, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg"
                        >
                          {zone}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {contract.serviceScope.tasks.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('contracts.scope.tasks', 'Tasks')}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {contract.serviceScope.tasks.map((task, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg"
                        >
                          {task}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {contract.serviceScope.specialInstructions && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('contracts.scope.specialInstructions', 'Special Instructions')}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                      {contract.serviceScope.specialInstructions}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ContractDetailsPage
