import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import clsx from 'clsx'

interface PasswordStrengthProps {
  password: string
}

export function calculatePasswordStrength(password: string): number {
  let score = 0
  
  if (password.length >= 8) score += 1
  if (password.length >= 12) score += 1
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1
  if (/\d/.test(password)) score += 1
  if (/[^a-zA-Z0-9]/.test(password)) score += 1
  
  return Math.min(score, 4)
}

export function generateStrongPassword(): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const numbers = '0123456789'
  const symbols = '!@#$%^&*()_+-='
  const all = lowercase + uppercase + numbers + symbols
  
  let password = ''
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += symbols[Math.floor(Math.random() * symbols.length)]
  
  for (let i = 0; i < 12; i++) {
    password += all[Math.floor(Math.random() * all.length)]
  }
  
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

export default function PasswordStrength({ password }: PasswordStrengthProps) {
  const { t } = useTranslation()
  
  const strength = useMemo(() => calculatePasswordStrength(password), [password])
  
  const labels = [
    '',
    t('auth.passwordStrength.weak'),
    t('auth.passwordStrength.fair'),
    t('auth.passwordStrength.good'),
    t('auth.passwordStrength.strong'),
  ]
  
  const colors = [
    'bg-[var(--color-border)]',
    'bg-red-500',
    'bg-yellow-500',
    'bg-lime-500',
    'bg-green-500',
  ]
  
  if (!password) return null
  
  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={clsx(
              'h-1.5 flex-1 rounded-full transition-all duration-300',
              strength >= level ? colors[strength] : 'bg-[var(--color-border)]'
            )}
          />
        ))}
      </div>
      {strength > 0 && (
        <p className={clsx(
          'text-xs font-medium',
          strength === 1 && 'text-red-500',
          strength === 2 && 'text-yellow-500',
          strength === 3 && 'text-lime-600 dark:text-lime-400',
          strength === 4 && 'text-green-600 dark:text-green-400'
        )}>
          {labels[strength]}
        </p>
      )}
    </div>
  )
}
