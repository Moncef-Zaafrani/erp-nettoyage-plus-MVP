import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  MoreHorizontal,
  FileText,
  MapPin,
  Calendar,
  Eye,
  Edit,
  Archive,
  RotateCcw,
  Play,
  Pause,
  CheckCircle,
  RefreshCw,
  Clock,
} from 'lucide-react'
import { Contract, ServiceContractType, ContractStatus, ContractFrequency, Client, Site, contractsApi } from '@/services/api'
import { useAuth } from '@/contexts/AuthContext'

interface ContractCardProps {
  contract: Contract
  client?: Client
  site?: Site
  isSelected?: boolean
  onSelect?: (contract: Contract) => void
  onDeselect?: (contract: Contract) => void
  onViewDetails?: (contract: Contract) => void
  selectionMode?: boolean
  onRefresh?: () => void
}

// Type badge config
const typeConfig: Record<ServiceContractType, { label: string; icon: typeof RefreshCw; color: string; bgColor: string }> = {
  PERMANENT: { label: 'contracts.type.permanent', icon: RefreshCw, color: 'text-indigo-600 dark:text-indigo-400', bgColor: 'bg-indigo-100 dark:bg-indigo-900/30' },
  ONE_TIME: { label: 'contracts.type.oneTime', icon: Calendar, color: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-100 dark:bg-orange-900/30' },
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

export function ContractCard({
  contract,
  client,
  site,
  isSelected = false,
  onSelect,
  onDeselect,
  onViewDetails,
  selectionMode = false,
  onRefresh,
}: ContractCardProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const [showMenu, setShowMenu] = useState(false)
  const [loading, setLoading] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const typeInfo = typeConfig[contract.type]
  const statusInfo = statusConfig[contract.status]
  const TypeIcon = typeInfo.icon
  const StatusIcon = statusInfo.icon

  // Determine permissions based on current user
  const canEdit = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPERVISOR'
  const canArchive = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN'

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle right-click context menu
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    setShowMenu(true)
  }

  // Handle card click
  const handleCardClick = () => {
    if (selectionMode) {
      if (isSelected) {
        onDeselect?.(contract)
      } else {
        onSelect?.(contract)
      }
    } else {
      onViewDetails?.(contract) || navigate(`/contracts/view/${contract.id}`)
    }
  }

  // Handle status change
  const handleActivate = async () => {
    try {
      setLoading(true)
      await contractsApi.activate(contract.id)
      onRefresh?.()
    } catch (err) {
      console.error('Failed to activate contract:', err)
    } finally {
      setLoading(false)
      setShowMenu(false)
    }
  }

  const handleSuspend = async () => {
    try {
      setLoading(true)
      await contractsApi.suspend(contract.id)
      onRefresh?.()
    } catch (err) {
      console.error('Failed to suspend contract:', err)
    } finally {
      setLoading(false)
      setShowMenu(false)
    }
  }

  const handleComplete = async () => {
    try {
      setLoading(true)
      await contractsApi.complete(contract.id)
      onRefresh?.()
    } catch (err) {
      console.error('Failed to complete contract:', err)
    } finally {
      setLoading(false)
      setShowMenu(false)
    }
  }

  const handleArchive = async () => {
    try {
      setLoading(true)
      await contractsApi.archive(contract.id)
      onRefresh?.()
    } catch (err) {
      console.error('Failed to archive contract:', err)
    } finally {
      setLoading(false)
      setShowMenu(false)
    }
  }

  const handleRestore = async () => {
    try {
      setLoading(true)
      await contractsApi.restore(contract.id)
      onRefresh?.()
    } catch (err) {
      console.error('Failed to restore contract:', err)
    } finally {
      setLoading(false)
      setShowMenu(false)
    }
  }

  // Format date range
  const formatDateRange = () => {
    const start = new Date(contract.startDate).toLocaleDateString()
    if (contract.endDate) {
      const end = new Date(contract.endDate).toLocaleDateString()
      return `${start} → ${end}`
    }
    return `${start} → ${t('contracts.ongoing', 'Ongoing')}`
  }

  return (
    <div
      onClick={handleCardClick}
      onContextMenu={handleContextMenu}
      className={`relative bg-white dark:bg-gray-800 rounded-xl border transition-all duration-200 cursor-pointer group ${
        isSelected
          ? 'border-indigo-500 ring-2 ring-indigo-500/20'
          : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-lg'
      } ${loading ? 'opacity-50 pointer-events-none' : ''}`}
    >
      {/* Selection Checkbox */}
      {selectionMode && (
        <div className="absolute top-3 left-3 z-10">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation()
              if (e.target.checked) {
                onSelect?.(contract)
              } else {
                onDeselect?.(contract)
              }
            }}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
        </div>
      )}

      {/* Card Header */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            {/* Contract Code */}
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-mono text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                {contract.contractCode}
              </span>
              {/* Type Badge */}
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${typeInfo.bgColor} ${typeInfo.color}`}>
                <TypeIcon className="h-3 w-3" />
                {t(typeInfo.label)}
              </span>
              {/* Status Badge - visible in header */}
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
                <StatusIcon className="h-3 w-3" />
                {t(statusInfo.label)}
              </span>
            </div>
            
            {/* Client Name */}
            <h3 className="font-medium text-gray-900 dark:text-white truncate">
              {client?.name || t('contracts.unknownClient', 'Unknown Client')}
            </h3>
          </div>

          {/* Action Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowMenu(!showMenu)
              }}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 z-20 w-48 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg py-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    navigate(`/contracts/view/${contract.id}`)
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Eye className="h-4 w-4" />
                  {t('common.viewDetails', 'View Details')}
                </button>

                {canEdit && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/contracts/${contract.id}/edit`)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Edit className="h-4 w-4" />
                    {t('common.edit', 'Edit')}
                  </button>
                )}

                {canEdit && contract.status === 'DRAFT' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleActivate()
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-green-600 dark:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Play className="h-4 w-4" />
                    {t('contracts.activate', 'Activate')}
                  </button>
                )}

                {canEdit && contract.status === 'ACTIVE' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSuspend()
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-yellow-600 dark:text-yellow-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Pause className="h-4 w-4" />
                    {t('contracts.suspend', 'Suspend')}
                  </button>
                )}

                {canEdit && contract.status === 'INACTIVE' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleActivate()
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-green-600 dark:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Play className="h-4 w-4" />
                    {t('contracts.resume', 'Resume')}
                  </button>
                )}

                {canEdit && (contract.status === 'ACTIVE' || contract.status === 'INACTIVE') && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleComplete()
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <CheckCircle className="h-4 w-4" />
                    {t('contracts.complete', 'Mark Complete')}
                  </button>
                )}

                <div className="border-t border-gray-100 dark:border-gray-700 my-1" />

                {canArchive && contract.status !== 'ARCHIVED' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleArchive()
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Archive className="h-4 w-4" />
                    {t('common.archive', 'Archive')}
                  </button>
                )}

                {canArchive && contract.status === 'ARCHIVED' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRestore()
                    }}
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

      {/* Card Body */}
      <div className="p-4 space-y-3">
        {/* Site Info */}
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <MapPin className="h-4 w-4 text-gray-400" />
          <span className="truncate">{site?.name || t('contracts.unknownSite', 'Unknown Site')}</span>
        </div>

        {/* Date Range */}
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span>{formatDateRange()}</span>
        </div>

        {/* Frequency (for permanent contracts) */}
        {contract.type === 'PERMANENT' && contract.frequency && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Clock className="h-4 w-4 text-gray-400" />
            <span>{t(frequencyLabels[contract.frequency])}</span>
          </div>
        )}

        {/* Pricing Info (if available) */}
        {contract.pricing && (
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {contract.pricing.monthlyFee && (
              <span>{contract.pricing.monthlyFee.toLocaleString()} {contract.pricing.currency}/mo</span>
            )}
            {!contract.pricing.monthlyFee && contract.pricing.perInterventionFee && (
              <span>{contract.pricing.perInterventionFee.toLocaleString()} {contract.pricing.currency}/intervention</span>
            )}
          </div>
        )}
      </div>

      {/* Card Footer */}
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900/50 rounded-b-xl border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
          {/* Status Badge */}
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
            <StatusIcon className="h-3.5 w-3.5" />
            {t(statusInfo.label)}
          </span>

          {/* Quick View Button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              navigate(`/contracts/view/${contract.id}`)
            }}
            className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            {t('common.viewDetails', 'View Details')} →
          </button>
        </div>
      </div>
    </div>
  )
}

export default ContractCard
