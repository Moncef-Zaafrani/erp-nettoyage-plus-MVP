import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Palette,
  Bell,
  Table,
  Calendar,
  HelpCircle,
  Shield,
  Monitor,
  Smartphone,
  Tablet,
  LogOut,
  RotateCcw,
  Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { settingsApi, UserSettings, ThemeType, UserSession } from '@/services/api'
import { useTheme } from '@/contexts/ThemeContext'
import Button from '@/components/ui/Button'

// ============================================
// Theme Card Component
// ============================================

const THEMES: { id: ThemeType; name: string; description: string; preview: { bg: string; accent: string } }[] = [
  { id: 'system', name: 'System Default', description: 'Follows OS preference', preview: { bg: 'bg-gradient-to-br from-gray-100 to-gray-900', accent: 'bg-blue-500' } },
  { id: 'light', name: 'Light Classic', description: 'Clean white background', preview: { bg: 'bg-white', accent: 'bg-blue-500' } },
  { id: 'dark', name: 'Dark Mode', description: 'Easy on the eyes', preview: { bg: 'bg-gray-900', accent: 'bg-blue-500' } },
  { id: 'ocean-blue', name: 'Ocean Blue', description: 'Deep blue tones', preview: { bg: 'bg-blue-900', accent: 'bg-cyan-400' } },
  { id: 'forest-green', name: 'Forest Green', description: 'Calming green accents', preview: { bg: 'bg-green-900', accent: 'bg-emerald-400' } },
  { id: 'sunset-orange', name: 'Sunset Orange', description: 'Warm orange tones', preview: { bg: 'bg-orange-900', accent: 'bg-orange-400' } },
  { id: 'high-contrast', name: 'High Contrast', description: 'Maximum readability', preview: { bg: 'bg-black', accent: 'bg-yellow-400' } },
  { id: 'minimal-gray', name: 'Minimal Gray', description: 'Distraction-free', preview: { bg: 'bg-gray-800', accent: 'bg-gray-400' } },
  { id: 'nettoyage-brand', name: 'Nettoyage Plus', description: 'Company colors', preview: { bg: 'bg-primary-900', accent: 'bg-primary-400' } },
]

function ThemeCard({
  theme,
  isSelected,
  onClick,
}: {
  theme: typeof THEMES[0]
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all hover:shadow-md',
        isSelected
          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
          : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600'
      )}
    >
      {/* Preview */}
      <div className={cn('h-16 w-full rounded-lg shadow-inner', theme.preview.bg)}>
        <div className="flex h-full items-center justify-center gap-1 p-2">
          <div className={cn('h-3 w-3 rounded-full', theme.preview.accent)} />
          <div className={cn('h-2 w-12 rounded', theme.preview.accent, 'opacity-50')} />
        </div>
      </div>
      
      {/* Name */}
      <div className="text-sm font-medium text-gray-900 dark:text-white">{theme.name}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400">{theme.description}</div>
      
      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary-500 text-white">
          <Check className="h-4 w-4" />
        </div>
      )}
    </button>
  )
}

// ============================================
// Settings Section Component
// ============================================

function SettingsSection({
  title,
  description,
  icon: Icon,
  children,
  id,
}: {
  title: string
  description?: string
  icon: React.ElementType
  children: React.ReactNode
  id?: string
}) {
  return (
    <section id={id} className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <div className="border-b border-gray-200 px-4 py-4 dark:border-gray-700 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">{title}</h2>
            {description && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
            )}
          </div>
        </div>
      </div>
      <div className="p-4 sm:p-6">{children}</div>
    </section>
  )
}

// ============================================
// Toggle Switch Component
// ============================================

function Toggle({
  enabled,
  onChange,
  label,
  description,
}: {
  enabled: boolean
  onChange: (value: boolean) => void
  label: string
  description?: string
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 py-2">
      <div>
        <span className="font-medium text-gray-900 dark:text-white">{label}</span>
        {description && (
          <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
        )}
      </div>
      <button
        role="switch"
        aria-checked={enabled}
        onClick={() => onChange(!enabled)}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors',
          enabled ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
        )}
      >
        <span
          className={cn(
            'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
            enabled ? 'translate-x-6' : 'translate-x-1'
          )}
        />
      </button>
    </label>
  )
}

// ============================================
// Select Component
// ============================================

function Select<T extends string | number>({
  value,
  onChange,
  options,
  label,
}: {
  value: T
  onChange: (value: T) => void
  options: { value: T; label: string }[]
  label: string
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className="font-medium text-gray-900 dark:text-white">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}

// ============================================
// Session Card Component
// ============================================

function SessionCard({
  session,
  onRevoke,
  isRevoking,
}: {
  session: UserSession
  onRevoke: () => void
  isRevoking: boolean
}) {
  const { t } = useTranslation()
  
  const DeviceIcon = session.deviceType === 'mobile'
    ? Smartphone
    : session.deviceType === 'tablet'
    ? Tablet
    : Monitor
  
  return (
    <div className={cn(
      'flex items-center justify-between rounded-lg border p-4',
      session.isCurrent
        ? 'border-primary-200 bg-primary-50 dark:border-primary-800 dark:bg-primary-900/20'
        : 'border-gray-200 dark:border-gray-700'
    )}>
      <div className="flex items-center gap-3">
        <div className={cn(
          'flex h-10 w-10 items-center justify-center rounded-full',
          session.isCurrent
            ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/50 dark:text-primary-400'
            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
        )}>
          <DeviceIcon className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium text-gray-900 dark:text-white">
              {session.browser || 'Unknown'} on {session.os || 'Unknown'}
            </p>
            {session.isCurrent && (
              <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-900/50 dark:text-primary-300">
                {t('settings.sessions.current', 'Current')}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {session.city && session.country
              ? `${session.city}, ${session.country}`
              : session.ipAddress || 'Unknown location'}
            {session.lastActiveAt && (
              <> • {t('settings.sessions.lastActive', 'Last active')} {new Date(session.lastActiveAt).toLocaleDateString()}</>
            )}
          </p>
        </div>
      </div>
      {!session.isCurrent && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRevoke}
          isLoading={isRevoking}
          className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}

// ============================================
// Navigation Sidebar
// ============================================

const SECTIONS = [
  { id: 'themes', label: 'Themes & Appearance', icon: Palette },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'tables', label: 'Table Preferences', icon: Table },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'security', label: 'Security & Sessions', icon: Shield },
  { id: 'help', label: 'Help & Support', icon: HelpCircle },
]

function SettingsNav({ activeSection, onNavigate }: { activeSection: string; onNavigate: (id: string) => void }) {
  return (
    <nav className="hidden w-56 shrink-0 lg:block">
      <div className="sticky top-20 space-y-1">
        {SECTIONS.map((section) => (
          <button
            key={section.id}
            onClick={() => onNavigate(section.id)}
            className={cn(
              'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors',
              activeSection === section.id
                ? 'bg-primary-100 font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
            )}
          >
            <section.icon className="h-4 w-4" />
            {section.label}
          </button>
        ))}
      </div>
    </nav>
  )
}

// ============================================
// Main Settings Page
// ============================================

export default function SettingsPage() {
  const { t } = useTranslation()
  const { setTheme } = useTheme()
  
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [sessions, setSessions] = useState<UserSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [, setError] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState('themes')
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null)
  
  // Suppress unused warning
  void isSaving
  
  // Load settings
  useEffect(() => {
    loadSettings()
    loadSessions()
  }, [])
  
  async function loadSettings() {
    try {
      setIsLoading(true)
      const data = await settingsApi.getSettings()
      setSettings(data)
    } catch (err) {
      console.error('Failed to load settings:', err)
      // Create default settings object if load fails
      setSettings({
        id: '',
        userId: '',
        appearance: {
          theme: 'system',
          sidebarCollapsed: false,
          sidebarPosition: 'left',
          animationsEnabled: true,
          fontSize: 'medium',
          compactMode: false,
        },
        notifications: {
          inAppEnabled: true,
          soundEnabled: true,
          desktopEnabled: false,
          emailDigest: 'daily',
          emailCategories: {
            newMissions: true,
            missionChanges: true,
            scheduleReminders: true,
            qualityResults: true,
            absenceUpdates: true,
            systemAnnouncements: true,
            weeklyPerformance: false,
          },
          pushEnabled: true,
          quietHours: { enabled: false, start: '22:00', end: '07:00' },
        },
        tables: {
          defaultRowsPerPage: 25,
          compactRows: false,
          showRowNumbers: false,
          stickyHeader: true,
          columnPreferences: {},
          sortPreferences: {},
        },
        calendar: {
          defaultView: 'week',
          weekStartsOn: 'monday',
          showWeekends: true,
          timeFormat: '24h',
          showCompleted: false,
        },
        map: { defaultView: 'street', showAgentLocations: true, showTraffic: false, clusterSites: true },
        gps: { enabled: true, accuracy: 'balanced' },
        photo: { defaultCamera: 'back', quality: 'medium', autoCompress: true, timestampOverlay: true, locationOverlay: false },
        offline: { enabled: true, autoSync: true, maxStorageMb: 100 },
        mission: { showNotesFirst: false, expandChecklists: true, defaultSort: 'time' },
        shift: { reminderBefore: 60, missedClockInReminder: 15, endShiftReminder: 15, autoClockOutHours: 10, notifySupervisorAutoClockOut: true, defaultBreakMinutes: 30, breakReminderHours: 4 },
        help: { showEmptyStateTips: true, showFeatureTutorials: true },
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  async function loadSessions() {
    try {
      const data = await settingsApi.getSessions()
      setSessions(data)
    } catch (err) {
      console.error('Failed to load sessions:', err)
    }
  }
  
  async function updateSettings(partial: Partial<UserSettings>) {
    if (!settings) return
    
    try {
      setIsSaving(true)
      const updated = await settingsApi.updateSettings(partial)
      setSettings(updated)
    } catch (err) {
      console.error('Failed to save settings:', err)
      setError(t('settings.saveError', 'Failed to save settings'))
    } finally {
      setIsSaving(false)
    }
  }
  
  async function handleThemeChange(themeId: ThemeType) {
    // Update local theme immediately for responsive feel
    if (themeId === 'system') {
      setTheme('system')
    } else if (themeId === 'dark' || themeId === 'ocean-blue' || themeId === 'forest-green' || themeId === 'high-contrast' || themeId === 'minimal-gray' || themeId === 'nettoyage-brand') {
      setTheme('dark')
    } else {
      setTheme('light')
    }
    
    // Save to backend
    try {
      await settingsApi.updateTheme(themeId)
      if (settings) {
        setSettings({
          ...settings,
          appearance: { ...settings.appearance, theme: themeId },
        })
      }
    } catch (err) {
      console.error('Failed to save theme:', err)
    }
  }
  
  async function handleRevokeSession(sessionId: string) {
    try {
      setRevokingSessionId(sessionId)
      await settingsApi.revokeSession(sessionId)
      setSessions(sessions.filter((s) => s.id !== sessionId))
    } catch (err) {
      console.error('Failed to revoke session:', err)
    } finally {
      setRevokingSessionId(null)
    }
  }
  
  async function handleRevokeOtherSessions() {
    try {
      await settingsApi.revokeOtherSessions()
      setSessions(sessions.filter((s) => s.isCurrent))
    } catch (err) {
      console.error('Failed to revoke other sessions:', err)
    }
  }
  
  function scrollToSection(id: string) {
    setActiveSection(id)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  
  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent" />
      </div>
    )
  }
  
  if (!settings) return null
  
  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
          {t('settings.title', 'Settings')}
        </h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          {t('settings.subtitle', 'Customize your experience and preferences')}
        </p>
      </div>
      
      <div className="flex gap-8">
        {/* Navigation */}
        <SettingsNav activeSection={activeSection} onNavigate={scrollToSection} />
        
        {/* Content */}
        <div className="flex-1 space-y-8">
          {/* Themes & Appearance */}
          <SettingsSection
            id="themes"
            title={t('settings.appearance.title', 'Themes & Appearance')}
            description={t('settings.appearance.description', 'Choose how Nettoyage Plus looks to you')}
            icon={Palette}
          >
            <div className="space-y-6">
              {/* Theme Selection */}
              <div>
                <label className="mb-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('settings.appearance.theme', 'Theme')}
                </label>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {THEMES.map((theme) => (
                    <ThemeCard
                      key={theme.id}
                      theme={theme}
                      isSelected={settings.appearance.theme === theme.id}
                      onClick={() => handleThemeChange(theme.id)}
                    />
                  ))}
                </div>
              </div>
              
              {/* Other Appearance Options */}
              <div className="border-t border-gray-200 pt-6 dark:border-gray-700">
                <Toggle
                  enabled={settings.appearance.compactMode}
                  onChange={(v) => updateSettings({ appearance: { ...settings.appearance, compactMode: v } })}
                  label={t('settings.appearance.compactMode', 'Compact Mode')}
                  description={t('settings.appearance.compactModeDesc', 'Reduce spacing throughout the app')}
                />
                <Toggle
                  enabled={settings.appearance.animationsEnabled}
                  onChange={(v) => updateSettings({ appearance: { ...settings.appearance, animationsEnabled: v } })}
                  label={t('settings.appearance.animations', 'Animations')}
                  description={t('settings.appearance.animationsDesc', 'Enable interface animations')}
                />
                <Select
                  value={settings.appearance.fontSize}
                  onChange={(v) => updateSettings({ appearance: { ...settings.appearance, fontSize: v } })}
                  options={[
                    { value: 'small', label: 'Small' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'large', label: 'Large' },
                  ]}
                  label={t('settings.appearance.fontSize', 'Font Size')}
                />
                <Select
                  value={settings.appearance.sidebarPosition}
                  onChange={(v) => updateSettings({ appearance: { ...settings.appearance, sidebarPosition: v } })}
                  options={[
                    { value: 'left', label: 'Left' },
                    { value: 'right', label: 'Right' },
                  ]}
                  label={t('settings.appearance.sidebarPosition', 'Sidebar Position')}
                />
              </div>
            </div>
          </SettingsSection>
          
          {/* Notifications */}
          <SettingsSection
            id="notifications"
            title={t('settings.notifications.title', 'Notifications')}
            description={t('settings.notifications.description', 'Manage how you receive notifications')}
            icon={Bell}
          >
            <div className="space-y-4">
              <Toggle
                enabled={settings.notifications.inAppEnabled}
                onChange={(v) => updateSettings({ notifications: { ...settings.notifications, inAppEnabled: v } })}
                label={t('settings.notifications.inApp', 'In-App Notifications')}
              />
              <Toggle
                enabled={settings.notifications.soundEnabled}
                onChange={(v) => updateSettings({ notifications: { ...settings.notifications, soundEnabled: v } })}
                label={t('settings.notifications.sound', 'Notification Sound')}
              />
              <Toggle
                enabled={settings.notifications.desktopEnabled}
                onChange={(v) => updateSettings({ notifications: { ...settings.notifications, desktopEnabled: v } })}
                label={t('settings.notifications.desktop', 'Desktop Notifications')}
                description={t('settings.notifications.desktopDesc', 'Show notifications in your browser')}
              />
              <Toggle
                enabled={settings.notifications.pushEnabled}
                onChange={(v) => updateSettings({ notifications: { ...settings.notifications, pushEnabled: v } })}
                label={t('settings.notifications.push', 'Push Notifications')}
                description={t('settings.notifications.pushDesc', 'Receive notifications on mobile')}
              />
              
              <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
                <Select
                  value={settings.notifications.emailDigest}
                  onChange={(v) => updateSettings({ notifications: { ...settings.notifications, emailDigest: v } })}
                  options={[
                    { value: 'instant', label: 'Instant' },
                    { value: 'daily', label: 'Daily Digest' },
                    { value: 'weekly', label: 'Weekly Digest' },
                    { value: 'none', label: 'Never' },
                  ]}
                  label={t('settings.notifications.emailDigest', 'Email Frequency')}
                />
              </div>
              
              {/* Email Categories */}
              <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
                <h3 className="mb-3 font-medium text-gray-900 dark:text-white">
                  {t('settings.notifications.categories', 'Email Categories')}
                </h3>
                <div className="space-y-2">
                  <Toggle
                    enabled={settings.notifications.emailCategories.newMissions}
                    onChange={(v) => updateSettings({
                      notifications: {
                        ...settings.notifications,
                        emailCategories: { ...settings.notifications.emailCategories, newMissions: v },
                      },
                    })}
                    label={t('settings.notifications.newMissions', 'New Mission Assignments')}
                  />
                  <Toggle
                    enabled={settings.notifications.emailCategories.missionChanges}
                    onChange={(v) => updateSettings({
                      notifications: {
                        ...settings.notifications,
                        emailCategories: { ...settings.notifications.emailCategories, missionChanges: v },
                      },
                    })}
                    label={t('settings.notifications.missionChanges', 'Mission Changes')}
                  />
                  <Toggle
                    enabled={settings.notifications.emailCategories.scheduleReminders}
                    onChange={(v) => updateSettings({
                      notifications: {
                        ...settings.notifications,
                        emailCategories: { ...settings.notifications.emailCategories, scheduleReminders: v },
                      },
                    })}
                    label={t('settings.notifications.scheduleReminders', 'Schedule Reminders')}
                  />
                  <Toggle
                    enabled={settings.notifications.emailCategories.systemAnnouncements}
                    onChange={(v) => updateSettings({
                      notifications: {
                        ...settings.notifications,
                        emailCategories: { ...settings.notifications.emailCategories, systemAnnouncements: v },
                      },
                    })}
                    label={t('settings.notifications.systemAnnouncements', 'System Announcements')}
                  />
                </div>
              </div>
            </div>
          </SettingsSection>
          
          {/* Table Preferences */}
          <SettingsSection
            id="tables"
            title={t('settings.tables.title', 'Table Preferences')}
            description={t('settings.tables.description', 'Customize how data tables are displayed')}
            icon={Table}
          >
            <div className="space-y-4">
              <Select
                value={settings.tables.defaultRowsPerPage}
                onChange={(v) => updateSettings({ tables: { ...settings.tables, defaultRowsPerPage: parseInt(v as any) as 10 | 25 | 50 | 100 } })}
                options={[
                  { value: 10, label: '10 rows' },
                  { value: 25, label: '25 rows' },
                  { value: 50, label: '50 rows' },
                  { value: 100, label: '100 rows' },
                ]}
                label={t('settings.tables.rowsPerPage', 'Rows per Page')}
              />
              <Toggle
                enabled={settings.tables.compactRows}
                onChange={(v) => updateSettings({ tables: { ...settings.tables, compactRows: v } })}
                label={t('settings.tables.compactRows', 'Compact Rows')}
                description={t('settings.tables.compactRowsDesc', 'Reduce row height for denser view')}
              />
              <Toggle
                enabled={settings.tables.showRowNumbers}
                onChange={(v) => updateSettings({ tables: { ...settings.tables, showRowNumbers: v } })}
                label={t('settings.tables.showRowNumbers', 'Show Row Numbers')}
              />
              <Toggle
                enabled={settings.tables.stickyHeader}
                onChange={(v) => updateSettings({ tables: { ...settings.tables, stickyHeader: v } })}
                label={t('settings.tables.stickyHeader', 'Sticky Header')}
                description={t('settings.tables.stickyHeaderDesc', 'Keep table header visible while scrolling')}
              />
            </div>
          </SettingsSection>
          
          {/* Calendar */}
          <SettingsSection
            id="calendar"
            title={t('settings.calendar.title', 'Calendar')}
            description={t('settings.calendar.description', 'Configure calendar display preferences')}
            icon={Calendar}
          >
            <div className="space-y-4">
              <Select
                value={settings.calendar.defaultView}
                onChange={(v) => updateSettings({ calendar: { ...settings.calendar, defaultView: v } })}
                options={[
                  { value: 'day', label: 'Day View' },
                  { value: 'week', label: 'Week View' },
                  { value: 'month', label: 'Month View' },
                ]}
                label={t('settings.calendar.defaultView', 'Default View')}
              />
              <Select
                value={settings.calendar.weekStartsOn}
                onChange={(v) => updateSettings({ calendar: { ...settings.calendar, weekStartsOn: v } })}
                options={[
                  { value: 'sunday', label: 'Sunday' },
                  { value: 'monday', label: 'Monday' },
                ]}
                label={t('settings.calendar.weekStartsOn', 'Week Starts On')}
              />
              <Select
                value={settings.calendar.timeFormat}
                onChange={(v) => updateSettings({ calendar: { ...settings.calendar, timeFormat: v } })}
                options={[
                  { value: '12h', label: '12 Hour' },
                  { value: '24h', label: '24 Hour' },
                ]}
                label={t('settings.calendar.timeFormat', 'Time Format')}
              />
              <Toggle
                enabled={settings.calendar.showWeekends}
                onChange={(v) => updateSettings({ calendar: { ...settings.calendar, showWeekends: v } })}
                label={t('settings.calendar.showWeekends', 'Show Weekends')}
              />
              <Toggle
                enabled={settings.calendar.showCompleted}
                onChange={(v) => updateSettings({ calendar: { ...settings.calendar, showCompleted: v } })}
                label={t('settings.calendar.showCompleted', 'Show Completed Interventions')}
              />
            </div>
          </SettingsSection>
          
          {/* Security & Sessions */}
          <SettingsSection
            id="security"
            title={t('settings.security.title', 'Security & Sessions')}
            description={t('settings.security.description', 'Manage your account security and active sessions')}
            icon={Shield}
          >
            <div className="space-y-6">
              {/* Active Sessions */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {t('settings.sessions.title', 'Active Sessions')}
                  </h3>
                  {sessions.length > 1 && (
                    <Button variant="ghost" size="sm" onClick={handleRevokeOtherSessions}>
                      {t('settings.sessions.revokeOthers', 'Sign out other sessions')}
                    </Button>
                  )}
                </div>
                <div className="space-y-3">
                  {sessions.map((session) => (
                    <SessionCard
                      key={session.id}
                      session={session}
                      onRevoke={() => handleRevokeSession(session.id)}
                      isRevoking={revokingSessionId === session.id}
                    />
                  ))}
                  {sessions.length === 0 && (
                    <p className="py-4 text-center text-gray-500 dark:text-gray-400">
                      {t('settings.sessions.noSessions', 'No active sessions found')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </SettingsSection>
          
          {/* Help & Support */}
          <SettingsSection
            id="help"
            title={t('settings.help.title', 'Help & Support')}
            description={t('settings.help.description', 'Get help and customize in-app guidance')}
            icon={HelpCircle}
          >
            <div className="space-y-4">
              <Toggle
                enabled={settings.help.showEmptyStateTips}
                onChange={(v) => updateSettings({ help: { ...settings.help, showEmptyStateTips: v } })}
                label={t('settings.help.emptyStateTips', 'Show Empty State Tips')}
                description={t('settings.help.emptyStateTipsDesc', 'Display helpful tips when lists are empty')}
              />
              <Toggle
                enabled={settings.help.showFeatureTutorials}
                onChange={(v) => updateSettings({ help: { ...settings.help, showFeatureTutorials: v } })}
                label={t('settings.help.featureTutorials', 'Feature Tutorials')}
                description={t('settings.help.featureTutorialsDesc', 'Show tutorials for new features')}
              />
              
              <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
                <Button variant="secondary" onClick={() => settingsApi.resetSettings().then(loadSettings)}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  {t('settings.resetToDefaults', 'Reset All Settings to Defaults')}
                </Button>
              </div>
            </div>
          </SettingsSection>
        </div>
      </div>
    </div>
  )
}
