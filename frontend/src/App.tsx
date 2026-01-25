import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/auth/LoginPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import DashboardPage from './pages/DashboardPage'
import { MainLayout } from './components/layout/MainLayout'
import { useAuth } from './contexts/AuthContext'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent" />
      </div>
    )
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent" />
      </div>
    )
  }
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }
  
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
      <Route path="/reset-password" element={<PublicRoute><ResetPasswordPage /></PublicRoute>} />
      
      {/* Protected Routes with MainLayout */}
      <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<DashboardPage />} />
        
        {/* Placeholder routes - will be implemented in future phases */}
        <Route path="/users/*" element={<ComingSoonPage title="User Management" />} />
        <Route path="/clients" element={<ComingSoonPage title="Clients" />} />
        <Route path="/contracts" element={<ComingSoonPage title="Contracts" />} />
        <Route path="/sites" element={<ComingSoonPage title="Sites" />} />
        <Route path="/planning" element={<ComingSoonPage title="Planning" />} />
        <Route path="/personnel" element={<ComingSoonPage title="Personnel" />} />
        <Route path="/notifications" element={<ComingSoonPage title="Notifications" />} />
        <Route path="/settings" element={<ComingSoonPage title="Settings" />} />
        <Route path="/profile" element={<ComingSoonPage title="My Profile" />} />
        <Route path="/my-agents" element={<ComingSoonPage title="Your Agents" />} />
        <Route path="/my-missions" element={<ComingSoonPage title="My Missions" />} />
        <Route path="/my-schedule" element={<ComingSoonPage title="My Schedule" />} />
        <Route path="/my-contracts" element={<ComingSoonPage title="My Contracts" />} />
        <Route path="/my-sites" element={<ComingSoonPage title="My Sites" />} />
        <Route path="/audit" element={<ComingSoonPage title="Audit Logs" />} />
      </Route>
      
      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

// Simple placeholder for routes that aren't implemented yet
function ComingSoonPage({ title }: { title: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
      <p className="mt-2 text-gray-600 dark:text-gray-400">This page is coming soon.</p>
    </div>
  )
}
