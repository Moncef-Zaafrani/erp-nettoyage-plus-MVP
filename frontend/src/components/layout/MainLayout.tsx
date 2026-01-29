import { useState, useEffect, useCallback } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Download, X, Smartphone } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { CommandPalette } from './CommandPalette'
import { WipModal } from './WipModal'
import { NotificationsDropdown, Notification } from './NotificationsDropdown'
import { NavItem } from '@/config/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { notificationsApi, attendanceApi } from '@/services/api'

export function MainLayout() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()

  // Sidebar state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed')
    return saved ? JSON.parse(saved) : false
  })

  // Mobile sidebar
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Command palette
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)

  // Notifications
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])

  // WIP modal
  const [wipItem, setWipItem] = useState<NavItem | null>(null)

  // Shift status (for agents/supervisors only)
  const [isOnShift, setIsOnShift] = useState<boolean | null>(null)
  const [shiftLoading, setShiftLoading] = useState(false)

  // Agent app download prompt
  const [showAppPrompt, setShowAppPrompt] = useState(() => {
    if (user?.role !== 'AGENT') return false
    const dismissed = localStorage.getItem('appPromptDismissed')
    return !dismissed
  })

  // Agents, supervisors, and admins can toggle shift (not super_admin or client)
  const canToggleShift = user?.role === 'AGENT' || user?.role === 'SUPERVISOR' || user?.role === 'ADMIN'

  // Load notifications from backend
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const data = await notificationsApi.getRecent(20)
        // Convert dates from string to Date objects
        setNotifications(data.map(n => ({ ...n, createdAt: new Date(n.createdAt) })))
      } catch (error) {
        console.error('Failed to load notifications:', error)
        // Keep empty array on error
        setNotifications([])
      }
    }
    loadNotifications()
  }, [])

  // Load shift status from backend (only for agents/supervisors)
  useEffect(() => {
    const loadShiftStatus = async () => {
      if (!canToggleShift) {
        setIsOnShift(null)
        return
      }
      try {
        const status = await attendanceApi.getStatus()
        setIsOnShift(status.isOnShift)
      } catch (error) {
        console.error('Failed to load shift status:', error)
        // Default to not on shift if API fails
        setIsOnShift(false)
      }
    }
    loadShiftStatus()
  }, [canToggleShift])

  // Listen for shift status changes from other components (ShiftStatusCard)
  useEffect(() => {
    const handleShiftChange = async () => {
      if (!canToggleShift) return
      try {
        const status = await attendanceApi.getStatus()
        setIsOnShift(status.isOnShift)
      } catch (error) {
        console.error('Failed to reload shift status:', error)
      }
    }
    window.addEventListener('shiftStatusChanged', handleShiftChange)
    return () => window.removeEventListener('shiftStatusChanged', handleShiftChange)
  }, [canToggleShift])

  // Save sidebar state
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(sidebarCollapsed))
  }, [sidebarCollapsed])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K for command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandPaletteOpen((prev) => !prev)
      }
      // Escape to close modals
      if (e.key === 'Escape') {
        if (commandPaletteOpen) setCommandPaletteOpen(false)
        if (notificationsOpen) setNotificationsOpen(false)
        if (mobileMenuOpen) setMobileMenuOpen(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [commandPaletteOpen, notificationsOpen, mobileMenuOpen])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  const handleToggleShift = useCallback(async () => {
    if (!canToggleShift || shiftLoading) return
    
    setShiftLoading(true)
    try {
      if (isOnShift) {
        await attendanceApi.clockOut({})
        setIsOnShift(false)
      } else {
        await attendanceApi.clockIn({})
        setIsOnShift(true)
      }
      // Dispatch custom event so dashboard can refresh
      window.dispatchEvent(new CustomEvent('shiftStatusChanged'))
    } catch (error) {
      console.error('Failed to toggle shift:', error)
      // Show error to user (could use a toast notification)
    } finally {
      setShiftLoading(false)
    }
  }, [canToggleShift, isOnShift, shiftLoading])

  const handleMarkAsRead = useCallback(async (id: string) => {
    try {
      await notificationsApi.markAsRead(id)
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }, [])

  const handleMarkAllAsRead = useCallback(async () => {
    try {
      await notificationsApi.markManyAsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }, [])

  const handleDeleteNotification = useCallback(async (id: string) => {
    try {
      await notificationsApi.delete(id)
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }, [])

  const handleNotificationClick = useCallback(
    (notification: Notification) => {
      if (notification.actionUrl) {
        navigate(notification.actionUrl)
        setNotificationsOpen(false)
      }
    },
    [navigate]
  )

  const handleDismissAppPrompt = useCallback(() => {
    setShowAppPrompt(false)
    localStorage.setItem('appPromptDismissed', 'true')
  }, [])

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((prev: boolean) => !prev)}
          onWipClick={setWipItem}
        />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="fixed inset-y-0 left-0 z-50 w-64" onClick={(e) => e.stopPropagation()}>
            <Sidebar collapsed={false} onToggle={() => setMobileMenuOpen(false)} onWipClick={setWipItem} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <div className="flex h-16 shrink-0 items-center gap-4 border-b border-gray-200 bg-white px-4 dark:border-gray-800 dark:bg-gray-900 lg:hidden">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex-1" />
        </div>

        {/* Desktop top bar */}
        <div className="hidden lg:block relative">
          <TopBar
            onOpenCommandPalette={() => setCommandPaletteOpen(true)}
            onOpenNotifications={() => setNotificationsOpen((prev) => !prev)}
            notificationCount={unreadCount}
            isOnShift={isOnShift}
            onToggleShift={canToggleShift ? handleToggleShift : undefined}
            shiftLoading={shiftLoading}
          />
          <NotificationsDropdown
            isOpen={notificationsOpen}
            onClose={() => setNotificationsOpen(false)}
            notifications={notifications}
            onMarkAsRead={handleMarkAsRead}
            onMarkAllAsRead={handleMarkAllAsRead}
            onDelete={handleDeleteNotification}
            onNotificationClick={handleNotificationClick}
          />
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Command palette */}
      <CommandPalette isOpen={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} onWipClick={setWipItem} />

      {/* WIP modal */}
      <WipModal item={wipItem} onClose={() => setWipItem(null)} />

      {/* Agent app download prompt */}
      {showAppPrompt && (
        <div className="fixed bottom-4 left-4 right-4 z-40 mx-auto max-w-md lg:left-auto lg:right-4 lg:mx-0">
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-start gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50">
                <Smartphone className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  {t('appPrompt.title', 'Get the mobile app')}
                </h4>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {t('appPrompt.description', 'Download our mobile app for a better experience on the go.')}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <a
                    href="#"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                  >
                    <Download className="h-4 w-4" />
                    {t('appPrompt.download', 'Download')}
                  </a>
                  <button
                    onClick={handleDismissAppPrompt}
                    className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                  >
                    {t('appPrompt.later', 'Maybe later')}
                  </button>
                </div>
              </div>
              <button
                onClick={handleDismissAppPrompt}
                className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
