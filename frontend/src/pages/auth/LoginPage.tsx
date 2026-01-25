import { useState, FormEvent, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Zap, Shield, Users, Briefcase, User } from 'lucide-react'
import AuthLayout from '@/components/auth/AuthLayout'
import { Input, Button, Alert, LoadingOverlay } from '@/components/ui'
import { useAuth, UserRole } from '@/contexts/AuthContext'

const DEMO_ROLES: { role: UserRole; icon: typeof Shield; color: string; bgColor: string }[] = [
  { role: 'SUPER_ADMIN', icon: Shield, color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-100 dark:bg-purple-900/30' },
  { role: 'ADMIN', icon: Users, color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  { role: 'SUPERVISOR', icon: Briefcase, color: 'text-teal-600 dark:text-teal-400', bgColor: 'bg-teal-100 dark:bg-teal-900/30' },
  { role: 'AGENT', icon: User, color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-900/30' },
  { role: 'CLIENT', icon: User, color: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-100 dark:bg-orange-900/30' },
]

export default function LoginPage() {
  const { t } = useTranslation()
  const { login, loginAsRole, isLoading, error, clearError } = useAuth()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showDemo, setShowDemo] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})
  const demoRef = useRef<HTMLDivElement>(null)
  
  // Close demo popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (demoRef.current && !demoRef.current.contains(event.target as Node)) {
        setShowDemo(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  const validateForm = (): boolean => {
    const errors: { email?: string; password?: string } = {}
    
    if (!email) {
      errors.email = t('error.requiredField')
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = t('error.invalidEmail')
    }
    
    if (!password) {
      errors.password = t('error.requiredField')
    }
    
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    clearError()
    
    if (!validateForm()) return
    
    try {
      await login(email, password, rememberMe)
    } catch {
      // Error is handled by context
    }
  }
  
  const handleDemoLogin = async (role: UserRole) => {
    clearError()
    try {
      await loginAsRole(role)
    } catch {
      // Error is handled by context
    }
  }
  
  return (
    <AuthLayout>
      {isLoading && <LoadingOverlay message={t('auth.signingIn')} />}
      
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-[var(--color-text)]">
            {t('auth.login.title')}
          </h2>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            {t('auth.login.subtitle')}
          </p>
        </div>
        
        {/* Error alert */}
        {error && (
          <Alert type="error" message={error} onDismiss={clearError} />
        )}
        
        {/* Login form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={t('auth.email')}
            type="email"
            placeholder={t('auth.email.placeholder')}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: undefined })
            }}
            error={fieldErrors.email}
            autoComplete="email"
          />
          
          <Input
            label={t('auth.password')}
            type="password"
            placeholder={t('auth.password.placeholder')}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: undefined })
            }}
            error={fieldErrors.password}
            autoComplete="current-password"
          />
          
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-[var(--color-border)] text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-[var(--color-text-secondary)]">
                {t('auth.rememberMe')}
              </span>
            </label>
            
            <Link
              to="/forgot-password"
              className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
            >
              {t('auth.forgotPassword')}
            </Link>
          </div>
          
          <Button type="submit" fullWidth size="lg" disabled={isLoading}>
            {t('auth.signIn')}
          </Button>
        </form>
        
        {/* Demo access - modern popover style */}
        <div className="relative flex justify-center pt-4" ref={demoRef}>
          <button
            type="button"
            onClick={() => setShowDemo(!showDemo)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text)] bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] transition-all"
          >
            <Zap size={14} className="text-amber-500" />
            {t('auth.demoAccess')}
          </button>
          
          {showDemo && (
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-72 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] shadow-xl shadow-black/10 dark:shadow-black/30 p-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
              {/* Arrow */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 bg-[var(--color-bg)] border-r border-b border-[var(--color-border)]" />
              
              <div className="relative">
                <p className="px-2 py-1.5 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
                  {t('auth.demoAccess.hint')}
                </p>
                <div className="space-y-1">
                  {DEMO_ROLES.map(({ role, icon: Icon, color, bgColor }) => (
                    <button
                      key={role}
                      onClick={() => {
                        handleDemoLogin(role)
                        setShowDemo(false)
                      }}
                      disabled={isLoading}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors disabled:opacity-50"
                    >
                      <div className={`w-8 h-8 rounded-lg ${bgColor} flex items-center justify-center`}>
                        <Icon size={16} className={color} />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-[var(--color-text)]">
                          {t(`role.${role}`)}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthLayout>
  )
}
