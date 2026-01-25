import { useTranslation } from 'react-i18next'

interface LoadingOverlayProps {
  message?: string
}

export default function LoadingOverlay({ message }: LoadingOverlayProps) {
  const { t } = useTranslation()
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-bg)]/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="h-12 w-12 rounded-full border-4 border-primary-200 dark:border-primary-900" />
          <div className="absolute inset-0 h-12 w-12 rounded-full border-4 border-primary-600 border-t-transparent animate-spin" />
        </div>
        <p className="text-sm font-medium text-[var(--color-text-secondary)]">
          {message || t('common.loading')}
        </p>
      </div>
    </div>
  )
}
