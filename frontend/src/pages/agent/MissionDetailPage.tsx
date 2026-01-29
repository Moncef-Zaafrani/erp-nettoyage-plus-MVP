import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Clock,
  MapPin,
  CheckCircle2,
  PlayCircle,
  Navigation,
  Camera,
  AlertCircle,
  Loader2,
  Phone,
  Building2,
  ClipboardCheck,
  Timer,
  Upload,
  Image,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Flag,
} from 'lucide-react'
import {
  interventionsApi,
  Intervention,
  InterventionStatus,
} from '@/services/api'

// Status colors
const statusColors: Record<InterventionStatus, { bg: string; text: string; border: string }> = {
  SCHEDULED: { bg: 'bg-blue-500', text: 'text-blue-600', border: 'border-blue-500' },
  IN_PROGRESS: { bg: 'bg-amber-500', text: 'text-amber-600', border: 'border-amber-500' },
  COMPLETED: { bg: 'bg-emerald-500', text: 'text-emerald-600', border: 'border-emerald-500' },
  CANCELLED: { bg: 'bg-red-500', text: 'text-red-600', border: 'border-red-500' },
  RESCHEDULED: { bg: 'bg-purple-500', text: 'text-purple-600', border: 'border-purple-500' },
}

export function MissionDetailPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  // State
  const [mission, setMission] = useState<Intervention | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showInstructions, setShowInstructions] = useState(true)
  const [photos, setPhotos] = useState<string[]>([])

  // Load mission
  useEffect(() => {
    const loadMission = async () => {
      if (!id) return
      setLoading(true)
      setError(null)

      try {
        const data = await interventionsApi.getById(id)
        setMission(data)
        setPhotos(data.photoUrls || [])
      } catch (err: any) {
        setError(err.message || t('missions.detail.loadError', 'Failed to load mission'))
      } finally {
        setLoading(false)
      }
    }

    loadMission()
  }, [id, t])

  // Format time
  const formatTime = (time: string | null) => {
    if (!time) return '--:--'
    return time.slice(0, 5)
  }

  // Get current GPS position
  const getCurrentPosition = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'))
        return
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      })
    })
  }

  // Start mission
  const handleStart = async () => {
    if (!id) return
    setActionLoading('start')
    try {
      const updated = await interventionsApi.start(id)
      setMission(updated)
    } catch (err: any) {
      alert(err.message || 'Failed to start mission')
    } finally {
      setActionLoading(null)
    }
  }

  // GPS Check-in
  const handleCheckIn = async () => {
    if (!id) return
    setActionLoading('checkin')

    try {
      const position = await getCurrentPosition()
      await interventionsApi.checkIn(id, {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      })
      // Reload mission to get updated data
      const updated = await interventionsApi.getById(id)
      setMission(updated)
    } catch (err: any) {
      alert(err.message || 'Failed to check in')
    } finally {
      setActionLoading(null)
    }
  }

  // GPS Check-out
  const handleCheckOut = async () => {
    if (!id) return
    setActionLoading('checkout')

    try {
      const position = await getCurrentPosition()
      await interventionsApi.checkOut(id, {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      })
      // Reload mission
      const updated = await interventionsApi.getById(id)
      setMission(updated)
    } catch (err: any) {
      alert(err.message || 'Failed to check out')
    } finally {
      setActionLoading(null)
    }
  }

  // Complete mission
  const handleComplete = async () => {
    if (!id) return
    if (!confirm(t('missions.detail.confirmComplete', 'Are you sure you want to complete this mission?'))) {
      return
    }
    setActionLoading('complete')
    try {
      const updated = await interventionsApi.complete(id)
      setMission(updated)
    } catch (err: any) {
      alert(err.message || 'Failed to complete mission')
    } finally {
      setActionLoading(null)
    }
  }

  // Photo upload (simulated for now)
  const handlePhotoUpload = () => {
    // In a real app, this would open camera/file picker
    alert(t('missions.detail.photoUploadInfo', 'Photo upload will be available in the mobile app'))
  }

  // Calculate elapsed time
  const getElapsedTime = useCallback(() => {
    if (!mission?.actualStartTime) return null
    const start = new Date(`${mission.scheduledDate}T${mission.actualStartTime}`)
    const now = mission.actualEndTime
      ? new Date(`${mission.scheduledDate}T${mission.actualEndTime}`)
      : new Date()
    const diff = Math.floor((now.getTime() - start.getTime()) / 1000 / 60)
    const hours = Math.floor(diff / 60)
    const minutes = diff % 60
    return `${hours}h ${minutes}m`
  }, [mission])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
      </div>
    )
  }

  if (error || !mission) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {t('missions.detail.notFound', 'Mission Not Found')}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => navigate('/my-missions')}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg"
          >
            {t('missions.detail.backToMissions', 'Back to Missions')}
          </button>
        </div>
      </div>
    )
  }

  const status = statusColors[mission.status]
  const isInProgress = mission.status === 'IN_PROGRESS'
  const isScheduled = mission.status === 'SCHEDULED'
  const isCompleted = mission.status === 'COMPLETED'
  const hasCheckedIn = mission.gpsCheckInLat !== null
  const hasCheckedOut = mission.gpsCheckOutLat !== null

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-32">
      {/* Header */}
      <div className={`sticky top-0 z-20 ${status.bg} text-white px-4 py-4 safe-area-top`}>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => navigate('/my-missions')}
              className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex-1">
              <p className="text-sm opacity-80">{mission.interventionCode}</p>
              <h1 className="font-bold">{mission.site?.name || 'Mission'}</h1>
            </div>
            {isInProgress && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 rounded-full text-sm">
                <Timer className="h-4 w-4" />
                {getElapsedTime()}
              </div>
            )}
          </div>

          {/* Quick Info Bar */}
          <div className="flex items-center gap-4 text-sm opacity-90">
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {formatTime(mission.scheduledStartTime)} - {formatTime(mission.scheduledEndTime)}
            </div>
            {mission.site?.address && (
              <div className="flex items-center gap-1.5 truncate">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{mission.site.address.split(',')[0]}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* GPS Status Banner */}
        {isInProgress && (
          <div className={`rounded-xl p-4 ${
            hasCheckedIn && hasCheckedOut
              ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800'
              : hasCheckedIn
              ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
              : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${
                hasCheckedIn && hasCheckedOut
                  ? 'bg-emerald-100 dark:bg-emerald-900/40'
                  : hasCheckedIn
                  ? 'bg-amber-100 dark:bg-amber-900/40'
                  : 'bg-blue-100 dark:bg-blue-900/40'
              }`}>
                <Navigation className={`h-5 w-5 ${
                  hasCheckedIn && hasCheckedOut
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : hasCheckedIn
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-blue-600 dark:text-blue-400'
                }`} />
              </div>
              <div className="flex-1">
                <p className={`font-medium ${
                  hasCheckedIn && hasCheckedOut
                    ? 'text-emerald-800 dark:text-emerald-200'
                    : hasCheckedIn
                    ? 'text-amber-800 dark:text-amber-200'
                    : 'text-blue-800 dark:text-blue-200'
                }`}>
                  {hasCheckedIn && hasCheckedOut
                    ? t('missions.detail.checkedInOut', '✓ Checked in & out')
                    : hasCheckedIn
                    ? t('missions.detail.checkedIn', '✓ Checked in - Working')
                    : t('missions.detail.notCheckedIn', 'GPS Check-in Required')
                  }
                </p>
                <p className={`text-sm ${
                  hasCheckedIn && hasCheckedOut
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : hasCheckedIn
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-blue-600 dark:text-blue-400'
                }`}>
                  {hasCheckedIn && hasCheckedOut
                    ? t('missions.detail.readyToComplete', 'Ready to complete mission')
                    : hasCheckedIn
                    ? t('missions.detail.checkOutWhenDone', 'Check out when you finish')
                    : t('missions.detail.checkInToStart', 'Check in to confirm your arrival')
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Site Details Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Building2 className="h-5 w-5 text-gray-400" />
              {t('missions.detail.siteInfo', 'Site Information')}
            </h2>
          </div>
          <div className="p-4 space-y-4">
            {/* Address */}
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                {t('missions.detail.address', 'Address')}
              </p>
              <p className="text-gray-900 dark:text-white">
                {mission.site?.address || t('missions.detail.noAddress', 'No address available')}
              </p>
              {mission.site?.address && (
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(mission.site.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-2 text-sm text-primary-600 dark:text-primary-400 font-medium"
                >
                  <MapPin className="h-4 w-4" />
                  {t('missions.detail.openInMaps', 'Open in Maps')}
                </a>
              )}
            </div>

            {/* Contact */}
            {mission.site?.contactPhone && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  {t('missions.detail.contact', 'Contact')}
                </p>
                <a
                  href={`tel:${mission.site.contactPhone}`}
                  className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 font-medium"
                >
                  <Phone className="h-4 w-4" />
                  {mission.site.contactPhone}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Instructions Card */}
        {mission.notes && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              className="w-full p-4 flex items-center justify-between text-left"
            >
              <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-gray-400" />
                {t('missions.detail.instructions', 'Instructions')}
              </h2>
              {showInstructions ? (
                <ChevronUp className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              )}
            </button>
            {showInstructions && (
              <div className="px-4 pb-4">
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap">
                  {mission.notes}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Photos Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Camera className="h-5 w-5 text-gray-400" />
              {t('missions.detail.photos', 'Photos')}
              {photos.length > 0 && (
                <span className="text-sm font-normal text-gray-500">({photos.length})</span>
              )}
            </h2>
            {isInProgress && (
              <button
                onClick={handlePhotoUpload}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-lg font-medium"
              >
                <Upload className="h-4 w-4" />
                {t('missions.detail.addPhoto', 'Add')}
              </button>
            )}
          </div>
          <div className="p-4">
            {photos.length === 0 ? (
              <div className="text-center py-8">
                <Image className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('missions.detail.noPhotos', 'No photos yet')}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {photos.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700"
                  >
                    <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Notes/Feedback Card - for completed missions */}
        {isCompleted && mission.clientFeedback && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-gray-400" />
                {t('missions.detail.clientFeedback', 'Client Feedback')}
              </h2>
            </div>
            <div className="p-4">
              <p className="text-gray-700 dark:text-gray-300">{mission.clientFeedback}</p>
            </div>
          </div>
        )}
      </div>

      {/* Fixed Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 safe-area-bottom z-30">
        <div className="max-w-2xl mx-auto">
          {isScheduled && (
            <button
              onClick={handleStart}
              disabled={actionLoading !== null}
              className="w-full flex items-center justify-center gap-2 py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold text-lg transition-colors disabled:opacity-50"
            >
              {actionLoading === 'start' ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <PlayCircle className="h-6 w-6" />
              )}
              {t('missions.detail.startMission', 'Start Mission')}
            </button>
          )}

          {isInProgress && !hasCheckedIn && (
            <button
              onClick={handleCheckIn}
              disabled={actionLoading !== null}
              className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-lg transition-colors disabled:opacity-50"
            >
              {actionLoading === 'checkin' ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Navigation className="h-6 w-6" />
              )}
              {t('missions.detail.gpsCheckIn', 'GPS Check-In')}
            </button>
          )}

          {isInProgress && hasCheckedIn && !hasCheckedOut && (
            <div className="flex gap-3">
              <button
                onClick={handleCheckOut}
                disabled={actionLoading !== null}
                className="flex-1 flex items-center justify-center gap-2 py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold transition-colors disabled:opacity-50"
              >
                {actionLoading === 'checkout' ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Flag className="h-5 w-5" />
                )}
                {t('missions.detail.checkOut', 'Check Out')}
              </button>
              <button
                onClick={handleComplete}
                disabled={actionLoading !== null}
                className="flex-1 flex items-center justify-center gap-2 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50"
              >
                {actionLoading === 'complete' ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-5 w-5" />
                )}
                {t('missions.detail.complete', 'Complete')}
              </button>
            </div>
          )}

          {isInProgress && hasCheckedIn && hasCheckedOut && (
            <button
              onClick={handleComplete}
              disabled={actionLoading !== null}
              className="w-full flex items-center justify-center gap-2 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-lg transition-colors disabled:opacity-50"
            >
              {actionLoading === 'complete' ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-6 w-6" />
              )}
              {t('missions.detail.completeMission', 'Complete Mission')}
            </button>
          )}

          {isCompleted && (
            <div className="text-center py-3">
              <div className="inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle2 className="h-5 w-5" />
                {t('missions.detail.missionCompleted', 'Mission Completed')}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MissionDetailPage
