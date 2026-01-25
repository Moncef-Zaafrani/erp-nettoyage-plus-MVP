import { AlertCircle, CheckCircle, XCircle, Info, X } from 'lucide-react'
import clsx from 'clsx'

interface AlertProps {
  type: 'error' | 'success' | 'warning' | 'info'
  message: string
  onDismiss?: () => void
}

const icons = {
  error: XCircle,
  success: CheckCircle,
  warning: AlertCircle,
  info: Info,
}

const styles = {
  error: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900 text-red-800 dark:text-red-200',
  success: 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900 text-green-800 dark:text-green-200',
  warning: 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-900 text-yellow-800 dark:text-yellow-200',
  info: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900 text-blue-800 dark:text-blue-200',
}

const iconStyles = {
  error: 'text-red-500',
  success: 'text-green-500',
  warning: 'text-yellow-500',
  info: 'text-blue-500',
}

export default function Alert({ type, message, onDismiss }: AlertProps) {
  const Icon = icons[type]
  
  return (
    <div className={clsx('flex items-start gap-3 p-4 rounded-lg border', styles[type])}>
      <Icon size={20} className={clsx('shrink-0 mt-0.5', iconStyles[type])} />
      <p className="flex-1 text-sm">{message}</p>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="shrink-0 p-0.5 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        >
          <X size={16} />
        </button>
      )}
    </div>
  )
}
