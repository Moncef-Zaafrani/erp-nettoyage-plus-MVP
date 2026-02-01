import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  MoreHorizontal,
  Mail,
  Phone,
  Shield,
  UserCog,
  UserCheck,
  User as UserIcon,
  Eye,
  Edit,
  KeyRound,
  UserX,
  UserPlus,
  Check,
  BadgeCheck,
} from 'lucide-react'
import { User, UserRole } from '@/services/api'
import { useAuth } from '@/contexts/AuthContext'

interface UserCardProps {
  user: User
  isSelected?: boolean
  onSelect?: (user: User) => void
  onDeselect?: (user: User) => void
  onEdit?: (user: User) => void
  onViewProfile?: (user: User) => void
  onResetPassword?: (user: User) => void
  onDeactivate?: (user: User) => void
  onActivate?: (user: User) => void
  onVerifyEmail?: (user: User) => void
  selectionMode?: boolean
}

// Role icons and colors
const roleConfig: Record<UserRole, { icon: typeof Shield; color: string; bgColor: string }> = {
  SUPER_ADMIN: { icon: Shield, color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-100 dark:bg-purple-900/30' },
  ADMIN: { icon: Shield, color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  SUPERVISOR: { icon: UserCog, color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-100 dark:bg-amber-900/30' },
  AGENT: { icon: UserCheck, color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-900/30' },
  CLIENT: { icon: UserIcon, color: 'text-gray-600 dark:text-gray-400', bgColor: 'bg-gray-100 dark:bg-gray-700' },
}

// Status badge colors
const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  ACTIVE: { label: 'users.status.active', color: 'text-green-700 dark:text-green-300', bgColor: 'bg-green-100 dark:bg-green-900/50' },
  INACTIVE: { label: 'users.status.inactive', color: 'text-gray-700 dark:text-gray-300', bgColor: 'bg-gray-100 dark:bg-gray-700' },
  PENDING: { label: 'users.status.pending', color: 'text-amber-700 dark:text-amber-300', bgColor: 'bg-amber-100 dark:bg-amber-900/50' },
  ARCHIVED: { label: 'users.status.deactivated', color: 'text-red-700 dark:text-red-300', bgColor: 'bg-red-100 dark:bg-red-900/50' },
}

// Format relative time
function formatLastActive(date: string | null): string {
  if (!date) return 'Never'
  
  const now = new Date()
  const lastActive = new Date(date)
  const seconds = Math.floor((now.getTime() - lastActive.getTime()) / 1000)
  
  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`
  
  
  return lastActive.toLocaleDateString()
}

// Get initials from name
function getInitials(firstName: string | null, lastName: string | null, email: string): string {
  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase()
  }
  if (firstName) {
    return firstName.slice(0, 2).toUpperCase()
  }
  return email.slice(0, 2).toUpperCase()
}

// Get computed status (handles pending = emailVerified false)
function getComputedStatus(user: User): string {
  if (user.status === 'ARCHIVED') return 'ARCHIVED'
  if (user.status === 'INACTIVE') return 'INACTIVE'
  if (!user.emailVerified) return 'PENDING'
  return 'ACTIVE'
}

export function UserCard({
  user,
  isSelected = false,
  onSelect,
  onDeselect,
  onEdit,
  onViewProfile,
  onResetPassword,
  onDeactivate,
  onActivate,
  onVerifyEmail,
  selectionMode = false,
}: UserCardProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const fullName = user.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email
  const initials = getInitials(user.firstName, user.lastName, user.email)
  const computedStatus = getComputedStatus(user)
  const roleInfo = roleConfig[user.role]
  const statusInfo = statusConfig[computedStatus]
  const RoleIcon = roleInfo.icon

  // Determine permissions based on current user
  const canEdit = currentUser?.role === 'SUPER_ADMIN' || 
    (currentUser?.role === 'ADMIN' && !['SUPER_ADMIN', 'ADMIN'].includes(user.role)) ||
    (currentUser?.role === 'SUPERVISOR' && user.role === 'AGENT')
  const canResetPassword = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN'
  const canDeactivate = currentUser?.role === 'SUPER_ADMIN' || 
    (currentUser?.role === 'ADMIN' && !['SUPER_ADMIN', 'ADMIN'].includes(user.role))

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
        onDeselect?.(user)
      } else {
        onSelect?.(user)
      }
    } else {
      onViewProfile?.(user) || navigate(`/users/view/${user.id}`)
    }
  }

  // Handle checkbox click
  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isSelected) {
      onDeselect?.(user)
    } else {
      onSelect?.(user)
    }
  }

  return (
    <div
      onClick={handleCardClick}
      onContextMenu={handleContextMenu}
      className={`relative rounded-xl border-2 transition-all cursor-pointer shadow-sm ${
        isSelected
          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 ring-2 ring-emerald-500/30'
          : user.status === 'ARCHIVED'
            ? 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 opacity-75 hover:opacity-100 hover:border-gray-400 dark:hover:border-gray-500'
            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md'
      }`}
    >
      {/* Deactivated Indicator Banner */}
      {user.status === 'ARCHIVED' && (
        <div className="absolute top-0 left-0 right-0 bg-gray-500 dark:bg-gray-600 text-white text-xs font-medium text-center py-0.5 rounded-t-lg">
          {t('users.status.deactivated', 'Deactivated')}
        </div>
      )}
      
      {/* Selection Checkbox */}
      {selectionMode && (
        <div
          onClick={handleCheckboxClick}
          className={`absolute ${user.status === 'ARCHIVED' ? 'top-8' : 'top-3'} left-3 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors cursor-pointer ${
            isSelected
              ? 'bg-emerald-500 border-emerald-500'
              : 'bg-white dark:bg-gray-800 border-gray-400 dark:border-gray-500 hover:border-emerald-500'
          }`}
        >
          {isSelected && <Check className="w-3 h-3 text-white" />}
        </div>
      )}

      {/* Header with Avatar and Menu */}
      <div className={`p-4 pb-3 ${user.status === 'ARCHIVED' ? 'pt-8' : ''}`}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className={`relative flex h-12 w-12 items-center justify-center rounded-full ${roleInfo.bgColor} ${roleInfo.color} text-lg font-semibold`}>
              {user.profilePhotoUrl ? (
                <img
                  src={user.profilePhotoUrl}
                  alt={fullName}
                  className="h-12 w-12 rounded-full object-cover"
                />
              ) : (
                <span>{initials}</span>
              )}
            </div>

            {/* Name and Role */}
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                {fullName}
              </h3>
              <div className="flex items-center gap-1.5 text-sm">
                <RoleIcon className={`h-3.5 w-3.5 ${roleInfo.color}`} />
                <span className={roleInfo.color}>{t(`role.${user.role}`, user.role)}</span>
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
                    onViewProfile?.(user) || navigate(`/users/view/${user.id}`)
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Eye className="h-4 w-4" />
                  {t('users.actions.viewProfile', 'View Profile')}
                </button>

                {canEdit && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowMenu(false)
                      onEdit?.(user)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Edit className="h-4 w-4" />
                    {t('common.edit', 'Edit')}
                  </button>
                )}

                {canResetPassword && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowMenu(false)
                      onResetPassword?.(user)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <KeyRound className="h-4 w-4" />
                    {t('users.actions.resetPassword', 'Reset Password')}
                  </button>
                )}

                {canResetPassword && !user.emailVerified && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowMenu(false)
                      onVerifyEmail?.(user)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                  >
                    <BadgeCheck className="h-4 w-4" />
                    {t('users.actions.verifyEmail', 'Verify Email')}
                  </button>
                )}

                {selectionMode && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowMenu(false)
                      if (isSelected) {
                        onDeselect?.(user)
                      } else {
                        onSelect?.(user)
                      }
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Check className="h-4 w-4" />
                    {t('users.actions.select', 'Select')}
                  </button>
                )}

                {canDeactivate && (
                  <>
                    <div className="my-1 border-t border-gray-200 dark:border-gray-700" />
                    {computedStatus === 'ARCHIVED' || computedStatus === 'INACTIVE' ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowMenu(false)
                          onActivate?.(user)
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
                      >
                        <UserPlus className="h-4 w-4" />
                        {t('users.actions.activate', 'Activate')}
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowMenu(false)
                          onDeactivate?.(user)
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <UserX className="h-4 w-4" />
                        {t('users.actions.deactivate', 'Deactivate')}
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
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <span className="truncate">{user.email}</span>
        </div>
        {user.phone && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <span>{user.phone}</span>
          </div>
        )}
      </div>

      {/* Footer with Status and Last Active */}
      <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
          {t(statusInfo.label)}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {formatLastActive(user.lastLoginAt)}
        </span>
      </div>
    </div>
  )
}

export default UserCard
