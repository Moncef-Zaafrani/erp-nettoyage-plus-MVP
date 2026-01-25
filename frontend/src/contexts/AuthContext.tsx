import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authApi, setToken, getToken, clearAuth, setStoredUser, getStoredUser, ApiError } from '@/services/api'

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'SUPERVISOR' | 'AGENT' | 'CLIENT'

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  status?: string
  phone?: string
  createdAt?: string
  lastLoginAt?: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>
  loginAsRole: (role: UserRole) => Promise<void>
  logout: () => void
  forgotPassword: (email: string) => Promise<{ message: string }>
  resetPassword: (token: string, newPassword: string) => Promise<{ message: string }>
  error: string | null
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Demo credentials for quick login (uses real backend)
const DEMO_CREDENTIALS: Record<UserRole, { email: string; password: string }> = {
  SUPER_ADMIN: { email: 'superadmin@nettoyageplus.com', password: 'Demo123!' },
  ADMIN: { email: 'admin@nettoyageplus.com', password: 'Demo123!' },
  SUPERVISOR: { email: 'supervisor@nettoyageplus.com', password: 'Demo123!' },
  AGENT: { email: 'agent@nettoyageplus.com', password: 'Demo123!' },
  CLIENT: { email: 'client@nettoyageplus.com', password: 'Demo123!' },
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Check for existing session on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = getToken()
      const storedUser = getStoredUser<User>()
      
      if (token && storedUser) {
        // Validate token with backend
        try {
          const freshUser = await authApi.getMe()
          setUser(freshUser as User)
          setStoredUser(freshUser)
        } catch {
          // Token invalid or expired - clear session
          clearAuth()
        }
      }
      
      setIsLoading(false)
    }
    
    initAuth()
  }, [])
  
  /**
   * Login with email and password
   * Connects to real backend API
   */
  const login = async (email: string, password: string, rememberMe = false) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await authApi.login({ email, password })
      
      // Store token and user
      setToken(response.accessToken)
      setStoredUser(response.user)
      setUser(response.user as User)
      
      // Handle remember me (token expiry is handled by backend JWT config)
      if (!rememberMe) {
        // For non-remembered sessions, we could use sessionStorage instead
        // but for simplicity, we keep using localStorage
      }
    } catch (err) {
      const message = err instanceof ApiError 
        ? err.message 
        : 'Unable to connect to server. Please try again.'
      setError(message)
      throw new Error(message)
    } finally {
      setIsLoading(false)
    }
  }
  
  /**
   * Quick demo login - uses real backend with pre-configured demo accounts
   */
  const loginAsRole = async (role: UserRole) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const credentials = DEMO_CREDENTIALS[role]
      const response = await authApi.login(credentials)
      
      // Store token and user
      setToken(response.accessToken)
      setStoredUser(response.user)
      setUser(response.user as User)
    } catch (err) {
      const message = err instanceof ApiError 
        ? err.message 
        : 'Demo login failed. Please try again.'
      setError(message)
      throw new Error(message)
    } finally {
      setIsLoading(false)
    }
  }
  
  /**
   * Logout - clear all auth state
   */
  const logout = () => {
    clearAuth()
    setUser(null)
    setError(null)
  }
  
  /**
   * Request password reset email
   */
  const forgotPassword = async (email: string): Promise<{ message: string }> => {
    try {
      return await authApi.forgotPassword({ email })
    } catch (err) {
      const message = err instanceof ApiError 
        ? err.message 
        : 'Unable to send reset email. Please try again.'
      throw new Error(message)
    }
  }
  
  /**
   * Reset password with token from email
   */
  const resetPassword = async (token: string, newPassword: string): Promise<{ message: string }> => {
    try {
      return await authApi.resetPassword({ token, newPassword })
    } catch (err) {
      const message = err instanceof ApiError 
        ? err.message 
        : 'Unable to reset password. Please try again.'
      throw new Error(message)
    }
  }
  
  const clearError = () => setError(null)
  
  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      loginAsRole,
      logout,
      forgotPassword,
      resetPassword,
      error,
      clearError,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
