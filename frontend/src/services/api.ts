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

// ============================================
// Profile Types
// ============================================

export interface EmergencyContact {
  name: string
  relationship: 'spouse' | 'parent' | 'sibling' | 'friend' | 'other'
  phone: string
  secondaryPhone?: string
  notes?: string
}

export interface Certification {
  id: string
  name: string
  issuingAuthority: string
  issueDate: string
  expiryDate?: string
  documentUrl?: string
  status: 'valid' | 'expiring_soon' | 'expired'
}

export interface LanguageSkill {
  language: string
  proficiency: 'basic' | 'intermediate' | 'fluent' | 'native'
}

export interface EquipmentCompetency {
  equipment: string
  certified: boolean
  certifiedDate?: string
}

export interface WorkPreferences {
  preferredHours?: { start: string; end: string }
  daysAvailable?: string[]
  maxTravelDistanceKm?: number
  preferredZones?: string[]
  preferredSiteTypes?: string[]
  sitesToAvoid?: { siteId: string; reason: string }[]
  preferRecurring?: boolean
}

export interface ProfileCompletion {
  hasPhoto: boolean
  hasPhone: boolean
  hasEmergencyContact: boolean
  hasCertifications: boolean
  percentage: number
}

export interface UserProfile {
  id: string
  email: string
  firstName?: string
  lastName?: string
  displayName?: string
  phone?: string
  secondaryPhone?: string
  role: string
  status: string
  profilePhotoUrl?: string
  personalEmail?: string
  dateOfBirth?: string
  nationalId?: string
  address?: string
  city?: string
  region?: string
  emergencyContact?: EmergencyContact
  employeeId?: string
  hireDate?: string
  contractType?: 'CDI' | 'CDD' | 'FREELANCE'
  certifications: Certification[]
  languages: LanguageSkill[]
  equipmentCompetencies: EquipmentCompetency[]
  specialSkills?: string[]
  workPreferences?: WorkPreferences
  createdAt: string
  updatedAt: string
}

export interface UpdateProfileRequest {
  firstName?: string
  lastName?: string
  displayName?: string
  phone?: string
  secondaryPhone?: string
  personalEmail?: string
  dateOfBirth?: string
  nationalId?: string
  address?: string
  city?: string
  region?: string
  emergencyContact?: EmergencyContact
  certifications?: Certification[]
  languages?: LanguageSkill[]
  equipmentCompetencies?: EquipmentCompetency[]
  specialSkills?: string[]
  workPreferences?: WorkPreferences
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export const profileApi = {
  /**
   * Get current user's profile
   */
  getProfile: async (): Promise<{ profile: UserProfile; completion: ProfileCompletion }> => {
    return request<{ profile: UserProfile; completion: ProfileCompletion }>('/me/profile')
  },

  /**
   * Update profile
   */
  updateProfile: async (data: UpdateProfileRequest): Promise<{ profile: UserProfile; completion: ProfileCompletion }> => {
    return request<{ profile: UserProfile; completion: ProfileCompletion }>('/me/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  /**
   * Update profile photo
   */
  updatePhoto: async (photoUrl: string): Promise<UserProfile> => {
    return request<UserProfile>('/me/profile/photo', {
      method: 'PATCH',
      body: JSON.stringify({ profilePhotoUrl: photoUrl }),
    })
  },

  /**
   * Remove profile photo
   */
  removePhoto: async (): Promise<UserProfile> => {
    return request<UserProfile>('/me/profile/photo', {
      method: 'DELETE',
    })
  },

  /**
   * Change password
   */
  changePassword: async (data: ChangePasswordRequest): Promise<MessageResponse> => {
    return request<MessageResponse>('/me/profile/password', {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },
}

// ============================================
// Settings Types
// ============================================

export type ThemeType =
  | 'system'
  | 'light'
  | 'dark'
  | 'ocean-blue'
  | 'forest-green'
  | 'sunset-orange'
  | 'high-contrast'
  | 'minimal-gray'
  | 'nettoyage-brand'

export interface AppearanceSettings {
  theme: ThemeType
  sidebarCollapsed: boolean
  sidebarPosition: 'left' | 'right'
  animationsEnabled: boolean
  fontSize: 'small' | 'medium' | 'large'
  compactMode: boolean
}

export interface NotificationSettings {
  inAppEnabled: boolean
  soundEnabled: boolean
  desktopEnabled: boolean
  emailDigest: 'instant' | 'daily' | 'weekly' | 'none'
  emailCategories: {
    newMissions: boolean
    missionChanges: boolean
    scheduleReminders: boolean
    qualityResults: boolean
    absenceUpdates: boolean
    systemAnnouncements: boolean
    weeklyPerformance: boolean
  }
  pushEnabled: boolean
  quietHours: {
    enabled: boolean
    start: string
    end: string
  }
}

export interface TableSettings {
  defaultRowsPerPage: 10 | 25 | 50 | 100
  compactRows: boolean
  showRowNumbers: boolean
  stickyHeader: boolean
  columnPreferences: Record<string, string[]>
  sortPreferences: Record<string, { field: string; direction: 'asc' | 'desc' }>
}

export interface CalendarSettings {
  defaultView: 'day' | 'week' | 'month'
  weekStartsOn: 'sunday' | 'monday'
  showWeekends: boolean
  timeFormat: '12h' | '24h'
  showCompleted: boolean
}

export interface UserSettings {
  id: string
  userId: string
  appearance: AppearanceSettings
  notifications: NotificationSettings
  tables: TableSettings
  calendar: CalendarSettings
  map: {
    defaultView: 'satellite' | 'street' | 'hybrid'
    showAgentLocations: boolean
    showTraffic: boolean
    clusterSites: boolean
  }
  gps: {
    enabled: boolean
    accuracy: 'high' | 'balanced' | 'low'
  }
  photo: {
    defaultCamera: 'front' | 'back'
    quality: 'low' | 'medium' | 'high' | 'original'
    autoCompress: boolean
    timestampOverlay: boolean
    locationOverlay: boolean
  }
  offline: {
    enabled: boolean
    autoSync: boolean
    maxStorageMb: 50 | 100 | 500
  }
  mission: {
    showNotesFirst: boolean
    expandChecklists: boolean
    defaultSort: 'time' | 'site' | 'priority'
  }
  shift: {
    reminderBefore: number
    missedClockInReminder: number
    endShiftReminder: number
    autoClockOutHours: number
    notifySupervisorAutoClockOut: boolean
    defaultBreakMinutes: number
    breakReminderHours: number
  }
  help: {
    showEmptyStateTips: boolean
    showFeatureTutorials: boolean
  }
}

export interface UserSession {
  id: string
  deviceType?: 'desktop' | 'mobile' | 'tablet'
  browser?: string
  os?: string
  ipAddress?: string
  city?: string
  country?: string
  isActive: boolean
  lastActiveAt?: string
  createdAt: string
  isCurrent?: boolean
}

export const settingsApi = {
  /**
   * Get user settings
   */
  getSettings: async (): Promise<UserSettings> => {
    return request<UserSettings>('/me/settings')
  },

  /**
   * Update settings (deep merge)
   */
  updateSettings: async (data: Partial<UserSettings>): Promise<UserSettings> => {
    return request<UserSettings>('/me/settings', {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  /**
   * Update theme only
   */
  updateTheme: async (theme: ThemeType): Promise<UserSettings> => {
    return request<UserSettings>('/me/settings/theme', {
      method: 'PATCH',
      body: JSON.stringify({ theme }),
    })
  },

  /**
   * Reset settings to defaults
   */
  resetSettings: async (): Promise<UserSettings> => {
    return request<UserSettings>('/me/settings/reset', {
      method: 'POST',
    })
  },

  /**
   * Get active sessions
   */
  getSessions: async (): Promise<UserSession[]> => {
    return request<UserSession[]>('/me/settings/sessions')
  },

  /**
   * Revoke a specific session
   */
  revokeSession: async (sessionId: string): Promise<MessageResponse> => {
    return request<MessageResponse>(`/me/settings/sessions/${sessionId}`, {
      method: 'DELETE',
    })
  },

  /**
   * Revoke all other sessions
   */
  revokeOtherSessions: async (): Promise<MessageResponse> => {
    return request<MessageResponse>('/me/settings/sessions/revoke-others', {
      method: 'POST',
    })
  },

  /**
   * Revoke all sessions
   */
  revokeAllSessions: async (): Promise<MessageResponse> => {
    return request<MessageResponse>('/me/settings/sessions/revoke-all', {
      method: 'POST',
    })
  },
}

export default {
  auth: authApi,
  notifications: notificationsApi,
  attendance: attendanceApi,
  profile: profileApi,
  settings: settingsApi,
  getToken,
  setToken,
  clearAuth,
  getStoredUser,
  setStoredUser,
}
