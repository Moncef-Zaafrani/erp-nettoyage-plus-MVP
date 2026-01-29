import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar,
  Palmtree,
  Stethoscope,
  CalendarOff,
  CalendarCheck,
  FileText,
  Upload,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Info,
} from 'lucide-react'
import { absencesApi, AbsenceType, AbsenceBalance } from '@/services/api'
import { useAuth } from '@/contexts/AuthContext'

// Absence type options with visual config
const absenceTypes: { type: AbsenceType; label: string; icon: React.ReactNode; color: string; description: string }[] = [
  {
    type: 'VACATION',
    label: 'Vacation',
    icon: <Palmtree className="h-6 w-6" />,
    color: 'bg-sky-500 text-white',
    description: 'Annual paid leave',
  },
  {
    type: 'SICK_LEAVE',
    label: 'Sick Leave',
    icon: <Stethoscope className="h-6 w-6" />,
    color: 'bg-rose-500 text-white',
    description: 'Medical absence',
  },
  {
    type: 'UNPAID',
    label: 'Unpaid Leave',
    icon: <CalendarOff className="h-6 w-6" />,
    color: 'bg-gray-500 text-white',
    description: 'Leave without pay',
  },
  {
    type: 'AUTHORIZED',
    label: 'Authorized Absence',
    icon: <CalendarCheck className="h-6 w-6" />,
    color: 'bg-emerald-500 text-white',
    description: 'Pre-approved absence',
  },
]

export function AbsenceRequestPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()

  // Form state
  const [selectedType, setSelectedType] = useState<AbsenceType | null>(null)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reason, setReason] = useState('')

  // UI state
  const [loading, setLoading] = useState(false)
  const [balanceLoading, setBalanceLoading] = useState(true)
  const [balance, setBalance] = useState<AbsenceBalance | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [calculatedDays, setCalculatedDays] = useState<number | null>(null)

  // Load balance
  useEffect(() => {
    const loadBalance = async () => {
      if (!user?.id) return
      setBalanceLoading(true)
      try {
        const data = await absencesApi.getBalance(user.id)
        setBalance(data)
      } catch (err) {
        // Silently fail - balance may not be set up yet
        console.log('Could not load balance:', err)
      } finally {
        setBalanceLoading(false)
      }
    }

    loadBalance()
  }, [user?.id])

  // Calculate working days when dates change
  useEffect(() => {
    if (!startDate || !endDate) {
      setCalculatedDays(null)
      return
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    if (end < start) {
      setCalculatedDays(null)
      return
    }

    // Simple working days calculation (excluding weekends)
    let count = 0
    const current = new Date(start)
    while (current <= end) {
      const day = current.getDay()
      if (day !== 0 && day !== 6) {
        count++
      }
      current.setDate(current.getDate() + 1)
    }

    setCalculatedDays(count)
  }, [startDate, endDate])

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedType || !startDate || !endDate || !user?.id) {
      setError(t('absenceRequest.errors.required', 'Please fill in all required fields'))
      return
    }

    if (new Date(endDate) < new Date(startDate)) {
      setError(t('absenceRequest.errors.invalidDates', 'End date must be after start date'))
      return
    }

    setLoading(true)
    setError(null)

    try {
      await absencesApi.create({
        agentId: user.id,
        absenceType: selectedType,
        startDate,
        endDate,
        reason: reason.trim() || undefined,
        attachmentUrl: undefined, // File upload not implemented yet
      })

      setSuccess(true)
      setTimeout(() => {
        navigate('/my-profile')
      }, 2000)
    } catch (err: any) {
      setError(err.message || t('absenceRequest.errors.submitFailed', 'Failed to submit request'))
    } finally {
      setLoading(false)
    }
  }

  // Success screen
  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {t('absenceRequest.success.title', 'Request Submitted!')}
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            {t('absenceRequest.success.message', 'Your leave request has been sent for approval')}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-8">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-4 safe-area-top">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div>
            <h1 className="font-bold text-lg text-gray-900 dark:text-white">
              {t('absenceRequest.title', 'Request Leave')}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('absenceRequest.subtitle', 'Submit a new absence request')}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Balance Card */}
        {!balanceLoading && balance && (
          <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-5 text-white mb-6">
            <h3 className="font-medium text-primary-100 mb-3">
              {t('absenceRequest.balance.title', 'Your Leave Balance')}
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-3xl font-bold">{balance.vacationDaysRemaining}</p>
                <p className="text-sm text-primary-200">{t('absenceRequest.balance.vacationDays', 'Vacation days')}</p>
              </div>
              <div>
                <p className="text-3xl font-bold">{balance.sickDaysUsed}</p>
                <p className="text-sm text-primary-200">{t('absenceRequest.balance.sickDaysUsed', 'Sick days used')}</p>
              </div>
              <div>
                <p className="text-3xl font-bold">{balance.vacationDaysUsed}</p>
                <p className="text-sm text-primary-200">{t('absenceRequest.balance.daysUsed', 'Days used')}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Alert */}
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Leave Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              {t('absenceRequest.leaveType', 'Type of Leave')} <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {absenceTypes.map((option) => (
                <button
                  key={option.type}
                  type="button"
                  onClick={() => setSelectedType(option.type)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    selectedType === option.type
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${option.color}`}>{option.icon}</div>
                    <div className="flex-1">
                      <p className={`font-medium ${
                        selectedType === option.type
                          ? 'text-primary-700 dark:text-primary-300'
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {option.label}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {option.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Date Selection */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-5 w-5 text-gray-400" />
              <span className="font-medium text-gray-900 dark:text-white">
                {t('absenceRequest.dates', 'Select Dates')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1.5">
                  {t('absenceRequest.startDate', 'Start Date')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1.5">
                  {t('absenceRequest.endDate', 'End Date')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
            </div>

            {/* Days calculation */}
            {calculatedDays !== null && (
              <div className="mt-4 flex items-center gap-2 text-sm">
                <Info className="h-4 w-4 text-primary-500" />
                <span className="text-gray-600 dark:text-gray-400">
                  {t('absenceRequest.totalDays', 'Total working days:')}
                </span>
                <span className="font-semibold text-primary-600 dark:text-primary-400">
                  {calculatedDays} {calculatedDays === 1 ? 'day' : 'days'}
                </span>
              </div>
            )}
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-400" />
                {t('absenceRequest.reason', 'Reason')} <span className="text-gray-400">(optional)</span>
              </div>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder={t('absenceRequest.reasonPlaceholder', 'Provide details about your request...')}
              className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
            />
          </div>

          {/* Attachment (for sick leave) */}
          {selectedType === 'SICK_LEAVE' && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Upload className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-amber-800 dark:text-amber-200">
                    {t('absenceRequest.medicalCertificate', 'Medical Certificate')}
                  </p>
                  <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                    {t('absenceRequest.uploadInfo', 'You may need to provide a medical certificate for sick leave')}
                  </p>
                  <button
                    type="button"
                    onClick={() => alert('File upload will be available in the mobile app')}
                    className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-lg font-medium text-sm hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
                  >
                    <Upload className="h-4 w-4" />
                    {t('absenceRequest.uploadDocument', 'Upload Document')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !selectedType || !startDate || !endDate}
            className="w-full flex items-center justify-center gap-2 py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                {t('absenceRequest.submitting', 'Submitting...')}
              </>
            ) : (
              <>
                <CheckCircle2 className="h-5 w-5" />
                {t('absenceRequest.submit', 'Submit Request')}
              </>
            )}
          </button>

          {/* Info text */}
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            {t('absenceRequest.infoText', 'Your request will be reviewed by your manager')}
          </p>
        </form>
      </div>
    </div>
  )
}

export default AbsenceRequestPage
