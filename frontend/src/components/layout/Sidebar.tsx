import { useState, useRef, useEffect } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, User, Settings, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { getNavigationConfig, NavItem, NavSection } from '@/config/navigation'
import Logo from './Logo'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  onWipClick?: (item: NavItem) => void
}

export function Sidebar({ collapsed, onToggle, onWipClick }: SidebarProps) {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [showUserMenu, setShowUserMenu] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!user) return null

  const navSections = getNavigationConfig(user.role)

  const toggleExpanded = (itemId: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev)
      if (next.has(itemId)) {
        next.delete(itemId)
      } else {
        next.add(itemId)
      }
      return next
    })
  }

  const isActive = (href?: string) => {
    if (!href) return false
    // Exact match
    if (location.pathname === href) return true
    // For routes like /users, only match exactly - don't match /users/admins
    // For routes like /users/admins, match /users/admins and /users/admins/xxx
    if (href === '/users' || href === '/clients') {
      return location.pathname === href
    }
    return location.pathname.startsWith(href + '/')
  }

  const isChildActive = (item: NavItem) => {
    if (!item.children) return false
    return item.children.some((child) => isActive(child.href))
  }

  const renderNavItem = (item: NavItem, depth: number = 0) => {
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems.has(item.id)
    const active = isActive(item.href) || isChildActive(item)
    const Icon = item.icon

    const handleClick = (e: React.MouseEvent) => {
      if (item.wip) {
        e.preventDefault()
        onWipClick?.(item)
        return
      }
      if (hasChildren) {
        e.preventDefault()
        toggleExpanded(item.id)
      }
    }

    const content = (
      <>
        <Icon
          className={cn(
            'h-5 w-5 shrink-0 transition-colors',
            active ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400',
            item.wip && 'opacity-50'
          )}
        />
        {!collapsed && (
          <>
            <span
              className={cn(
                'flex-1 truncate text-sm font-medium transition-colors',
                active ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300',
                item.wip && 'opacity-50'
              )}
            >
              {t(item.labelKey, item.label)}
            </span>
            {item.badge && (
              <span
                className={cn(
                  'ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-semibold',
                  item.badgeColor === 'error' && 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
                  item.badgeColor === 'warning' && 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300',
                  item.badgeColor === 'success' && 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
                  (!item.badgeColor || item.badgeColor === 'default') && 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                )}
              >
                {item.badge}
              </span>
            )}
            {hasChildren && (
              <span className="ml-2">
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                )}
              </span>
            )}
            {item.wip && (
              <span className="ml-2 rounded bg-gray-200 px-1.5 py-0.5 text-[10px] font-medium uppercase text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                {t('nav.wip', 'WIP')}
              </span>
            )}
          </>
        )}
      </>
    )

    const itemClasses = cn(
      'group flex items-center gap-3 rounded-lg px-3 py-2 transition-all duration-150',
      depth > 0 && !collapsed && 'ml-4 pl-4 border-l border-gray-200 dark:border-gray-700',
      active && !item.wip && 'bg-blue-50 dark:bg-blue-900/20',
      !active && !item.wip && 'hover:bg-gray-100 dark:hover:bg-gray-800',
      item.wip && 'cursor-not-allowed',
      collapsed && 'justify-center px-2'
    )

    if (item.wip || hasChildren) {
      return (
        <div key={item.id}>
          <button onClick={handleClick} className={cn(itemClasses, 'w-full text-left')} title={collapsed ? t(item.labelKey, item.label) : undefined}>
            {content}
          </button>
          {hasChildren && isExpanded && !collapsed && (
            <div className="mt-1 space-y-1">
              {item.children!.map((child) => renderNavItem(child, depth + 1))}
            </div>
          )}
        </div>
      )
    }

    return (
      <NavLink
        key={item.id}
        to={item.href!}
        className={itemClasses}
        title={collapsed ? t(item.labelKey, item.label) : undefined}
      >
        {content}
      </NavLink>
    )
  }

  const renderSection = (section: NavSection, index: number) => {
    return (
      <div key={section.id} className={cn(index > 0 && 'mt-6')}>
        {section.title && !collapsed && (
          <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            {t(section.titleKey || '', section.title)}
          </h3>
        )}
        {collapsed && index > 0 && (
          <div className="mx-3 mb-2 border-t border-gray-200 dark:border-gray-700" />
        )}
        <nav className="space-y-1">{section.items.map((item) => renderNavItem(item))}</nav>
      </div>
    )
  }

  return (
    <aside
      className={cn(
        'flex h-screen flex-col border-r border-gray-200 bg-white transition-all duration-300 dark:border-gray-800 dark:bg-gray-900',
        collapsed ? 'w-[68px]' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className={cn('flex h-16 shrink-0 items-center border-b border-gray-200 dark:border-gray-800', collapsed ? 'justify-center px-2' : 'px-4')}>
        <Logo collapsed={collapsed} />
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-2 py-4">
        {navSections.map((section, index) => renderSection(section, index))}
      </div>

      {/* User Profile Section */}
      <div className="shrink-0 border-t border-gray-200 dark:border-gray-700" ref={userMenuRef}>
        <div className="relative">
          <button
            onClick={() => !collapsed && setShowUserMenu(!showUserMenu)}
            className={cn(
              'flex w-full items-center gap-3 p-3 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800',
              collapsed && 'justify-center'
            )}
          >
            {/* Avatar */}
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-sm font-semibold text-white">
              {user?.firstName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            {!collapsed && (
              <>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : 'User'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {t(`roles.${user?.role}`, user?.role)}
                  </p>
                </div>
                <ChevronUp className={cn('h-4 w-4 text-gray-400 transition-transform', showUserMenu && 'rotate-180')} />
              </>
            )}
          </button>

          {/* User dropdown menu */}
          {showUserMenu && !collapsed && (
            <div className="absolute bottom-full left-0 right-0 mb-1 mx-2 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
              <button
                onClick={() => {
                  navigate('/profile')
                  setShowUserMenu(false)
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <User className="h-4 w-4" />
                {t('menu.profile', 'My Profile')}
              </button>
              <button
                onClick={() => {
                  navigate('/settings')
                  setShowUserMenu(false)
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <Settings className="h-4 w-4" />
                {t('menu.settings', 'Settings')}
              </button>
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

        {/* Collapse toggle */}
        <button
          onClick={onToggle}
          className={cn(
            'flex w-full items-center gap-2 border-t border-gray-100 px-3 py-2.5 text-sm text-gray-600 transition-colors hover:bg-gray-100 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-gray-800',
            collapsed && 'justify-center'
          )}
          title={collapsed ? t('nav.expand', 'Expand sidebar') : t('nav.collapse', 'Collapse sidebar')}
        >
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          {!collapsed && <span>{t('nav.collapse', 'Collapse')}</span>}
        </button>
      </div>
    </aside>
  )
}
