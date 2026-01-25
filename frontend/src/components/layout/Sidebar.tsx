import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react'
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
  const { user } = useAuth()
  const location = useLocation()
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

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
    return location.pathname === href || location.pathname.startsWith(href + '/')
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

      {/* Collapse toggle */}
      <div className="shrink-0 border-t border-gray-200 p-2 dark:border-gray-800">
        <button
          onClick={onToggle}
          className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          title={collapsed ? t('nav.expand', 'Expand sidebar') : t('nav.collapse', 'Collapse sidebar')}
        >
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          {!collapsed && <span>{t('nav.collapse', 'Collapse')}</span>}
        </button>
      </div>
    </aside>
  )
}
