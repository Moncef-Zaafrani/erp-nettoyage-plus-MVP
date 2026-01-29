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
import { useAuth, UserRole } from './contexts/AuthContext'

// Role groups for access control
const ADMIN_ROLES: UserRole[] = ['SUPER_ADMIN', 'ADMIN']
const STAFF_ROLES: UserRole[] = ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR']
const ALL_INTERNAL_ROLES: UserRole[] = ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'AGENT']

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

// Role-based route protection
function RoleRoute({ 
  children, 
  allowedRoles 
}: { 
  children: React.ReactNode
  allowedRoles: UserRole[]
}) {
  const { user, isLoading } = useAuth()
  
  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent" />
      </div>
    )
  }
  
  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
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
        <Route path="/reports" element={<RoleRoute allowedRoles={STAFF_ROLES}><ReportsPage /></RoleRoute>} />
        
        {/* Users Management - Admin only */}
        <Route path="/users" element={<RoleRoute allowedRoles={ADMIN_ROLES}><UsersPage /></RoleRoute>} />
        <Route path="/users/new" element={<RoleRoute allowedRoles={ADMIN_ROLES}><UserFormPage /></RoleRoute>} />
        <Route path="/users/:id/edit" element={<RoleRoute allowedRoles={ADMIN_ROLES}><UserFormPage /></RoleRoute>} />
        <Route path="/users/:roleFilter" element={<RoleRoute allowedRoles={ADMIN_ROLES}><UsersPage /></RoleRoute>} />
        <Route path="/users/view/:id" element={<RoleRoute allowedRoles={ADMIN_ROLES}><UserDetailsPage /></RoleRoute>} />
        
        {/* Clients Management - Admin only */}
        <Route path="/clients" element={<RoleRoute allowedRoles={ADMIN_ROLES}><ClientsPage /></RoleRoute>} />
        <Route path="/clients/new" element={<RoleRoute allowedRoles={ADMIN_ROLES}><ClientFormPage /></RoleRoute>} />
        <Route path="/clients/:id/edit" element={<RoleRoute allowedRoles={ADMIN_ROLES}><ClientFormPage /></RoleRoute>} />
        <Route path="/clients/:typeFilter" element={<RoleRoute allowedRoles={ADMIN_ROLES}><ClientsPage /></RoleRoute>} />
        <Route path="/clients/view/:id" element={<RoleRoute allowedRoles={ADMIN_ROLES}><ClientDetailsPage /></RoleRoute>} />
        
        {/* Sites Management - Staff */}
        <Route path="/sites" element={<RoleRoute allowedRoles={STAFF_ROLES}><SitesPage /></RoleRoute>} />
        <Route path="/sites/new" element={<RoleRoute allowedRoles={ADMIN_ROLES}><SiteFormPage /></RoleRoute>} />
        <Route path="/sites/:id/edit" element={<RoleRoute allowedRoles={ADMIN_ROLES}><SiteFormPage /></RoleRoute>} />
        <Route path="/sites/view/:id" element={<RoleRoute allowedRoles={STAFF_ROLES}><SiteDetailsPage /></RoleRoute>} />
        
        {/* Contracts Management - Admin only */}
        <Route path="/contracts" element={<RoleRoute allowedRoles={ADMIN_ROLES}><ContractsPage /></RoleRoute>} />
        <Route path="/contracts/new" element={<RoleRoute allowedRoles={ADMIN_ROLES}><ContractFormPage /></RoleRoute>} />
        <Route path="/contracts/:id/edit" element={<RoleRoute allowedRoles={ADMIN_ROLES}><ContractFormPage /></RoleRoute>} />
        <Route path="/contracts/:typeFilter" element={<RoleRoute allowedRoles={ADMIN_ROLES}><ContractsPage /></RoleRoute>} />
        <Route path="/contracts/view/:id" element={<RoleRoute allowedRoles={ADMIN_ROLES}><ContractDetailsPage /></RoleRoute>} />
        
        {/* Interventions / Planning - Staff can view, Admin can edit */}
        <Route path="/interventions" element={<RoleRoute allowedRoles={STAFF_ROLES}><InterventionsPage /></RoleRoute>} />
        <Route path="/interventions/new" element={<RoleRoute allowedRoles={ADMIN_ROLES}><InterventionFormPage /></RoleRoute>} />
        <Route path="/interventions/:id/edit" element={<RoleRoute allowedRoles={ADMIN_ROLES}><InterventionFormPage /></RoleRoute>} />
        <Route path="/interventions/view/:id" element={<RoleRoute allowedRoles={STAFF_ROLES}><InterventionDetailsPage /></RoleRoute>} />
        <Route path="/planning" element={<RoleRoute allowedRoles={STAFF_ROLES}><InterventionsPage /></RoleRoute>} />
        
        {/* Agent Routes - My Missions (Agent and above) */}
        <Route path="/my-missions" element={<RoleRoute allowedRoles={ALL_INTERNAL_ROLES}><MyMissionsPage /></RoleRoute>} />
        <Route path="/my-missions/:id" element={<RoleRoute allowedRoles={ALL_INTERNAL_ROLES}><MissionDetailPage /></RoleRoute>} />
        <Route path="/absence-request" element={<RoleRoute allowedRoles={ALL_INTERNAL_ROLES}><AbsenceRequestPage /></RoleRoute>} />
        
        {/* Personnel / HR Routes - Admin only */}
        <Route path="/personnel/absences" element={<RoleRoute allowedRoles={ADMIN_ROLES}><AbsencesPage /></RoleRoute>} />
        <Route path="/personnel/absences/new" element={<RoleRoute allowedRoles={ADMIN_ROLES}><AbsenceRequestPage /></RoleRoute>} />
        <Route path="/personnel/absences/:id" element={<RoleRoute allowedRoles={ADMIN_ROLES}><AbsenceRequestPage /></RoleRoute>} />
        
        {/* Supervisor Routes */}
        <Route path="/my-agents" element={<RoleRoute allowedRoles={STAFF_ROLES}><UsersPage /></RoleRoute>} />
        
        {/* Placeholder routes - will be implemented in future phases */}
        <Route path="/personnel" element={<RoleRoute allowedRoles={ADMIN_ROLES}><ComingSoonPage title="Personnel" /></RoleRoute>} />
        <Route path="/notifications" element={<ComingSoonPage title="Notifications" />} />
        <Route path="/my-schedule" element={<RoleRoute allowedRoles={ALL_INTERNAL_ROLES}><ComingSoonPage title="My Schedule" /></RoleRoute>} />
        <Route path="/my-contracts" element={<RoleRoute allowedRoles={['CLIENT']}><ComingSoonPage title="My Contracts" /></RoleRoute>} />
        <Route path="/my-sites" element={<RoleRoute allowedRoles={['CLIENT']}><ComingSoonPage title="My Sites" /></RoleRoute>} />
        <Route path="/audit" element={<RoleRoute allowedRoles={ADMIN_ROLES}><ComingSoonPage title="Audit Logs" /></RoleRoute>} />
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
