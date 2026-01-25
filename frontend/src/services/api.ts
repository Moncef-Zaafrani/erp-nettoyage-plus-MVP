/**
 * API Service - Centralized HTTP client for backend communication
 * Handles authentication, token management, and request/response interceptors
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

// Storage keys
const TOKEN_KEY = 'auth_token'
const USER_KEY = 'auth_user'

/**
 * Get stored auth token
 */
export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY)
}

/**
 * Set auth token
 */
export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token)
}

/**
 * Clear auth data
 */
export const clearAuth = (): void => {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

/**
 * Get stored user
 */
export const getStoredUser = <T>(): T | null => {
  const stored = localStorage.getItem(USER_KEY)
  if (stored) {
    try {
      return JSON.parse(stored) as T
    } catch {
      return null
    }
  }
  return null
}

/**
 * Set stored user
 */
export const setStoredUser = <T>(user: T): void => {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

/**
 * API Error class for consistent error handling
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Make authenticated API request
 */
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken()
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  }
  
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
  }
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  })
  
  // Handle non-JSON responses
  const contentType = response.headers.get('content-type')
  const isJson = contentType?.includes('application/json')
  
  if (!response.ok) {
    const errorData = isJson ? await response.json() : { message: response.statusText }
    throw new ApiError(
      response.status,
      errorData.message || 'An error occurred',
      errorData
    )
  }
  
  // Return empty object for 204 No Content
  if (response.status === 204) {
    return {} as T
  }
  
  return isJson ? response.json() : ({} as T)
}

// ============================================
// Auth API Endpoints
// ============================================

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  user: {
    id: string
    email: string
    firstName: string
    lastName: string
    role: string
    status: string
    phone?: string
    createdAt: string
    lastLoginAt?: string
  }
  accessToken: string
}

export interface RegisterRequest {
  email: string
  password: string
  firstName?: string
  lastName?: string
  role?: string
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  token: string
  newPassword: string
}

export interface MessageResponse {
  message: string
}

export const authApi = {
  /**
   * Login with email and password
   */
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    return request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  /**
   * Register new account
   */
  register: async (data: RegisterRequest): Promise<LoginResponse> => {
    return request<LoginResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  /**
   * Request password reset
   */
  forgotPassword: async (data: ForgotPasswordRequest): Promise<MessageResponse> => {
    return request<MessageResponse>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  /**
   * Reset password with token
   */
  resetPassword: async (data: ResetPasswordRequest): Promise<MessageResponse> => {
    return request<MessageResponse>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  /**
   * Get current authenticated user
   */
  getMe: async (): Promise<LoginResponse['user']> => {
    return request<LoginResponse['user']>('/auth/me')
  },
}

// ============================================
// Notifications API Endpoints
// ============================================

export interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message?: string
  read: boolean
  actionUrl?: string
  createdAt: string
}

export const notificationsApi = {
  /**
   * Get all notifications
   */
  getAll: async (): Promise<Notification[]> => {
    return request<Notification[]>('/notifications')
  },

  /**
   * Get recent notifications
   */
  getRecent: async (limit = 20): Promise<Notification[]> => {
    return request<Notification[]>(`/notifications/recent?limit=${limit}`)
  },

  /**
   * Get unread count
   */
  getUnreadCount: async (): Promise<{ count: number }> => {
    return request<{ count: number }>('/notifications/unread-count')
  },

  /**
   * Mark notification as read
   */
  markAsRead: async (id: string): Promise<Notification> => {
    return request<Notification>(`/notifications/${id}/read`, {
      method: 'PATCH',
    })
  },

  /**
   * Mark many notifications as read
   */
  markManyAsRead: async (ids?: string[]): Promise<{ success: boolean }> => {
    return request<{ success: boolean }>('/notifications/mark-read', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    })
  },

  /**
   * Delete notification
   */
  delete: async (id: string): Promise<{ success: boolean }> => {
    return request<{ success: boolean }>(`/notifications/${id}`, {
      method: 'DELETE',
    })
  },

  /**
   * Delete all notifications
   */
  deleteAll: async (): Promise<{ success: boolean }> => {
    return request<{ success: boolean }>('/notifications', {
      method: 'DELETE',
    })
  },
}

// ============================================
// Attendance API Endpoints
// ============================================

export interface Attendance {
  id: string
  userId: string
  clockIn: string
  clockOut?: string
  hoursWorked?: number
  notes?: string
  createdAt: string
}

export interface ShiftStatus {
  isOnShift: boolean
  currentShift: Attendance | null
}

export interface ClockInOutRequest {
  notes?: string
  latitude?: number
  longitude?: number
}

export const attendanceApi = {
  /**
   * Get shift status
   */
  getStatus: async (): Promise<ShiftStatus> => {
    return request<ShiftStatus>('/attendance/status')
  },

  /**
   * Clock in
   */
  clockIn: async (data: ClockInOutRequest = {}): Promise<Attendance> => {
    return request<Attendance>('/attendance/clock-in', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  /**
   * Clock out
   */
  clockOut: async (data: ClockInOutRequest = {}): Promise<Attendance> => {
    return request<Attendance>('/attendance/clock-out', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  /**
   * Get today's attendance
   */
  getToday: async (): Promise<Attendance[]> => {
    return request<Attendance[]>('/attendance/today')
  },

  /**
   * Get attendance history
   */
  getHistory: async (startDate?: string, endDate?: string): Promise<Attendance[]> => {
    const params = new URLSearchParams()
    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)
    const query = params.toString()
    return request<Attendance[]>(`/attendance/history${query ? `?${query}` : ''}`)
  },

  /**
   * Get weekly hours
   */
  getWeeklyHours: async (): Promise<{ hours: number }> => {
    return request<{ hours: number }>('/attendance/weekly-hours')
  },
}

export default {
  auth: authApi,
  notifications: notificationsApi,
  attendance: attendanceApi,
  getToken,
  setToken,
  clearAuth,
  getStoredUser,
  setStoredUser,
}
