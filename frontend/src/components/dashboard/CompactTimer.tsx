import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/AuthContext'
import { Timer, Play, Pause, RotateCcw, X, ChevronUp } from 'lucide-react'

interface TimerState {
  startTime: number | null
  pausedTime: number
  label: string
  isRunning: boolean
}

const getStorageKey = (userId?: string) => userId ? `timer_v2_${userId}` : 'timer_v2'

export function CompactTimer() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [timer, setTimer] = useState<TimerState>({
    startTime: null,
    pausedTime: 0,
    label: '',
    isRunning: false,
  })
  const [elapsed, setElapsed] = useState(0)
  const [expanded, setExpanded] = useState(false)
  const [label, setLabel] = useState('')

  const storageKey = getStorageKey(user?.id)

  // Load timer from localStorage
  useEffect(() => {
    if (!user?.id) return
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setTimer(parsed)
        setLabel(parsed.label || '')
      } catch {
        // Ignore
      }
    }
  }, [user?.id, storageKey])

  // Update elapsed time
  useEffect(() => {
    if (!timer.isRunning || !timer.startTime) {
      setElapsed(timer.pausedTime)
      return
    }

    const updateElapsed = () => {
      const now = Date.now()
      setElapsed(Math.floor((now - timer.startTime!) / 1000) + timer.pausedTime)
    }

    updateElapsed()
    const interval = setInterval(updateElapsed, 1000)
    return () => clearInterval(interval)
  }, [timer.isRunning, timer.startTime, timer.pausedTime])

  // Handle visibility change - pause when hidden
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && timer.isRunning && timer.startTime) {
        const currentElapsed = Math.floor((Date.now() - timer.startTime) / 1000) + timer.pausedTime
        const paused = { ...timer, isRunning: false, pausedTime: currentElapsed, startTime: null }
        setTimer(paused)
        localStorage.setItem(storageKey, JSON.stringify(paused))
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [timer, storageKey])

  // Handle logout - stop and reset timer completely
  useEffect(() => {
    const handleLogout = () => {
      // Completely reset timer on logout
      const resetState = { startTime: null, pausedTime: 0, label: '', isRunning: false }
      setTimer(resetState)
      setElapsed(0)
      setLabel('')
      setExpanded(false)
      // Clear from localStorage
      localStorage.removeItem(storageKey)
    }
    window.addEventListener('userLogout', handleLogout)
    return () => window.removeEventListener('userLogout', handleLogout)
  }, [storageKey])

  // Save timer state
  const saveTimer = useCallback((newTimer: TimerState) => {
    setTimer(newTimer)
    localStorage.setItem(storageKey, JSON.stringify(newTimer))
  }, [storageKey])

  const handleToggle = () => {
    if (timer.isRunning) {
      // Pause
      saveTimer({ ...timer, isRunning: false, pausedTime: elapsed, startTime: null, label })
    } else {
      // Start/Resume
      saveTimer({ ...timer, isRunning: true, startTime: Date.now(), label })
    }
  }

  const handleReset = () => {
    saveTimer({ startTime: null, pausedTime: 0, label: '', isRunning: false })
    setElapsed(0)
    setLabel('')
    setExpanded(false)
  }

  const formatTime = (s: number) => {
    const hrs = Math.floor(s / 3600)
    const mins = Math.floor((s % 3600) / 60)
    const secs = s % 60
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Don't show if no timer activity
  const hasActivity = timer.isRunning || timer.pausedTime > 0

  if (!hasActivity && !expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="fixed bottom-4 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-all hover:scale-105"
        title={t('timer.start', 'Start Timer')}
      >
        <Timer className="h-5 w-5" />
      </button>
    )
  }

  return (
    <div className={`fixed bottom-4 right-4 z-40 transition-all ${expanded ? 'w-72' : ''}`}>
      {/* Expanded Panel */}
      {expanded && (
        <div className="mb-2 rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800 overflow-hidden animate-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between p-3 border-b border-gray-100 dark:border-gray-700">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {t('timer.quickTimer', 'Quick Timer')}
            </span>
            <button
              onClick={() => setExpanded(false)}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          </div>

          <div className="p-4">
            {/* Time Display */}
            <div className="text-center mb-4">
              <p className="font-mono text-4xl font-bold text-gray-900 dark:text-white">
                {formatTime(elapsed)}
              </p>
              {timer.isRunning && (
                <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center justify-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                  {t('timer.running', 'Running')}
                </p>
              )}
            </div>

            {/* Label Input */}
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value.slice(0, 50))}
              placeholder={t('timer.labelPlaceholder', 'What are you working on?')}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-blue-400 dark:border-gray-700 dark:bg-gray-900 dark:text-white outline-none mb-3"
            />

            {/* Controls */}
            <div className="flex gap-2">
              <button
                onClick={handleToggle}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors ${
                  timer.isRunning
                    ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {timer.isRunning ? (
                  <>
                    <Pause className="h-4 w-4" />
                    {t('timer.pause', 'Pause')}
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    {elapsed > 0 ? t('timer.resume', 'Resume') : t('timer.start', 'Start')}
                  </>
                )}
              </button>
              {(timer.isRunning || elapsed > 0) && (
                <button
                  onClick={handleReset}
                  className="px-3 py-2.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600 transition-colors"
                  title={t('timer.reset', 'Reset')}
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Compact Button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg transition-all hover:scale-105 ${
          timer.isRunning
            ? 'bg-blue-600 text-white'
            : elapsed > 0
            ? 'bg-amber-500 text-white'
            : 'bg-gray-800 text-white dark:bg-gray-700'
        }`}
      >
        <Timer className="h-4 w-4" />
        <span className="font-mono font-medium text-sm">{formatTime(elapsed)}</span>
        {timer.isRunning && (
          <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
        )}
        <ChevronUp className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>
    </div>
  )
}

export default CompactTimer
