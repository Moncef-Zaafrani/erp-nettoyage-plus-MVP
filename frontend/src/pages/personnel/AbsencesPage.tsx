import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Loader2,
  Palmtree,
  Stethoscope,
  CalendarOff,
  CalendarCheck,
  CalendarX2,
  User,
  Eye,
  Check,
  X,
  FileText,
} from 'lucide-react'
import {
  absencesApi,
  Absence,
  AbsenceType,
  AbsenceStatus,
} from '@/services/api'

// Absence type config with colors and icons
const absenceTypeConfig: Record<AbsenceType, { label: string; color: string; bgLight: string; icon: React.ReactNode }> = {
  VACATION: {
    label: 'Vacation',
    color: 'bg-sky-500',
    bgLight: 'bg-sky-50 dark:bg-sky-900/20',
    icon: <Palmtree className="h-4 w-4" />,
  },
  SICK_LEAVE: {
    label: 'Sick Leave',
    color: 'bg-rose-500',
    bgLight: 'bg-rose-50 dark:bg-rose-900/20',
    icon: <Stethoscope className="h-4 w-4" />,
  },
  UNPAID: {
    label: 'Unpaid Leave',
    color: 'bg-gray-500',
    bgLight: 'bg-gray-50 dark:bg-gray-800',
    icon: <CalendarOff className="h-4 w-4" />,
  },
  AUTHORIZED: {
    label: 'Authorized',
    color: 'bg-emerald-500',
    bgLight: 'bg-emerald-50 dark:bg-emerald-900/20',
    icon: <CalendarCheck className="h-4 w-4" />,
  },
  UNAUTHORIZED: {
    label: 'Unauthorized',
    color: 'bg-red-600',
    bgLight: 'bg-red-50 dark:bg-red-900/20',
    icon: <CalendarX2 className="h-4 w-4" />,
  },
}

const statusConfig: Record<AbsenceStatus, { label: string; color: string; textColor: string; icon: React.ReactNode }> = {
  PENDING: {
    label: 'Pending',
    color: 'bg-amber-100 dark:bg-amber-900/30',
    textColor: 'text-amber-700 dark:text-amber-400',
    icon: <Clock className="h-4 w-4" />,
  },
  APPROVED: {
    label: 'Approved',
    color: 'bg-emerald-100 dark:bg-emerald-900/30',
    textColor: 'text-emerald-700 dark:text-emerald-400',
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
  REJECTED: {
    label: 'Rejected',
    color: 'bg-red-100 dark:bg-red-900/30',
    textColor: 'text-red-700 dark:text-red-400',
    icon: <XCircle className="h-4 w-4" />,
  },
  CANCELLED: {
    label: 'Cancelled',
    color: 'bg-gray-100 dark:bg-gray-700',
    textColor: 'text-gray-600 dark:text-gray-400',
    icon: <X className="h-4 w-4" />,
  },
}

export function AbsencesPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  // State
  const [absences, setAbsences] = useState<Absence[]>([])
  const [pendingAbsences, setPendingAbsences] = useState<Absence[]>([])
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [reviewLoading, setReviewLoading] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<AbsenceType | 'ALL'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  // Load data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)

      try {
        const year = currentMonth.getFullYear()
        const month = currentMonth.getMonth() + 1
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`
        const endDate = `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`

        const [absencesData, pendingData] = await Promise.all([
          absencesApi.getCalendar({ dateFrom: startDate, dateTo: endDate }),
          absencesApi.getPending(),
        ])

        setAbsences(absencesData)
        setPendingAbsences(pendingData)
      } catch (err: any) {
        console.error('Failed to load absences:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [currentMonth])

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(currentMonth)
    const firstDay = getFirstDayOfMonth(currentMonth)
    const days: (number | null)[] = []

    // Pad with nulls for days before the 1st
    for (let i = 0; i < firstDay; i++) {
      days.push(null)
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }

    return days
  }, [currentMonth])

  // Get absences for a specific day
  const getAbsencesForDay = (day: number) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return absences.filter((a) => {
      const start = a.startDate
      const end = a.endDate
      return dateStr >= start && dateStr <= end && a.status !== 'CANCELLED' && a.status !== 'REJECTED'
    })
  }

  // Stats
  const stats = useMemo(() => {
    const approved = absences.filter((a) => a.status === 'APPROVED').length
    const pending = pendingAbsences.length
    const totalDays = absences
      .filter((a) => a.status === 'APPROVED')
      .reduce((sum, a) => sum + (a.totalDays || 0), 0)

    return { approved, pending, totalDays }
  }, [absences, pendingAbsences])

  // Navigate month
  const goToPrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  // Review absence
  const handleReview = async (absenceId: string, approved: boolean) => {
    setReviewLoading(absenceId)
    try {
      await absencesApi.review(absenceId, {
        status: approved ? 'APPROVED' : 'REJECTED',
        reviewNotes: approved ? 'Approved' : 'Rejected',
      })
      // Refresh pending list
      const pendingData = await absencesApi.getPending()
      setPendingAbsences(pendingData)
      // Refresh calendar
      const year = currentMonth.getFullYear()
      const month = currentMonth.getMonth() + 1
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`
      const endDate = `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`
      const absencesData = await absencesApi.getCalendar({ dateFrom: startDate, dateTo: endDate })
      setAbsences(absencesData)
    } catch (err: any) {
      alert(err.message || 'Failed to review absence')
    } finally {
      setReviewLoading(null)
    }
  }

  // Filtered absences for list view
  const filteredAbsences = useMemo(() => {
    return absences.filter((a) => {
      if (filterType !== 'ALL' && a.absenceType !== filterType) return false
      if (searchQuery) {
        const agentName = a.agent?.firstName + ' ' + a.agent?.lastName
        if (!agentName.toLowerCase().includes(searchQuery.toLowerCase())) return false
      }
      return true
    })
  }, [absences, filterType, searchQuery])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('absences.title', 'Absences & Leave')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {t('absences.subtitle', 'Manage employee leave requests and track absences')}
          </p>
        </div>
        <button
          onClick={() => navigate('/personnel/absences/new')}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="h-5 w-5" />
          {t('absences.newRequest', 'New Request')}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Pending Card */}
        <div className="relative overflow-hidden bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-5 text-white">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8" />
          <div className="relative">
            <div className="flex items-center gap-2 text-amber-100 mb-2">
              <Clock className="h-5 w-5" />
              <span className="text-sm font-medium">{t('absences.stats.pending', 'Pending Review')}</span>
            </div>
            <p className="text-4xl font-bold">{stats.pending}</p>
            <p className="text-sm text-amber-100 mt-1">
              {t('absences.stats.awaitingDecision', 'Awaiting decision')}
            </p>
          </div>
        </div>

        {/* Approved Card */}
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl p-5 text-white">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8" />
          <div className="relative">
            <div className="flex items-center gap-2 text-emerald-100 mb-2">
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-sm font-medium">{t('absences.stats.approved', 'Approved')}</span>
            </div>
            <p className="text-4xl font-bold">{stats.approved}</p>
            <p className="text-sm text-emerald-100 mt-1">
              {t('absences.stats.thisMonth', 'This month')}
            </p>
          </div>
        </div>

        {/* Total Days Card */}
        <div className="relative overflow-hidden bg-gradient-to-br from-violet-500 to-purple-500 rounded-2xl p-5 text-white">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8" />
          <div className="relative">
            <div className="flex items-center gap-2 text-violet-100 mb-2">
              <Calendar className="h-5 w-5" />
              <span className="text-sm font-medium">{t('absences.stats.totalDays', 'Total Days Off')}</span>
            </div>
            <p className="text-4xl font-bold">{stats.totalDays}</p>
            <p className="text-sm text-violet-100 mt-1">
              {t('absences.stats.acrossTeam', 'Across all employees')}
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Calendar + Pending */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Calendar Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-gray-400" />
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex items-center gap-1">
              <button
                onClick={goToPrevMonth}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>
              <button
                onClick={() => setCurrentMonth(new Date())}
                className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                {t('absences.today', 'Today')}
              </button>
              <button
                onClick={goToNextMonth}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="p-4">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, i) => {
                if (!day) {
                  return <div key={i} className="aspect-square" />
                }

                const dayAbsences = getAbsencesForDay(day)
                const isToday =
                  day === new Date().getDate() &&
                  currentMonth.getMonth() === new Date().getMonth() &&
                  currentMonth.getFullYear() === new Date().getFullYear()

                return (
                  <div
                    key={i}
                    className={`aspect-square p-1 rounded-lg border transition-colors ${
                      isToday
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : dayAbsences.length > 0
                        ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50'
                        : 'border-transparent'
                    }`}
                  >
                    <div className="h-full flex flex-col">
                      <span
                        className={`text-sm font-medium ${
                          isToday
                            ? 'text-primary-600 dark:text-primary-400'
                            : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {day}
                      </span>
                      {/* Absence indicators */}
                      <div className="flex-1 flex flex-wrap gap-0.5 mt-1 overflow-hidden">
                        {dayAbsences.slice(0, 3).map((absence, j) => (
                          <div
                            key={j}
                            className={`w-2 h-2 rounded-full ${absenceTypeConfig[absence.absenceType].color}`}
                            title={`${absence.agent?.firstName} ${absence.agent?.lastName} - ${absenceTypeConfig[absence.absenceType].label}`}
                          />
                        ))}
                        {dayAbsences.length > 3 && (
                          <span className="text-xs text-gray-500">+{dayAbsences.length - 3}</span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="px-4 pb-4 flex flex-wrap gap-3">
            {Object.entries(absenceTypeConfig).map(([type, config]) => (
              <div key={type} className="flex items-center gap-2 text-sm">
                <div className={`w-3 h-3 rounded-full ${config.color}`} />
                <span className="text-gray-600 dark:text-gray-400">{config.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Requests */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              {t('absences.pendingRequests', 'Pending Requests')}
              {pendingAbsences.length > 0 && (
                <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full">
                  {pendingAbsences.length}
                </span>
              )}
            </h2>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-[500px] overflow-y-auto">
            {pendingAbsences.length === 0 ? (
              <div className="p-8 text-center">
                <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400 font-medium">
                  {t('absences.noPending', 'All caught up!')}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                  {t('absences.noPendingDesc', 'No pending requests to review')}
                </p>
              </div>
            ) : (
              pendingAbsences.map((absence) => {
                const typeConfig = absenceTypeConfig[absence.absenceType]
                return (
                  <div key={absence.id} className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Type Icon */}
                      <div className={`p-2 rounded-lg ${typeConfig.bgLight} ${typeConfig.color.replace('bg-', 'text-')}`}>
                        {typeConfig.icon}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900 dark:text-white truncate">
                            {absence.agent?.firstName} {absence.agent?.lastName}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {typeConfig.label} • {absence.totalDays} {absence.totalDays === 1 ? 'day' : 'days'}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-500 mt-0.5">
                          {new Date(absence.startDate).toLocaleDateString()} - {new Date(absence.endDate).toLocaleDateString()}
                        </p>
                        {absence.reason && (
                          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1 truncate">
                            "{absence.reason}"
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-3 ml-11">
                      <button
                        onClick={() => handleReview(absence.id, true)}
                        disabled={reviewLoading === absence.id}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg font-medium text-sm hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors disabled:opacity-50"
                      >
                        {reviewLoading === absence.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                        {t('absences.approve', 'Approve')}
                      </button>
                      <button
                        onClick={() => handleReview(absence.id, false)}
                        disabled={reviewLoading === absence.id}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg font-medium text-sm hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
                      >
                        <X className="h-4 w-4" />
                        {t('absences.reject', 'Reject')}
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Recent Absences List */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center gap-4">
          <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-gray-400" />
            {t('absences.allAbsences', 'All Absences')}
          </h2>

          <div className="flex-1 flex flex-wrap gap-2 sm:justify-end">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('absences.searchEmployee', 'Search employee...')}
                className="pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Filter by type */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as AbsenceType | 'ALL')}
              className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="ALL">{t('absences.allTypes', 'All Types')}</option>
              {Object.entries(absenceTypeConfig).map(([type, config]) => (
                <option key={type} value={type}>
                  {config.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Absences Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('absences.table.employee', 'Employee')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('absences.table.type', 'Type')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('absences.table.dates', 'Dates')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('absences.table.days', 'Days')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('absences.table.status', 'Status')}
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('absences.table.actions', 'Actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredAbsences.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <Calendar className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">
                      {t('absences.noAbsences', 'No absences found')}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredAbsences.map((absence) => {
                  const typeConfig = absenceTypeConfig[absence.absenceType]
                  const statusCfg = statusConfig[absence.status]

                  return (
                    <tr key={absence.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                            <User className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {absence.agent?.firstName} {absence.agent?.lastName}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {absence.agent?.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded ${typeConfig.bgLight} ${typeConfig.color.replace('bg-', 'text-')}`}>
                            {typeConfig.icon}
                          </div>
                          <span className="text-gray-900 dark:text-white text-sm">
                            {typeConfig.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-gray-900 dark:text-white">
                          {new Date(absence.startDate).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          → {new Date(absence.endDate).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {absence.totalDays} {absence.totalDays === 1 ? 'day' : 'days'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusCfg.color} ${statusCfg.textColor}`}>
                          {statusCfg.icon}
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button
                          onClick={() => navigate(`/personnel/absences/${absence.id}`)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-500 dark:text-gray-400"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default AbsencesPage
