import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/AuthContext'
import { 
  Briefcase, 
  Play, 
  Square, 
  Coffee,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import { attendanceApi, Attendance } from '@/services/api'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useToast } from '@/components/ui/Toast'

export function ShiftStatusCard() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const toast = useToast()

  const [isOnShift, setIsOnShift] = useState(false)
  const [currentShift, setCurrentShift] = useState<Attendance | null>(null)
  const [todayRecords, setTodayRecords] = useState<Attendance[]>([])
  const [weeklyHours, setWeeklyHours] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Confirmation dialogs
  const [showEndConfirm, setShowEndConfirm] = useState(false)
  const [showStartConfirm, setShowStartConfirm] = useState(false)

  // Check if user can see shift controls
  const canToggleShift = user?.role === 'ADMIN' || user?.role === 'SUPERVISOR' || user?.role === 'AGENT'

  // Fetch shift data
  const fetchData = useCallback(async () => {
    if (!canToggleShift) {
      setLoading(false)
      return
    }
    setError(null)
    try {
      const [status, today, weekly] = await Promise.all([
        attendanceApi.getStatus(),
        attendanceApi.getToday(),
        attendanceApi.getWeeklyHours(),
      ])
      setIsOnShift(status.isOnShift)
      setCurrentShift(status.currentShift)
      setTodayRecords(today)
      setWeeklyHours(weekly.hours)
    } catch (err) {
      console.error('Failed to fetch shift data:', err)
      setError('Failed to load shift data')
    } finally {
      setLoading(false)
    }
  }, [canToggleShift])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Listen for shift changes
  useEffect(() => {
    const handleShiftChange = () => {
      setTimeout(fetchData, 500)
    }
    window.addEventListener('shiftStatusChanged', handleShiftChange)
    return () => window.removeEventListener('shiftStatusChanged', handleShiftChange)
  }, [fetchData])

  // Update elapsed time
  useEffect(() => {
    if (!isOnShift || !currentShift) {
      setElapsed(0)
      return
    }

    const updateElapsed = () => {
      const start = new Date(currentShift.clockIn).getTime()
      setElapsed(Math.floor((Date.now() - start) / 1000))
    }

    updateElapsed()
    const interval = setInterval(updateElapsed, 1000)
    return () => clearInterval(interval)
  }, [isOnShift, currentShift])

  // Handle logout
  useEffect(() => {
    const handleLogout = () => {
      setIsOnShift(false)
      setCurrentShift(null)
      setTodayRecords([])
      setWeeklyHours(0)
      setElapsed(0)
    }
    window.addEventListener('userLogout', handleLogout)
    return () => window.removeEventListener('userLogout', handleLogout)
  }, [])

  // Format time
  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hrs > 0) {
      return `${hrs}h ${mins}m ${secs}s`
    }
    return `${mins}m ${secs}s`
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  // Calculate today's total
  const getTodayTotal = () => {
    let total = 0
    todayRecords.forEach((record) => {
      if (record.hoursWorked) total += parseFloat(String(record.hoursWorked)) || 0
    })
    if (isOnShift) total += elapsed / 3600
    return total.toFixed(1)
  }

  // Handle clock in
  const handleClockIn = async () => {
    setShowStartConfirm(false)
    setActionLoading(true)
    try {
      await attendanceApi.clockIn({})
      toast.success('Shift Started', `Your shift started at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`)
      window.dispatchEvent(new CustomEvent('shiftStatusChanged'))
      await fetchData()
    } catch (err) {
      console.error('Failed to clock in:', err)
      toast.error('Failed to Start Shift', 'Please try again')
    } finally {
      setActionLoading(false)
    }
  }

  // Handle clock out
  const handleClockOut = async () => {
    setShowEndConfirm(false)
    setActionLoading(true)
    try {
      await attendanceApi.clockOut({})
      toast.success('Shift Ended', `You worked ${formatDuration(elapsed)} this session`)
      window.dispatchEvent(new CustomEvent('shiftStatusChanged'))
      await fetchData()
    } catch (err) {
      console.error('Failed to clock out:', err)
      toast.error('Failed to End Shift', 'Please try again')
    } finally {
      setActionLoading(false)
    }
  }

  if (!canToggleShift) return null

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800 animate-pulse">
        <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
        <div className="h-12 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
        <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5 dark:border-red-800/50 dark:bg-red-900/20">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertCircle className="h-5 w-5" />
            <span className="font-medium">{t('shift.error', 'Shift Status')}</span>
          </div>
          <button
            onClick={() => { setLoading(true); fetchData() }}
            className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30"
          >
            <RefreshCw className="h-4 w-4 text-red-600 dark:text-red-400" />
          </button>
        </div>
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    )
  }

  const firstClockIn = todayRecords.length > 0 ? todayRecords[0].clockIn : null

  return (
    <>
      {/* Confirmation Dialogs */}
      <ConfirmDialog
        isOpen={showStartConfirm}
        onClose={() => setShowStartConfirm(false)}
        onConfirm={handleClockIn}
        title={t('shift.startConfirmTitle', 'Start Your Shift?')}
        message={
          <div className="space-y-2">
            <p>{t('shift.startConfirmMessage', 'You are about to clock in and start your shift.')}</p>
            <p className="text-xs text-gray-500">
              {t('shift.startTime', 'Start time')}: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        }
        confirmText={t('shift.startShift', 'Start Shift')}
        type="info"
        loading={actionLoading}
      />

      <ConfirmDialog
        isOpen={showEndConfirm}
        onClose={() => setShowEndConfirm(false)}
        onConfirm={handleClockOut}
        title={t('shift.endConfirmTitle', 'End Your Shift?')}
        message={
          <div className="space-y-2">
            <p>{t('shift.endConfirmMessage', 'You are about to clock out and end your shift.')}</p>
            <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-700">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {t('shift.sessionDuration', 'Session Duration')}: <span className="font-mono">{formatDuration(elapsed)}</span>
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t('shift.todayTotal', "Today's Total")}: {getTodayTotal()}h
              </p>
            </div>
          </div>
        }
        confirmText={t('shift.endShift', 'End Shift')}
        type="warning"
        loading={actionLoading}
      />

      {/* Main Card */}
      <div className={`rounded-xl border p-5 transition-all ${
        isOnShift
          ? 'border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 dark:border-green-800/50 dark:from-green-900/20 dark:to-emerald-900/20'
          : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Briefcase className={`h-5 w-5 ${isOnShift ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`} />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {t('shift.todaysWork', "Today's Work")}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {isOnShift && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-400">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                {t('shift.onShift', 'On Shift')}
              </span>
            )}
            <button
              onClick={() => { setLoading(true); fetchData() }}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400"
              title={t('common.refresh', 'Refresh')}
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {isOnShift ? (
          <>
            {/* Current Session Timer */}
            <div className="mb-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                {t('shift.currentSession', 'Current Session')}
              </p>
              <p className="font-mono text-3xl font-bold text-green-600 dark:text-green-400">
                {formatDuration(elapsed)}
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="rounded-lg bg-white/60 dark:bg-gray-800/60 p-2.5">
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('shift.started', 'Started')}</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {firstClockIn ? formatTime(firstClockIn) : '--:--'}
                </p>
              </div>
              <div className="rounded-lg bg-white/60 dark:bg-gray-800/60 p-2.5">
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('shift.today', 'Today')}</p>
                <p className="font-medium text-gray-900 dark:text-white">{getTodayTotal()}h</p>
              </div>
              <div className="rounded-lg bg-white/60 dark:bg-gray-800/60 p-2.5">
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('shift.sessions', 'Sessions')}</p>
                <p className="font-medium text-gray-900 dark:text-white">{todayRecords.length}</p>
              </div>
              <div className="rounded-lg bg-white/60 dark:bg-gray-800/60 p-2.5">
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('shift.thisWeek', 'This Week')}</p>
                <p className="font-medium text-gray-900 dark:text-white">{weeklyHours.toFixed(1)}h</p>
              </div>
            </div>

            {/* End Shift Button */}
            <button
              onClick={() => setShowEndConfirm(true)}
              disabled={actionLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-red-100 text-red-700 font-medium text-sm hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50"
            >
              <Square className="h-4 w-4" />
              {t('shift.endShift', 'End Shift')}
            </button>
          </>
        ) : (
          <>
            {/* Not on shift */}
            <div className="text-center py-4">
              <Coffee className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-gray-600 dark:text-gray-400 mb-1">
                {t('shift.notOnShift', "You're not on shift")}
              </p>
              {weeklyHours > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">
                  {t('shift.thisWeek', 'This Week')}: <span className="font-medium">{weeklyHours.toFixed(1)}h</span>
                </p>
              )}
            </div>

            {/* Start Shift Button */}
            <button
              onClick={() => setShowStartConfirm(true)}
              disabled={actionLoading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-green-600 text-white font-medium text-sm hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <Play className="h-4 w-4" />
              {t('shift.startShift', 'Start Shift')}
            </button>
          </>
        )}
      </div>
    </>
  )
}

export default ShiftStatusCard
