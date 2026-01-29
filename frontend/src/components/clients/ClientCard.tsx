import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  MoreHorizontal,
  Mail,
  Phone,
  MapPin,
  Building2,
  User as UserIcon,
  Eye,
  Edit,
  FileText,
  Archive,
  RotateCcw,
  Check,
  Calendar,
  Briefcase,
} from 'lucide-react'
import { Client, ClientType } from '@/services/api'
import { useAuth } from '@/contexts/AuthContext'

interface ClientCardProps {
  client: Client
  isSelected?: boolean
  onSelect?: (client: Client) => void
  onDeselect?: (client: Client) => void
  onEdit?: (client: Client) => void
  onViewDetails?: (client: Client) => void
  onViewContracts?: (client: Client) => void
  onArchive?: (client: Client) => void
  onRestore?: (client: Client) => void
  selectionMode?: boolean
}

// Client type icons and colors
const typeConfig: Record<ClientType, { icon: typeof Building2; color: string; bgColor: string }> = {
  COMPANY: { icon: Building2, color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  INDIVIDUAL: { icon: UserIcon, color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-900/30' },
  MULTI_SITE: { icon: Building2, color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-100 dark:bg-purple-900/30' },
}

// Status badge colors
const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  CURRENT: { label: 'clients.status.current', color: 'text-green-700 dark:text-green-300', bgColor: 'bg-green-100 dark:bg-green-900/50' },
  PROSPECT: { label: 'clients.status.prospect', color: 'text-amber-700 dark:text-amber-300', bgColor: 'bg-amber-100 dark:bg-amber-900/50' },
  ARCHIVED: { label: 'clients.status.archived', color: 'text-red-700 dark:text-red-300', bgColor: 'bg-red-100 dark:bg-red-900/50' },
}

// Format date for member since
function formatMemberSince(date: string | null): string {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
}

export function ClientCard({
  client,
  isSelected = false,
  onSelect,
  onDeselect,
  onEdit,
  onViewDetails,
  onViewContracts,
  onArchive,
  onRestore,
  selectionMode = false,
}: ClientCardProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const typeInfo = typeConfig[client.type] || typeConfig.COMPANY
  const statusInfo = statusConfig[client.status] || statusConfig.ACTIVE
  const TypeIcon = typeInfo.icon

  // Determine permissions based on current user
  const canEdit = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN'
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
        onDeselect?.(client)
      } else {
        onSelect?.(client)
      }
    } else {
      onViewDetails?.(client) || navigate(`/clients/view/${client.id}`)
    }
  }

  // Handle checkbox click
  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isSelected) {
      onDeselect?.(client)
    } else {
      onSelect?.(client)
    }
  }

  return (
    <div
      onClick={handleCardClick}
      onContextMenu={handleContextMenu}
      className={`relative rounded-xl border-2 transition-all cursor-pointer shadow-sm ${
        isSelected
          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 ring-2 ring-emerald-500/30'
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md'
      }`}
    >
      {/* Selection Checkbox */}
      {selectionMode && (
        <div
          onClick={handleCheckboxClick}
          className={`absolute top-3 left-3 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors cursor-pointer ${
            isSelected
              ? 'bg-emerald-500 border-emerald-500'
              : 'bg-white dark:bg-gray-800 border-gray-400 dark:border-gray-500 hover:border-emerald-500'
          }`}
        >
          {isSelected && <Check className="w-3 h-3 text-white" />}
        </div>
      )}

      {/* Header with Avatar and Menu */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* Avatar / Icon */}
            <div className={`relative flex h-12 w-12 items-center justify-center rounded-full ${typeInfo.bgColor}`}>
              <TypeIcon className={`h-6 w-6 ${typeInfo.color}`} />
            </div>

            {/* Name and Type */}
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                {client.name}
              </h3>
              <div className="flex items-center gap-1.5 text-sm">
                <span className={`${typeInfo.color} capitalize`}>
                  {t(`clients.type.${client.type.toLowerCase()}`, client.type)}
                </span>
              </div>
            </div>
          </div>

          {/* Actions Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowMenu(!showMenu)
              }}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <MoreHorizontal className="h-5 w-5 text-gray-400" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-1 z-50 w-48 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg py-1">
                <div className="px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('common.actions', 'Actions')}
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowMenu(false)
                    onViewDetails?.(client) || navigate(`/clients/view/${client.id}`)
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Eye className="h-4 w-4" />
                  {t('clients.actions.viewDetails', 'View Details')}
                </button>

                {canEdit && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowMenu(false)
                      onEdit?.(client)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Edit className="h-4 w-4" />
                    {t('common.edit', 'Edit')}
                  </button>
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowMenu(false)
                    onViewContracts?.(client) || navigate(`/clients/view/${client.id}`)
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <FileText className="h-4 w-4" />
                  {t('clients.actions.viewContracts', 'View Contracts')}
                </button>

                {selectionMode && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowMenu(false)
                      if (isSelected) {
                        onDeselect?.(client)
                      } else {
                        onSelect?.(client)
                      }
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Check className="h-4 w-4" />
                    {t('clients.actions.select', 'Select')}
                  </button>
                )}

                {canArchive && (
                  <>
                    <div className="my-1 border-t border-gray-200 dark:border-gray-700" />
                    {client.status === 'ARCHIVED' ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowMenu(false)
                          onRestore?.(client)
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
                      >
                        <RotateCcw className="h-4 w-4" />
                        {t('clients.actions.restore', 'Restore')}
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowMenu(false)
                          onArchive?.(client)
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Archive className="h-4 w-4" />
                        {t('clients.actions.archive', 'Archive')}
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="px-4 pb-3 space-y-1.5">
        {client.contactPerson && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <UserIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <span className="truncate">{client.contactPerson}</span>
          </div>
        )}
        {client.email && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <span className="truncate">{client.email}</span>
          </div>
        )}
        {client.phone && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <span>{client.phone}</span>
          </div>
        )}
        {client.address && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <span className="truncate">{client.address}</span>
          </div>
        )}
      </div>

      {/* Stats Row */}
      <div className="px-4 pb-3 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
        {client.sitesCount !== undefined && (
          <div className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            <span>{client.sitesCount} {t('clients.sites', 'sites')}</span>
          </div>
        )}
        {client.activeContractsCount !== undefined && (
          <div className="flex items-center gap-1">
            <Briefcase className="h-3.5 w-3.5" />
            <span>{client.activeContractsCount} {t('clients.contracts', 'contracts')}</span>
          </div>
        )}
      </div>

      {/* Footer with Status and Member Since */}
      <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
          {t(statusInfo.label)}
        </span>
        {client.createdAt && (
          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            <Calendar className="h-3.5 w-3.5" />
            <span>{t('clients.memberSince', 'Member since')} {formatMemberSince(client.createdAt)}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default ClientCard
