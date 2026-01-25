import { useState, FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Wand2 } from 'lucide-react'
import AuthLayout from '@/components/auth/AuthLayout'
import { Input, Button, Alert, LoadingOverlay, PasswordStrength, generateStrongPassword } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'

export default function ResetPasswordPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { resetPassword } = useAuth()
  
  const email = searchParams.get('email') || ''
  const token = searchParams.get('token')
  
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirmPassword?: string }>({})
  
  const validateForm = (): boolean => {
    const errors: { password?: string; confirmPassword?: string } = {}
    
    if (!password) {
      errors.password = t('error.requiredField')
    } else if (password.length < 8) {
      errors.password = t('error.passwordTooShort')
    }
    
    if (!confirmPassword) {
      errors.confirmPassword = t('error.requiredField')
    } else if (password !== confirmPassword) {
      errors.confirmPassword = t('error.passwordMismatch')
    }
    
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }
  
  const handleGeneratePassword = () => {
    const generated = generateStrongPassword()
    setPassword(generated)
    setConfirmPassword(generated)
    setFieldErrors({})
  }
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (!validateForm()) return
    if (!token) {
      setError(t('error.invalidToken'))
      return
    }
    
    setIsLoading(true)
    
    try {
      await resetPassword(token, password)
      setSuccess(true)
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error.failedToResetPassword'))
    } finally {
      setIsLoading(false)
    }
  }
  
  // No token - show error
  if (!token) {
    return (
      <AuthLayout>
        <div className="space-y-6">
          <Alert type="error" message="Invalid or expired reset link. Please request a new one." />
          <Link to="/forgot-password">
            <Button variant="secondary" fullWidth>
              Request New Reset Link
            </Button>
          </Link>
        </div>
      </AuthLayout>
    )
  }
  
  return (
    <AuthLayout>
      {isLoading && <LoadingOverlay />}
      
      <div className="space-y-6">
        {/* Back link */}
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
        >
          <ArrowLeft size={16} />
          {t('auth.backToLogin')}
        </Link>
        
        {/* Header */}
        <div>
          <h2 className="text-2xl font-semibold text-[var(--color-text)]">
            {t('auth.resetPassword.title')}
          </h2>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            {t('auth.resetPassword.subtitle')}
          </p>
          {email && (
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              {email}
            </p>
          )}
        </div>
        
        {/* Success message */}
        {success && (
          <Alert type="success" message={t('auth.resetSuccess')} />
        )}
        
        {/* Error alert */}
        {error && (
          <Alert type="error" message={error} onDismiss={() => setError(null)} />
        )}
        
        {/* Form */}
        {!success && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-[var(--color-text)]">
                  {t('auth.newPassword')}
                </label>
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                >
                  <Wand2 size={12} />
                  {t('auth.generatePassword')}
                </button>
              </div>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: undefined })
                }}
                error={fieldErrors.password}
                autoComplete="new-password"
              />
              <div className="mt-2">
                <PasswordStrength password={password} />
              </div>
            </div>
            
            <Input
              label={t('auth.confirmPassword')}
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value)
                if (fieldErrors.confirmPassword) setFieldErrors({ ...fieldErrors, confirmPassword: undefined })
              }}
              error={fieldErrors.confirmPassword}
              autoComplete="new-password"
            />
            
            <Button type="submit" fullWidth size="lg" disabled={isLoading}>
              {t('auth.resetPassword')}
            </Button>
          </form>
        )}
      </div>
    </AuthLayout>
  )
}
