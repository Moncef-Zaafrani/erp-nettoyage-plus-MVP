import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, Command, Bell, Moon, Sun, Globe, AlertCircle, Check, Flag, Clock, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { ReportIssueModal } from '@/components/dashboard/ReportIssueModal'

interface TopBarProps {
  onOpenCommandPalette: () => void
  onOpenNotifications: () => void
  notificationCount?: number
  isOnShift?: boolean | null
  onToggleShift?: () => void
  shiftLoading?: boolean
}

export function TopBar({ onOpenCommandPalette, onOpenNotifications, notificationCount = 0, isOnShift, onToggleShift, shiftLoading }: TopBarProps) {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const { theme, setTheme } = useTheme()
  const [showLangMenu, setShowLangMenu] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const langMenuRef = useRef<HTMLDivElement>(null)

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setShowLangMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const languages = [
    { code: 'fr', label: 'Français', flag: '🇫🇷', available: true },
    { code: 'en', label: 'English', flag: '🇺🇸', available: false },
    { code: 'ar', label: 'العربية', flag: '🇲🇷', available: false },
  ]
  const [showLangPhase2Modal, setShowLangPhase2Modal] = useState(false)

  // Check if this role should show shift status (admins, agents, and supervisors - not super_admin or client)
  const showShiftStatus = user?.role === 'AGENT' || user?.role === 'SUPERVISOR' || user?.role === 'ADMIN'
  
  // Check if user can report issues
  const canReportIssue = user?.role !== 'SUPER_ADMIN' && user?.role !== 'CLIENT'

  return (
    <header className={cn(
      "flex h-14 shrink-0 items-center justify-between border-b px-4 lg:px-6 transition-colors",
      // Add subtle background tint when off shift
      showShiftStatus && isOnShift === false
        ? "border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/30"
        : "border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
    )}>
      {/* Search */}
      <div className="flex flex-1 items-center justify-center">
        <button
          onClick={onOpenCommandPalette}
          className="group flex w-full max-w-lg items-center gap-3 rounded-lg border border-gray-200 bg-gray-50/50 px-4 py-2 text-left transition-all hover:border-gray-300 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800/50 dark:hover:border-gray-600 dark:hover:bg-gray-700"
        >
          <Search className="h-4 w-4 text-gray-400" />
          <span className="flex-1 text-sm text-gray-500 dark:text-gray-400">{t('search.placeholder', 'Search...')}</span>
          <kbd className="hidden items-center gap-1 rounded border border-gray-200 bg-white px-1.5 py-0.5 text-xs font-medium text-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400 sm:flex">
            <Command className="h-3 w-3" />K
          </kbd>
        </button>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-1">
        {/* Shift status warning - compact */}
        {showShiftStatus && isOnShift === false && (
          <button
            onClick={onToggleShift}
            disabled={shiftLoading}
            className="mr-2 flex items-center gap-2 rounded-lg bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700 ring-1 ring-red-200 transition-all hover:bg-red-200 dark:bg-red-900/50 dark:text-red-300 dark:ring-red-800 dark:hover:bg-red-900/70 animate-pulse"
          >
            <AlertCircle className="h-4 w-4" />
            <span className="hidden sm:inline">{shiftLoading ? t('common.loading', 'Loading...') : t('shift.startShift', 'Start Shift')}</span>
          </button>
        )}
        
        {/* On shift indicator with end button */}
        {showShiftStatus && isOnShift === true && (
          <button
            onClick={onToggleShift}
            disabled={shiftLoading}
            className="mr-2 flex items-center gap-1.5 rounded-lg bg-green-100 px-2.5 py-1.5 text-xs font-medium text-green-700 transition-colors hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50"
            title={t('shift.endShift', 'End Shift')}
          >
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <Clock className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t('shift.onShift', 'On Shift')}</span>
          </button>
        )}

        {/* Report Issue button */}
        {canReportIssue && (
          <button
            onClick={() => setShowReportModal(true)}
            className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            title={t('dashboard.reportIssue', 'Report an Issue')}
          >
            <Flag className="h-5 w-5" />
          </button>
        )}

        {/* Language switcher */}
        <div className="relative" ref={langMenuRef}>
          <button
            onClick={() => setShowLangMenu(!showLangMenu)}
            className="flex items-center gap-1 rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            title={t('language.switch', 'Switch language')}
          >
            <Globe className="h-5 w-5" />
          </button>
          {showLangMenu && (
            <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    if (lang.available) {
                      i18n.changeLanguage(lang.code)
                      localStorage.setItem('language', lang.code)
                      setShowLangMenu(false)
                    } else {
                      setShowLangMenu(false)
                      setShowLangPhase2Modal(true)
                    }
                  }}
                  className={cn(
                    'flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors',
                    lang.available 
                      ? 'hover:bg-gray-100 dark:hover:bg-gray-700' 
                      : 'opacity-50 cursor-not-allowed',
                    i18n.language === lang.code && 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                  )}
                >
                  <span>{lang.flag}</span>
                  <span className={!lang.available ? 'text-gray-400 dark:text-gray-500' : ''}>{lang.label}</span>
                  {!lang.available && (
                    <span className="ml-auto text-xs bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded">
                      Phase 2
                    </span>
                  )}
                  {lang.available && i18n.language === lang.code && <Check className="ml-auto h-4 w-4" />}
                </button>
              ))}
            </div>
          )}

          {/* Phase 2 Language Modal */}
          {showLangPhase2Modal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowLangPhase2Modal(false)}>
              <div className="relative mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-800" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setShowLangPhase2Modal(false)}
                  className="absolute right-4 top-4 rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                >
                  <X className="h-5 w-5" />
                </button>
                <div className="mb-4 flex justify-center">
                  <div className="relative">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600">
                      <Globe className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </div>
                <h2 className="mb-2 text-center text-xl font-semibold text-gray-900 dark:text-white">
                  {t('wip.title', 'Coming Soon!')}
                </h2>
                <p className="mb-4 text-center text-lg font-medium text-blue-600 dark:text-blue-400">
                  {t('language.multiLanguage', 'Multi-language Support')}
                </p>
                <p className="mb-6 text-center text-sm text-gray-600 dark:text-gray-400">
                  {t('language.phase2Message', 'English and Arabic translations are coming in Phase 2. The application is currently available in French only.')}
                </p>
                <div className="mb-6 flex items-center justify-center gap-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {t('wip.phase', 'Planned for Phase {{phase}}', { phase: 2 })}
                  </span>
                </div>
                <button
                  onClick={() => setShowLangPhase2Modal(false)}
                  className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                >
                  {t('wip.gotIt', 'Got it!')}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          title={t('theme.toggle', 'Toggle theme')}
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        {/* Notifications */}
        <button
          onClick={onOpenNotifications}
          className="relative rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          title={t('notifications.title', 'Notifications')}
        >
          <Bell className="h-5 w-5" />
          {notificationCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {notificationCount > 99 ? '99+' : notificationCount}
            </span>
          )}
        </button>
      </div>

      {/* Report Issue Modal */}
      <ReportIssueModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
      />
    </header>
  )
}
