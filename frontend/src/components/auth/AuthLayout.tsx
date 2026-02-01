import { ReactNode, useState, useRef, useEffect } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { Moon, Sun, Globe, ChevronDown, Check, X, Clock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import CleaningAnimation from './CleaningAnimation'

interface AuthLayoutProps {
  children: ReactNode
}

const LANGUAGES = [
  { code: 'fr', name: 'Français', flag: '🇫🇷', available: true },
  { code: 'en', name: 'English', flag: '🇺🇸', available: false },
  { code: 'ar', name: 'العربية', flag: '🇸🇦', available: false },
]

export default function AuthLayout({ children }: AuthLayoutProps) {
  const { resolvedTheme, setTheme } = useTheme()
  const { t, i18n } = useTranslation()
  const [langDropdownOpen, setLangDropdownOpen] = useState(false)
  const [showLangPhase2Modal, setShowLangPhase2Modal] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }
  
  const changeLanguage = (langCode: string) => {
    i18n.changeLanguage(langCode)
    localStorage.setItem('language', langCode)
    setLangDropdownOpen(false)
  }
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setLangDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  const currentLang = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0]
  
  return (
    <div className="min-h-screen flex" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Left side - Animation (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%]">
        <CleaningAnimation />
      </div>
      
      {/* Right side - Form */}
      <div className="flex-1 flex flex-col min-h-screen bg-[var(--color-bg)]">
        {/* Top bar with theme/language toggles */}
        <div className="flex items-center justify-end gap-2 p-4">
          {/* Language Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
            >
              <Globe size={16} />
              <span>{currentLang.code.toUpperCase()}</span>
              <ChevronDown size={14} className={`transition-transform ${langDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {langDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] shadow-lg shadow-black/10 dark:shadow-black/30 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      if (lang.available) {
                        changeLanguage(lang.code)
                      } else {
                        setLangDropdownOpen(false)
                        setShowLangPhase2Modal(true)
                      }
                    }}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                      lang.available ? 'hover:bg-[var(--color-bg-tertiary)]' : 'opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span className="text-base">{lang.flag}</span>
                      <span className={lang.available ? 'text-[var(--color-text)]' : 'text-gray-400'}>{lang.name}</span>
                    </span>
                    {!lang.available && (
                      <span className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded">
                        Phase 2
                      </span>
                    )}
                    {lang.available && i18n.language === lang.code && (
                      <Check size={16} className="text-primary-500" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
            aria-label="Toggle theme"
          >
            {resolvedTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        {/* Phase 2 Language Modal */}
        {showLangPhase2Modal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowLangPhase2Modal(false)}>
            <div className="relative mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-800" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setShowLangPhase2Modal(false)}
                className="absolute right-4 top-4 rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              >
                <X size={20} />
              </button>
              <div className="mb-4 flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600">
                  <Globe size={32} className="text-white" />
                </div>
              </div>
              <h2 className="mb-2 text-center text-xl font-semibold text-gray-900 dark:text-white">
                {t('wip.title', 'Coming Soon!')}
              </h2>
              <p className="mb-4 text-center text-lg font-medium text-blue-600 dark:text-blue-400">
                {t('language.multiLanguage', 'Multi-language Support')}
              </p>
              <p className="mb-6 text-center text-sm text-gray-600 dark:text-gray-400">
                {t('language.phase2Message', 'English and Arabic translations are coming in Phase 2. The application is currently available in French only.')}
              </p>
              <div className="mb-6 flex items-center justify-center gap-2">
                <Clock size={16} className="text-gray-400" />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {t('wip.phase', 'Planned for Phase {{phase}}', { phase: 2 })}
                </span>
              </div>
              <button
                onClick={() => setShowLangPhase2Modal(false)}
                className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                {t('wip.gotIt', 'Got it!')}
              </button>
            </div>
          </div>
        )}
        
        {/* Form content */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-md">
            {/* Logo and brand */}
            <div className="flex flex-col items-center mb-8">
              <div className="w-12 h-12 rounded-xl bg-primary-600 flex items-center justify-center mb-4 shadow-lg shadow-primary-500/20">
                <svg
                  viewBox="0 0 24 24"
                  className="w-7 h-7 text-white"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 6h18" />
                  <path d="M7 12h10" />
                  <path d="M10 18h4" />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-[var(--color-text)]">
                Nettoyage Plus
              </h1>
            </div>
            
            {children}
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 text-center">
          <p className="text-xs text-[var(--color-text-muted)]">
            © {new Date().getFullYear()} Nettoyage Plus. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}
