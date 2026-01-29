import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/auth/LoginPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import DashboardPage from './pages/DashboardPage'
import ProfilePage from './pages/ProfilePage'
import SettingsPage from './pages/SettingsPage'
import ReportsPage from './pages/ReportsPage'
import UsersPage from './pages/users/UsersPage'
import UserDetailsPage from './pages/users/UserDetailsPage'
import UserFormPage from './pages/users/UserFormPage'
import ClientsPage from './pages/clients/ClientsPage'
import ClientDetailsPage from './pages/clients/ClientDetailsPage'
import ClientFormPage from './pages/clients/ClientFormPage'
import SitesPage from './pages/sites/SitesPage'
import SiteDetailsPage from './pages/sites/SiteDetailsPage'
import SiteFormPage from './pages/sites/SiteFormPage'
import ContractsPage from './pages/contracts/ContractsPage'
import ContractDetailsPage from './pages/contracts/ContractDetailsPage'
import ContractFormPage from './pages/contracts/ContractFormPage'
import { InterventionsPage, InterventionFormPage, InterventionDetailsPage } from './pages/interventions'
// Agent pages
import MyMissionsPage from './pages/agent/MyMissionsPage'
import MissionDetailPage from './pages/agent/MissionDetailPage'
import AbsenceRequestPage from './pages/agent/AbsenceRequestPage'
// Personnel/HR pages
import AbsencesPage from './pages/personnel/AbsencesPage'
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
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        
        {/* Users Management */}
        <Route path="/users" element={<UsersPage />} />
        <Route path="/users/new" element={<UserFormPage />} />
        <Route path="/users/:id/edit" element={<UserFormPage />} />
        <Route path="/users/:roleFilter" element={<UsersPage />} />
        <Route path="/users/view/:id" element={<UserDetailsPage />} />
        
        {/* Clients Management */}
        <Route path="/clients" element={<ClientsPage />} />
        <Route path="/clients/new" element={<ClientFormPage />} />
        <Route path="/clients/:id/edit" element={<ClientFormPage />} />
        <Route path="/clients/:typeFilter" element={<ClientsPage />} />
        <Route path="/clients/view/:id" element={<ClientDetailsPage />} />
        
        {/* Sites Management */}
        <Route path="/sites" element={<SitesPage />} />
        <Route path="/sites/new" element={<SiteFormPage />} />
        <Route path="/sites/:id/edit" element={<SiteFormPage />} />
        <Route path="/sites/view/:id" element={<SiteDetailsPage />} />
        
        {/* Contracts Management */}
        <Route path="/contracts" element={<ContractsPage />} />
        <Route path="/contracts/new" element={<ContractFormPage />} />
        <Route path="/contracts/:id/edit" element={<ContractFormPage />} />
        <Route path="/contracts/:typeFilter" element={<ContractsPage />} />
        <Route path="/contracts/view/:id" element={<ContractDetailsPage />} />
        
        {/* Interventions / Planning */}
        <Route path="/interventions" element={<InterventionsPage />} />
        <Route path="/interventions/new" element={<InterventionFormPage />} />
        <Route path="/interventions/:id/edit" element={<InterventionFormPage />} />
        <Route path="/interventions/view/:id" element={<InterventionDetailsPage />} />
        <Route path="/planning" element={<InterventionsPage />} />
        
        {/* Agent Routes - My Missions */}
        <Route path="/my-missions" element={<MyMissionsPage />} />
        <Route path="/my-missions/:id" element={<MissionDetailPage />} />
        <Route path="/absence-request" element={<AbsenceRequestPage />} />
        
        {/* Personnel / HR Routes */}
        <Route path="/personnel/absences" element={<AbsencesPage />} />
        <Route path="/personnel/absences/new" element={<AbsenceRequestPage />} />
        <Route path="/personnel/absences/:id" element={<AbsenceRequestPage />} />
        
        {/* Placeholder routes - will be implemented in future phases */}
        <Route path="/personnel" element={<ComingSoonPage title="Personnel" />} />
        <Route path="/notifications" element={<ComingSoonPage title="Notifications" />} />
        <Route path="/my-agents" element={<ComingSoonPage title="Your Agents" />} />
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
