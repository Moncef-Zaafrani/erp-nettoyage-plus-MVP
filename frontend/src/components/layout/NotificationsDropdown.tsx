import { useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Bell, Check, CheckCheck, Settings, Trash2, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from '@/lib/date'

export interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message?: string
  read: boolean
  createdAt: Date
  actionUrl?: string
}

interface NotificationsDropdownProps {
  isOpen: boolean
  onClose: () => void
  notifications: Notification[]
  onMarkAsRead: (id: string) => void
  onMarkAllAsRead: () => void
  onDelete: (id: string) => void
  onNotificationClick?: (notification: Notification) => void
}

export function NotificationsDropdown({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onNotificationClick,
}: NotificationsDropdownProps) {
  const { t } = useTranslation()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const unreadCount = notifications.filter((n) => !n.read).length

  const typeColors = {
    info: 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400',
    success: 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400',
    warning: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/50 dark:text-yellow-400',
    error: 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400',
  }

  const typeIcons = {
    info: Bell,
    success: Check,
    warning: Bell,
    error: Bell,
  }

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full z-50 mt-1 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800 sm:w-96"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900 dark:text-white">{t('notifications.title', 'Notifications')}</h3>
          {unreadCount > 0 && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-100 px-1.5 text-xs font-semibold text-blue-600 dark:bg-blue-900/50 dark:text-blue-400">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              title={t('notifications.markAllRead', 'Mark all as read')}
            >
              <CheckCheck className="h-4 w-4" />
            </button>
          )}
          <a
            href="/settings/notifications"
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            title={t('notifications.settings', 'Notification settings')}
          >
            <Settings className="h-4 w-4" />
          </a>
        </div>
      </div>

      {/* Notifications list */}
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
              <Bell className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{t('notifications.empty', 'No notifications')}</p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t('notifications.emptyDescription', "You're all caught up!")}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {notifications.map((notification) => {
              const Icon = typeIcons[notification.type]
              return (
                <div
                  key={notification.id}
                  className={cn(
                    'group relative flex gap-3 px-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50',
                    !notification.read && 'bg-blue-50/50 dark:bg-blue-900/10'
                  )}
                >
                  {/* Unread indicator */}
                  {!notification.read && (
                    <div className="absolute left-1 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-blue-600" />
                  )}

                  {/* Icon */}
                  <div className={cn('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full', typeColors[notification.type])}>
                    <Icon className="h-4 w-4" />
                  </div>

                  {/* Content */}
                  <div
                    className="min-w-0 flex-1 cursor-pointer"
                    onClick={() => {
                      if (!notification.read) onMarkAsRead(notification.id)
                      onNotificationClick?.(notification)
                    }}
                  >
                    <p className={cn('text-sm', notification.read ? 'text-gray-700 dark:text-gray-300' : 'font-medium text-gray-900 dark:text-white')}>
                      {notification.title}
                    </p>
                    {notification.message && (
                      <p className="mt-0.5 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">{notification.message}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                      {formatDistanceToNow(notification.createdAt)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 items-start gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    {notification.actionUrl && (
                      <a
                        href={notification.actionUrl}
                        className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-600 dark:hover:text-gray-300"
                        title={t('notifications.view', 'View')}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onDelete(notification.id)
                      }}
                      className="rounded p-1 text-gray-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                      title={t('notifications.delete', 'Delete')}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="border-t border-gray-200 p-2 dark:border-gray-700">
          <a
            href="/notifications"
            className="flex items-center justify-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30"
          >
            {t('notifications.viewAll', 'View all notifications')}
          </a>
        </div>
      )}
    </div>
  )
}
