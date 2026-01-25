import { ReactNode, useState, useRef, useEffect } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { Moon, Sun, Globe, ChevronDown, Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import CleaningAnimation from './CleaningAnimation'

interface AuthLayoutProps {
  children: ReactNode
}

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
]

export default function AuthLayout({ children }: AuthLayoutProps) {
  const { resolvedTheme, setTheme } = useTheme()
  const { i18n } = useTranslation()
  const [langDropdownOpen, setLangDropdownOpen] = useState(false)
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
                    onClick={() => changeLanguage(lang.code)}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-[var(--color-bg-tertiary)] transition-colors"
                  >
                    <span className="flex items-center gap-3">
                      <span className="text-base">{lang.flag}</span>
                      <span className="text-[var(--color-text)]">{lang.name}</span>
                    </span>
                    {i18n.language === lang.code && (
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
