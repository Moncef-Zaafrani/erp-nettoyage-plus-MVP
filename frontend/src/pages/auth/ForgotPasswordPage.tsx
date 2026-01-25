import { useState, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import AuthLayout from '@/components/auth/AuthLayout'
import { Input, Button, Alert, LoadingOverlay } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'

export default function ForgotPasswordPage() {
  const { t } = useTranslation()
  const { forgotPassword } = useAuth()
  
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [fieldError, setFieldError] = useState<string | undefined>()
  
  const validateForm = (): boolean => {
    if (!email) {
      setFieldError(t('error.requiredField'))
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFieldError(t('error.invalidEmail'))
      return false
    }
    setFieldError(undefined)
    return true
  }
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (!validateForm()) return
    
    setIsLoading(true)
    
    try {
      await forgotPassword(email)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error.failedToSendReset'))
    } finally {
      setIsLoading(false)
    }
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
            {t('auth.forgotPassword.title')}
          </h2>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            {t('auth.forgotPassword.subtitle')}
          </p>
        </div>
        
        {/* Success message */}
        {success && (
          <Alert type="success" message={t('auth.resetLinkSent')} />
        )}
        
        {/* Error alert */}
        {error && (
          <Alert type="error" message={error} onDismiss={() => setError(null)} />
        )}
        
        {/* Form */}
        {!success && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label={t('auth.email')}
              type="email"
              placeholder={t('auth.email.placeholder')}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (fieldError) setFieldError(undefined)
              }}
              error={fieldError}
              autoComplete="email"
              autoFocus
            />
            
            <Button type="submit" fullWidth size="lg" disabled={isLoading}>
              {t('auth.sendResetLink')}
            </Button>
          </form>
        )}
      </div>
    </AuthLayout>
  )
}
