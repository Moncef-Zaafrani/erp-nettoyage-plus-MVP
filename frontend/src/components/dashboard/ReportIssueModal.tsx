import { useState, useRef, ChangeEvent } from 'react'
import { useTranslation } from 'react-i18next'
import {
  X,
  AlertTriangle,
  Upload,
  Trash2,
  Send,
  CheckCircle,
  Loader2,
  Wrench,
  Shield,
  Calendar,
  Key,
  MessageSquare,
  MoreHorizontal,
} from 'lucide-react'
import { reportsApi, ReportCategory, ReportPriority } from '@/services/api'
import { useToast } from '@/components/ui/Toast'

interface ReportIssueModalProps {
  isOpen: boolean
  onClose: () => void
}

// Category options with icons
const categories: { value: ReportCategory; label: string; icon: typeof Wrench }[] = [
  { value: 'equipment_issue', label: 'Equipment Issue', icon: Wrench },
  { value: 'safety_concern', label: 'Safety Concern', icon: Shield },
  { value: 'schedule_problem', label: 'Schedule Problem', icon: Calendar },
  { value: 'site_access', label: 'Site Access Issue', icon: Key },
  { value: 'client_complaint', label: 'Client Complaint', icon: MessageSquare },
  { value: 'other', label: 'Other', icon: MoreHorizontal },
]

// Priority options
const priorities: { value: ReportPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400' },
  { value: 'medium', label: 'Medium', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400' },
]

export function ReportIssueModal({ isOpen, onClose }: ReportIssueModalProps) {
  const { t } = useTranslation()
  const toast = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<ReportCategory>('other')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<ReportPriority>('medium')
  const [screenshot, setScreenshot] = useState<string | null>(null)
  const [screenshotName, setScreenshotName] = useState<string | null>(null)

  // UI state
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [ticketId, setTicketId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleScreenshotChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Invalid file type', 'Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large', 'Maximum file size is 5MB')
      return
    }

    // Convert to base64 for preview (in production, upload to storage)
    const reader = new FileReader()
    reader.onload = () => {
      setScreenshot(reader.result as string)
      setScreenshotName(file.name)
    }
    reader.readAsDataURL(file)
  }

  const removeScreenshot = () => {
    setScreenshot(null)
    setScreenshotName(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async () => {
    // Validation
    if (!title.trim()) {
      setError('Please enter a title')
      return
    }
    if (title.trim().length < 5) {
      setError('Title must be at least 5 characters')
      return
    }
    if (!description.trim()) {
      setError('Please enter a description')
      return
    }
    if (description.trim().length < 10) {
      setError('Description must be at least 10 characters')
      return
    }

    setError(null)
    setSubmitting(true)

    try {
      const report = await reportsApi.create({
        title: title.trim(),
        category,
        description: description.trim(),
        priority,
        screenshotUrl: screenshot || undefined,
      })

      setTicketId(report.id.slice(0, 8).toUpperCase())
      setSubmitted(true)

      toast.success(
        'Report Submitted',
        `Your report #${report.id.slice(0, 8).toUpperCase()} has been sent to your supervisor`
      )

      // Auto-close after showing success
      setTimeout(() => {
        handleClose()
      }, 3000)
    } catch (err) {
      console.error('Failed to submit report:', err)
      setError('Failed to submit report. Please try again.')
      toast.error('Submission Failed', 'Could not submit your report')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    // Reset form
    setTitle('')
    setCategory('other')
    setDescription('')
    setPriority('medium')
    setScreenshot(null)
    setScreenshotName(null)
    setSubmitted(false)
    setTicketId(null)
    setError(null)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={handleClose}>
      <div
        className="relative mx-4 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-2xl dark:bg-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('report.title', 'Report an Issue')}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t('report.subtitle', 'Your report will be sent to your supervisor')}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Success State */}
        {submitted ? (
          <div className="p-8 text-center">
            <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {t('report.submitted', 'Report Submitted!')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {t('report.ticketNumber', 'Your ticket number is:')}
            </p>
            <div className="inline-flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg font-mono font-bold text-lg text-gray-900 dark:text-white">
              #{ticketId}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
              {t('report.notifyInfo', 'Your supervisor has been notified and will respond soon.')}
            </p>
          </div>
        ) : (
          <>
            {/* Form */}
            <div className="p-5 space-y-4">
              {/* Error Message */}
              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('report.issueTitle', 'Issue Title')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value.slice(0, 100))}
                  placeholder={t('report.titlePlaceholder', 'Brief description of the issue')}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-red-400 focus:ring-2 focus:ring-red-400/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white outline-none transition-colors"
                />
                <p className="text-right text-xs text-gray-400 mt-1">{title.length}/100</p>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('report.category', 'Category')}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {categories.map((cat) => {
                    const Icon = cat.icon
                    return (
                      <button
                        key={cat.value}
                        onClick={() => setCategory(cat.value)}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-colors ${
                          category === cat.value
                            ? 'border-red-400 bg-red-50 dark:bg-red-900/20 dark:border-red-700'
                            : 'border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700'
                        }`}
                      >
                        <Icon className={`h-5 w-5 ${category === cat.value ? 'text-red-600 dark:text-red-400' : 'text-gray-400'}`} />
                        <span className={`text-xs font-medium ${category === cat.value ? 'text-red-700 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`}>
                          {cat.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('report.description', 'Description')} <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, 1000))}
                  placeholder={t('report.descriptionPlaceholder', 'Provide details about the issue...')}
                  className="w-full h-28 px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-red-400 focus:ring-2 focus:ring-red-400/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white outline-none resize-none transition-colors"
                />
                <p className="text-right text-xs text-gray-400 mt-1">{description.length}/1000</p>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('report.priority', 'Priority')}
                </label>
                <div className="flex gap-2">
                  {priorities.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => setPriority(p.value)}
                      className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                        priority === p.value ? p.color : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Screenshot Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('report.screenshot', 'Screenshot')} <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                
                {screenshot ? (
                  <div className="relative rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <img
                      src={screenshot}
                      alt="Screenshot preview"
                      className="w-full h-40 object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-white truncate">{screenshotName}</span>
                        <button
                          onClick={removeScreenshot}
                          className="p-1.5 rounded bg-white/20 hover:bg-white/30 text-white transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex flex-col items-center gap-2 p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-red-400 dark:hover:border-red-600 transition-colors"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                      <Upload className="h-5 w-5 text-gray-400" />
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {t('report.uploadScreenshot', 'Click to upload a screenshot')}
                    </span>
                    <span className="text-xs text-gray-400">Max 5MB • PNG, JPG, GIF</span>
                  </button>
                )}
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleScreenshotChange}
                  className="hidden"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 flex gap-3 p-5 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !title.trim() || !description.trim()}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('common.submitting', 'Submitting...')}
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    {t('report.submit', 'Submit Report')}
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default ReportIssueModal
