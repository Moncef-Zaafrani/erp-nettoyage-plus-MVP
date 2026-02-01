import { ReactNode } from 'react'
import { X, AlertTriangle, Info, AlertCircle, HelpCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'

type DialogType = 'info' | 'warning' | 'danger' | 'question'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string | ReactNode
  confirmText?: string
  cancelText?: string
  type?: DialogType
  loading?: boolean
}

const dialogConfig: Record<DialogType, { 
  icon: typeof AlertTriangle
  iconBg: string
  iconColor: string
  confirmBg: string
  confirmHover: string
}> = {
  info: {
    icon: Info,
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    iconColor: 'text-blue-600 dark:text-blue-400',
    confirmBg: 'bg-blue-600 hover:bg-blue-700',
    confirmHover: 'hover:bg-blue-700',
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'bg-amber-100 dark:bg-amber-900/30',
    iconColor: 'text-amber-600 dark:text-amber-400',
    confirmBg: 'bg-amber-600 hover:bg-amber-700',
    confirmHover: 'hover:bg-amber-700',
  },
  danger: {
    icon: AlertCircle,
    iconBg: 'bg-red-100 dark:bg-red-900/30',
    iconColor: 'text-red-600 dark:text-red-400',
    confirmBg: 'bg-red-600 hover:bg-red-700',
    confirmHover: 'hover:bg-red-700',
  },
  question: {
    icon: HelpCircle,
    iconBg: 'bg-purple-100 dark:bg-purple-900/30',
    iconColor: 'text-purple-600 dark:text-purple-400',
    confirmBg: 'bg-purple-600 hover:bg-purple-700',
    confirmHover: 'hover:bg-purple-700',
  },
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  type = 'question',
  loading = false,
}: ConfirmDialogProps) {
  const { t } = useTranslation()
  
  // Use translation for default button texts
  const defaultConfirmText = confirmText || t('common.confirm', 'Confirm')
  const defaultCancelText = cancelText || t('common.cancel', 'Cancel')
  
  if (!isOpen) return null

  const config = dialogConfig[type]
  const Icon = config.icon

  const handleConfirm = () => {
    if (loading) return
    onConfirm()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-800 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
          disabled={loading}
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-start gap-4">
          <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${config.iconBg}`}>
            <Icon className={`h-6 w-6 ${config.iconColor}`} />
          </div>
          
          <div className="flex-1 pt-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {message}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
          >
            {defaultCancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 transition-colors ${config.confirmBg}`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {t('common.processing', 'Processing...')}
              </span>
            ) : (
              defaultConfirmText
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
