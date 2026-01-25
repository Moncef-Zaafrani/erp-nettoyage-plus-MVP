import { InputHTMLAttributes, forwardRef, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import clsx from 'clsx'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, type, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false)
    const isPassword = type === 'password'
    
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            type={isPassword && showPassword ? 'text' : type}
            className={clsx(
              'w-full px-3 py-2.5 rounded-lg',
              'bg-[var(--color-bg)] text-[var(--color-text)]',
              'border transition-all duration-200',
              'placeholder:text-[var(--color-text-muted)]',
              'focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-[var(--color-bg)]',
              error
                ? 'border-[var(--color-error)] focus:ring-[var(--color-error)]/30'
                : 'border-[var(--color-border)] focus:border-primary-500 focus:ring-primary-500/30',
              isPassword && 'pr-10',
              className
            )}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}
        </div>
        {error && (
          <p className="mt-1.5 text-sm text-[var(--color-error)]">{error}</p>
        )}
        {hint && !error && (
          <p className="mt-1.5 text-sm text-[var(--color-text-muted)]">{hint}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
