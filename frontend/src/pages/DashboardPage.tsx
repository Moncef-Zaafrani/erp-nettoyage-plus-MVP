import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { LogOut, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui'

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const { resolvedTheme, setTheme } = useTheme()
  
  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }
  
  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      SUPER_ADMIN: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      ADMIN: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      SUPERVISOR: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
      AGENT: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      CLIENT: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    }
    return colors[role] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
  }
  
  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* Header */}
      <header className="border-b border-[var(--color-border)] bg-[var(--color-bg)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
                <svg
                  viewBox="0 0 24 24"
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M3 6h18" />
                  <path d="M7 12h10" />
                  <path d="M10 18h4" />
                </svg>
              </div>
              <span className="font-semibold text-[var(--color-text)]">Nettoyage Plus</span>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
              >
                {resolvedTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut size={16} className="mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border)] p-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 mb-4">
              <svg
                viewBox="0 0 24 24"
                className="w-8 h-8 text-primary-600 dark:text-primary-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            
            <h1 className="text-2xl font-semibold text-[var(--color-text)] mb-2">
              Welcome, {user?.firstName} {user?.lastName}!
            </h1>
            
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user?.role || '')}`}>
                {user?.role?.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            
            <p className="text-[var(--color-text-secondary)] max-w-md mx-auto">
              You have successfully logged in. This is a placeholder dashboard page. 
              The full dashboard with KPIs, activity feed, and quick actions will be implemented next.
            </p>
            
            <div className="mt-8 p-4 bg-[var(--color-bg)] rounded-lg border border-[var(--color-border)]">
              <p className="text-sm text-[var(--color-text-muted)]">
                Logged in as: <span className="text-[var(--color-text)]">{user?.email}</span>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
