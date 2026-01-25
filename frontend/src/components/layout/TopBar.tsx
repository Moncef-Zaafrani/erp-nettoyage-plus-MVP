import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, Command, Bell, Moon, Sun, Globe, ChevronDown, LogOut, User, Settings, Clock, AlertCircle, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth, UserRole } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'

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
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showLangMenu, setShowLangMenu] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const langMenuRef = useRef<HTMLDivElement>(null)

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false)
      }
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setShowLangMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const languages = [
    { code: 'en', label: 'English', flag: 'US' },
    { code: 'fr', label: 'Français', flag: 'FR' },
    { code: 'ar', label: 'العربية', flag: 'MR' },
  ]

  const currentLang = languages.find((l) => l.code === i18n.language) || languages[0]

  const roleColors: Record<UserRole, string> = {
    SUPER_ADMIN: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
    ADMIN: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
    SUPERVISOR: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
    AGENT: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300',
    CLIENT: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  }

  // Check if this role should show shift status (agents and supervisors only, not admin/super_admin)
  const showShiftStatus = user?.role === 'AGENT' || user?.role === 'SUPERVISOR'

  return (
    <header className={cn(
      "flex h-16 shrink-0 items-center justify-between border-b px-4 lg:px-6 transition-colors",
      // Add red border and background tint when off shift
      showShiftStatus && isOnShift === false
        ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
        : "border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
    )}>
      {/* Search */}
      <div className="flex flex-1 items-center">
        <button
          onClick={onOpenCommandPalette}
          className="group flex w-full max-w-md items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-left transition-colors hover:border-gray-300 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600 dark:hover:bg-gray-700"
        >
          <Search className="h-4 w-4 text-gray-400" />
          <span className="flex-1 text-sm text-gray-500 dark:text-gray-400">{t('search.placeholder', 'Search...')}</span>
          <kbd className="hidden items-center gap-1 rounded border border-gray-200 bg-white px-1.5 py-0.5 text-xs font-medium text-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400 sm:flex">
            <Command className="h-3 w-3" />K
          </kbd>
        </button>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-2">
        {/* Shift status warning for agents/supervisors - more prominent when off shift */}
        {showShiftStatus && isOnShift === false && (
          <button
            onClick={onToggleShift}
            disabled={shiftLoading}
            className="mr-2 flex items-center gap-2 rounded-lg bg-red-100 px-4 py-2 text-sm font-semibold text-red-700 shadow-sm ring-1 ring-red-200 transition-all hover:bg-red-200 hover:shadow-md dark:bg-red-900/50 dark:text-red-300 dark:ring-red-800 dark:hover:bg-red-900/70 animate-pulse"
          >
            <AlertCircle className="h-5 w-5" />
            <span>{shiftLoading ? t('common.loading', 'Loading...') : t('shift.clickToStart', 'Click to Start Shift')}</span>
          </button>
        )}
        
        {/* On shift indicator */}
        {showShiftStatus && isOnShift === true && (
          <div className="mr-2 flex items-center gap-1.5 rounded-lg bg-green-100 px-3 py-1.5 text-sm font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="hidden sm:inline">{t('shift.onShift', 'On Shift')}</span>
          </div>
        )}

        {/* Language switcher */}
        <div className="relative" ref={langMenuRef}>
          <button
            onClick={() => setShowLangMenu(!showLangMenu)}
            className="flex items-center gap-1 rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            title={t('language.switch', 'Switch language')}
          >
            <Globe className="h-5 w-5" />
            <span className="hidden text-sm sm:inline">{currentLang.flag}</span>
          </button>
          {showLangMenu && (
            <div className="absolute right-0 top-full z-50 mt-1 w-40 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    i18n.changeLanguage(lang.code)
                    setShowLangMenu(false)
                  }}
                  className={cn(
                    'flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-700',
                    i18n.language === lang.code && 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                  )}
                >
                  <span>{lang.flag}</span>
                  <span>{lang.label}</span>
                  {i18n.language === lang.code && <Check className="ml-auto h-4 w-4" />}
                </button>
              ))}
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

        {/* User menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {/* Avatar */}
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-sm font-semibold text-white">
              {user?.firstName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="hidden text-left lg:block">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.email}
              </p>
              <p className={cn('inline-block rounded px-1.5 py-0.5 text-[10px] font-medium uppercase', roleColors[user?.role || 'CLIENT'])}>
                {t(`roles.${user?.role}`, { defaultValue: user?.role || '' })}
              </p>
            </div>
            <ChevronDown className="hidden h-4 w-4 text-gray-400 lg:block" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
              {/* User info for mobile */}
              <div className="border-b border-gray-200 px-3 py-2 dark:border-gray-700 lg:hidden">
                <p className="font-medium text-gray-900 dark:text-white">
                  {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.email}
                </p>
                <p className={cn('mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-medium uppercase', roleColors[user?.role || 'CLIENT'])}>
                  {t(`roles.${user?.role}`, { defaultValue: user?.role || '' })}
                </p>
              </div>

              {/* Menu items */}
              <a
                href="/profile"
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <User className="h-4 w-4" />
                {t('menu.profile', 'My Profile')}
              </a>
              <a
                href="/settings"
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <Settings className="h-4 w-4" />
                {t('menu.settings', 'Settings')}
              </a>

              {/* Shift toggle for agents/supervisors */}
              {showShiftStatus && onToggleShift && (
                <>
                  <div className="my-1 border-t border-gray-200 dark:border-gray-700" />
                  <button
                    onClick={() => {
                      onToggleShift()
                      setShowUserMenu(false)
                    }}
                    className={cn(
                      'flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors',
                      isOnShift
                        ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30'
                        : 'text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/30'
                    )}
                  >
                    <Clock className="h-4 w-4" />
                    {isOnShift ? t('shift.endShift', 'End Shift') : t('shift.startShift', 'Start Shift')}
                  </button>
                </>
              )}

              <div className="my-1 border-t border-gray-200 dark:border-gray-700" />
              <button
                onClick={() => {
                  logout()
                  setShowUserMenu(false)
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
              >
                <LogOut className="h-4 w-4" />
                {t('menu.logout', 'Logout')}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
