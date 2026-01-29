import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  MoreHorizontal,
  MapPin,
  Phone,
  Mail,
  Building2,
  Eye,
  Edit,
  Archive,
  RotateCcw,
  Check,
  Clock,
  Ruler,
  User as UserIcon,
} from 'lucide-react'
import { Site, SiteSize, SiteStatus, Client } from '@/services/api'
import { useAuth } from '@/contexts/AuthContext'

interface SiteCardProps {
  site: Site
  client?: Client
  isSelected?: boolean
  onSelect?: (site: Site) => void
  onDeselect?: (site: Site) => void
  onEdit?: (site: Site) => void
  onViewDetails?: (site: Site) => void
  onArchive?: (site: Site) => void
  onRestore?: (site: Site) => void
  selectionMode?: boolean
}

// Site size icons and colors
const sizeConfig: Record<SiteSize, { label: string; color: string; bgColor: string }> = {
  SMALL: { label: 'sites.size.small', color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-900/30' },
  MEDIUM: { label: 'sites.size.medium', color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  LARGE: { label: 'sites.size.large', color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-100 dark:bg-purple-900/30' },
}

// Status badge colors
const statusConfig: Record<SiteStatus, { label: string; color: string; bgColor: string }> = {
  ACTIVE: { label: 'sites.status.active', color: 'text-green-700 dark:text-green-300', bgColor: 'bg-green-100 dark:bg-green-900/50' },
  INACTIVE: { label: 'sites.status.inactive', color: 'text-gray-700 dark:text-gray-300', bgColor: 'bg-gray-100 dark:bg-gray-700' },
  ARCHIVED: { label: 'sites.status.archived', color: 'text-red-700 dark:text-red-300', bgColor: 'bg-red-100 dark:bg-red-900/50' },
}

export function SiteCard({
  site,
  client,
  isSelected = false,
  onSelect,
  onDeselect,
  onEdit,
  onViewDetails,
  onArchive,
  onRestore,
  selectionMode = false,
}: SiteCardProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const sizeInfo = sizeConfig[site.size] || sizeConfig.MEDIUM
  const statusInfo = statusConfig[site.status] || statusConfig.ACTIVE

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
        onDeselect?.(site)
      } else {
        onSelect?.(site)
      }
    } else {
      onViewDetails?.(site) || navigate(`/sites/view/${site.id}`)
    }
  }

  // Handle checkbox click
  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isSelected) {
      onDeselect?.(site)
    } else {
      onSelect?.(site)
    }
  }

  // Get display client name
  const clientName = site.client?.name || client?.name || t('sites.noClient', 'No client')

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

      {/* Header with Icon and Menu */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between">
          {/* Site Icon and Name */}
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${sizeInfo.bgColor}`}>
              <MapPin className={`w-6 h-6 ${sizeInfo.color}`} />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                {site.name}
              </h3>
              <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                <Building2 className="w-3.5 h-3.5" />
                <span className="truncate">{clientName}</span>
              </div>
            </div>
          </div>

          {/* Menu Button */}
          <div ref={menuRef} className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowMenu(!showMenu)
              }}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-700 transition-colors"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 z-20 w-48 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg py-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowMenu(false)
                    onViewDetails?.(site) || navigate(`/sites/view/${site.id}`)
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Eye className="w-4 h-4" />
                  {t('common.viewDetails', 'View Details')}
                </button>

                {canEdit && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowMenu(false)
                      onEdit?.(site) || navigate(`/sites/${site.id}/edit`)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Edit className="w-4 h-4" />
                    {t('common.edit', 'Edit')}
                  </button>
                )}

                {canArchive && site.status !== 'ARCHIVED' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowMenu(false)
                      onArchive?.(site)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Archive className="w-4 h-4" />
                    {t('common.archive', 'Archive')}
                  </button>
                )}

                {canArchive && site.status === 'ARCHIVED' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowMenu(false)
                      onRestore?.(site)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
                  >
                    <RotateCcw className="w-4 h-4" />
                    {t('common.restore', 'Restore')}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-4 space-y-3">
        {/* Status and Size Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
            {t(statusInfo.label)}
          </span>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${sizeInfo.bgColor} ${sizeInfo.color}`}>
            <Ruler className="w-3 h-3" />
            {t(sizeInfo.label)}
          </span>
        </div>

        {/* Address */}
        {(site.address || site.city) && (
          <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span className="truncate">
              {[site.address, site.city, site.country].filter(Boolean).join(', ')}
            </span>
          </div>
        )}

        {/* Working Hours */}
        {site.workingHours && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Clock className="w-4 h-4 flex-shrink-0" />
            <span>{site.workingHours}</span>
          </div>
        )}

        {/* Contact Info */}
        {(site.contactPerson || site.contactPhone) && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <UserIcon className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">
              {site.contactPerson}
              {site.contactPhone && ` • ${site.contactPhone}`}
            </span>
          </div>
        )}

        {/* Contact Phone */}
        {site.contactPhone && !site.contactPerson && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Phone className="w-4 h-4 flex-shrink-0" />
            <span>{site.contactPhone}</span>
          </div>
        )}

        {/* Contact Email */}
        {site.contactEmail && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Mail className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{site.contactEmail}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default SiteCard
