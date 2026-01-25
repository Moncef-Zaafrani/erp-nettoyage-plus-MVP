import { useTranslation } from 'react-i18next'
import { X, Sparkles, Clock } from 'lucide-react'
import { NavItem } from '@/config/navigation'

interface WipModalProps {
  item: NavItem | null
  onClose: () => void
}

export function WipModal({ item, onClose }: WipModalProps) {
  const { t } = useTranslation()

  if (!item) return null

  const Icon = item.icon

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Icon */}
        <div className="mb-4 flex justify-center">
          <div className="relative">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600">
              <Icon className="h-8 w-8 text-white" />
            </div>
            <div className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-yellow-400">
              <Sparkles className="h-3.5 w-3.5 text-yellow-900" />
            </div>
          </div>
        </div>

        {/* Title */}
        <h2 className="mb-2 text-center text-xl font-semibold text-gray-900 dark:text-white">
          {t('wip.title', 'Coming Soon!')}
        </h2>

        {/* Feature name */}
        <p className="mb-4 text-center text-lg font-medium text-blue-600 dark:text-blue-400">
          {t(item.labelKey, item.label)}
        </p>

        {/* Description */}
        <p className="mb-6 text-center text-sm text-gray-600 dark:text-gray-400">
          {t('wip.description', "We're working hard to bring you this feature. It will be available in a future update.")}
        </p>

        {/* Phase badge */}
        {item.wipPhase && (
          <div className="mb-6 flex items-center justify-center gap-2">
            <Clock className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {t('wip.phase', 'Planned for Phase {{phase}}', { phase: item.wipPhase })}
            </span>
          </div>
        )}

        {/* Close button */}
        <button
          onClick={onClose}
          className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
        >
          {t('wip.gotIt', 'Got it!')}
        </button>
      </div>
    </div>
  )
}
