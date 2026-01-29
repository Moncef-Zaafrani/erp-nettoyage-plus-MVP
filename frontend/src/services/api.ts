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

export type ShiftStatusType = 'active' | 'paused' | 'completed'

export interface ShiftBreak {
  id: string
  attendanceId: string
  breakStart: string
  breakEnd?: string
  durationMinutes?: number
  breakType: 'manual' | 'idle' | 'system'
  notes?: string
}

export interface Attendance {
  id: string
  userId: string
  clockIn: string
  clockOut?: string
  hoursWorked?: number
  notes?: string
  status?: ShiftStatusType
  lastHeartbeat?: string
  deviceId?: string
  breakMinutes?: number
  breaks?: ShiftBreak[]
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

export interface PauseShiftRequest {
  reason?: 'break' | 'lunch' | 'meeting' | 'personal' | 'other'
  notes?: string
}

export interface ResumeShiftRequest {
  notes?: string
}

export interface HeartbeatRequest {
  deviceId?: string
}

export interface DailySummary {
  date: string
  totalShifts: number
  totalHoursWorked: number
  totalBreakMinutes: number
  netWorkMinutes: number
  shifts: Attendance[]
  currentStatus: ShiftStatusType | 'off'
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

  /**
   * Pause current shift (start a break)
   */
  pauseShift: async (data: PauseShiftRequest = {}): Promise<Attendance> => {
    return request<Attendance>('/attendance/pause', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  /**
   * Resume paused shift (end break)
   */
  resumeShift: async (data: ResumeShiftRequest = {}): Promise<Attendance> => {
    return request<Attendance>('/attendance/resume', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  /**
   * Send heartbeat to indicate user is still active
   */
  heartbeat: async (data: HeartbeatRequest = {}): Promise<{ success: boolean; attendance: Attendance }> => {
    return request<{ success: boolean; attendance: Attendance }>('/attendance/heartbeat', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  /**
   * Get daily summary with all shifts and breaks
   */
  getDailySummary: async (date?: string): Promise<DailySummary> => {
    const params = date ? `?date=${date}` : ''
    return request<DailySummary>(`/attendance/daily-summary${params}`)
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

// ============================================
// Audit Types & API (Super Admin only)
// ============================================

export interface AuditLog {
  id: string
  action: string
  entityType: string
  entityId: string
  actorId: string
  changes?: Record<string, unknown>
  description?: string
  ipAddress?: string
  userAgent?: string
  createdAt: string
  actor?: {
    id: string
    email: string
    firstName: string
    lastName: string
    role: string
  }
}

export const auditApi = {
  /**
   * Get recent audit logs (Super Admin only)
   */
  getRecentLogs: async (limit = 100): Promise<AuditLog[]> => {
    return request<AuditLog[]>(`/audit?limit=${limit}`)
  },

  /**
   * Get audit logs for a specific entity
   */
  getLogsForEntity: async (entityType: string, entityId: string, limit = 50): Promise<AuditLog[]> => {
    return request<AuditLog[]>(`/audit/entity/${entityType}/${entityId}?limit=${limit}`)
  },

  /**
   * Get audit logs by actor (who performed actions)
   */
  getLogsByActor: async (actorId: string, limit = 50): Promise<AuditLog[]> => {
    return request<AuditLog[]>(`/audit/actor/${actorId}?limit=${limit}`)
  },

  /**
   * Get audit logs for a user
   */
  getLogsForUser: async (userId: string, limit = 50): Promise<AuditLog[]> => {
    return request<AuditLog[]>(`/audit/user/${userId}?limit=${limit}`)
  },
}

// ============================================
// Reports API Endpoints
// ============================================

export type ReportCategory = 
  | 'equipment_issue'
  | 'safety_concern'
  | 'schedule_problem'
  | 'site_access'
  | 'client_complaint'
  | 'other'

export type ReportPriority = 'low' | 'medium' | 'high' | 'urgent'

export type ReportStatus = 'open' | 'in_progress' | 'resolved' | 'closed'

export interface Report {
  id: string
  reporterId: string
  assignedToId?: string
  title: string
  category: ReportCategory
  description: string
  priority: ReportPriority
  status: ReportStatus
  screenshotUrl?: string
  resolution?: string
  resolvedAt?: string
  resolvedById?: string
  createdAt: string
  updatedAt: string
  reporter?: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  assignedTo?: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  resolvedBy?: {
    id: string
    firstName: string
    lastName: string
  }
}

export interface CreateReportRequest {
  title: string
  category: ReportCategory
  description: string
  priority?: ReportPriority
  screenshotUrl?: string
}

export interface UpdateReportRequest {
  status?: ReportStatus
  resolution?: string
  assignedToId?: string
}

export interface ResolveReportRequest {
  resolution: string
}

export interface ReportStats {
  total: number
  open: number
  inProgress: number
  resolved: number
  myReports: number
  assignedToMe: number
}

export const reportsApi = {
  /**
   * Create a new report
   */
  create: async (data: CreateReportRequest): Promise<Report> => {
    return request<Report>('/reports', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  /**
   * Get all reports (filtered by user role)
   */
  getAll: async (): Promise<Report[]> => {
    return request<Report[]>('/reports')
  },

  /**
   * Get reports created by the current user
   */
  getMyReports: async (): Promise<Report[]> => {
    return request<Report[]>('/reports/my-reports')
  },

  /**
   * Get reports assigned to the current user
   */
  getAssignedToMe: async (): Promise<Report[]> => {
    return request<Report[]>('/reports/assigned-to-me')
  },

  /**
   * Get report statistics
   */
  getStats: async (): Promise<ReportStats> => {
    return request<ReportStats>('/reports/stats')
  },

  /**
   * Get a single report by ID
   */
  getById: async (id: string): Promise<Report> => {
    return request<Report>(`/reports/${id}`)
  },

  /**
   * Update a report
   */
  update: async (id: string, data: UpdateReportRequest): Promise<Report> => {
    return request<Report>(`/reports/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  /**
   * Resolve a report
   */
  resolve: async (id: string, data: ResolveReportRequest): Promise<Report> => {
    return request<Report>(`/reports/${id}/resolve`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },
}

// ============================================
// Users API Endpoints
// ============================================

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'SUPERVISOR' | 'AGENT' | 'CLIENT'
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'
export type AttendanceStatusType = 'on_shift' | 'on_break' | 'off_shift'
export type ContractType = 'CDI' | 'CDD' | 'FREELANCE'

// JSON types matching backend
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

export interface User {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  displayName: string | null
  role: UserRole
  status: UserStatus
  attendanceStatus: AttendanceStatusType | null
  phone: string | null
  secondaryPhone: string | null
  profilePhotoUrl: string | null
  personalEmail: string | null
  dateOfBirth: string | null
  nationalId: string | null
  address: string | null
  city: string | null
  region: string | null
  emergencyContact: EmergencyContact | null
  employeeId: string | null
  hireDate: string | null
  contractType: ContractType | null
  certifications: Certification[]
  languages: LanguageSkill[]
  equipmentCompetencies: EquipmentCompetency[]
  specialSkills: string[] | null
  emailVerified: boolean
  forcePasswordChange: boolean
  lastPasswordChangeAt: string | null
  supervisorId: string | null
  supervisor?: User | null
  zoneId?: string | null
  zone?: { id: string; zoneName: string } | null
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
}

export interface UsersSearchParams {
  role?: UserRole
  status?: UserStatus
  supervisorId?: string
  zoneId?: string
  search?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
  includeArchived?: boolean
}

export interface PaginatedUsers {
  data: User[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface CreateUserRequest {
  email: string
  password: string
  firstName?: string
  lastName?: string
  displayName?: string
  role: UserRole
  phone?: string
  secondaryPhone?: string
  personalEmail?: string
  address?: string
  city?: string
  region?: string
  employeeId?: string
  hireDate?: string
  contractType?: ContractType
  supervisorId?: string
}

export interface UpdateUserRequest {
  firstName?: string
  lastName?: string
  displayName?: string
  phone?: string
  secondaryPhone?: string
  personalEmail?: string
  address?: string
  city?: string
  region?: string
  employeeId?: string
  hireDate?: string
  contractType?: ContractType
  status?: UserStatus
  role?: UserRole
  supervisorId?: string | null
}

export interface BatchIdsRequest {
  ids: string[]
}

export interface BatchAssignRequest {
  ids: string[]
  supervisorId?: string
  zoneId?: string
}

export const usersApi = {
  /**
   * Get all users with filters
   */
  getAll: async (params: UsersSearchParams = {}): Promise<PaginatedUsers> => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value))
      }
    })
    const query = searchParams.toString()
    return request<PaginatedUsers>(`/users${query ? `?${query}` : ''}`)
  },

  /**
   * Get a single user by ID
   */
  getById: async (id: string): Promise<User> => {
    return request<User>(`/users/${id}`)
  },

  /**
   * Create a new user
   */
  create: async (data: CreateUserRequest): Promise<User> => {
    return request<User>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  /**
   * Update a user
   */
  update: async (id: string, data: UpdateUserRequest): Promise<User> => {
    return request<User>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  /**
   * Soft delete (archive) a user
   */
  archive: async (id: string): Promise<{ success: boolean }> => {
    return request<{ success: boolean }>(`/users/${id}`, {
      method: 'DELETE',
    })
  },

  /**
   * Restore an archived user
   */
  restore: async (id: string): Promise<User> => {
    return request<User>(`/users/${id}/restore`, {
      method: 'POST',
    })
  },

  /**
   * Reset user's password (admin action)
   */
  resetPassword: async (id: string, mode: 'temp' | 'link' = 'temp'): Promise<{ message: string; tempPassword?: string }> => {
    return request<{ message: string; tempPassword?: string }>(`/users/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ mode }),
    })
  },

  /**
   * Batch activate users
   */
  batchActivate: async (ids: string[]): Promise<{ success: boolean; count: number }> => {
    return request<{ success: boolean; count: number }>('/users/batch/activate', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    })
  },

  /**
   * Batch deactivate (archive) users
   */
  batchDeactivate: async (ids: string[]): Promise<{ success: boolean; count: number }> => {
    return request<{ success: boolean; count: number }>('/users/batch/deactivate', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    })
  },

  /**
   * Batch assign supervisor
   */
  batchAssignSupervisor: async (ids: string[], supervisorId: string): Promise<{ success: boolean; count: number }> => {
    return request<{ success: boolean; count: number }>('/users/batch/assign-supervisor', {
      method: 'POST',
      body: JSON.stringify({ ids, supervisorId }),
    })
  },

  /**
   * Batch assign zone
   */
  batchAssignZone: async (ids: string[], zoneId: string): Promise<{ success: boolean; count: number }> => {
    return request<{ success: boolean; count: number }>('/users/batch/assign-zone', {
      method: 'POST',
      body: JSON.stringify({ ids, zoneId }),
    })
  },

  /**
   * Get supervisors (for dropdown)
   */
  getSupervisors: async (): Promise<User[]> => {
    return request<User[]>('/users?role=SUPERVISOR&limit=100').then((res: PaginatedUsers | User[]) => 
      Array.isArray(res) ? res : res.data
    )
  },
}

// ============================================
// Clients API Endpoints
// ============================================

export type ClientType = 'INDIVIDUAL' | 'COMPANY' | 'MULTI_SITE'
export type ClientStatus = 'PROSPECT' | 'CURRENT' | 'ARCHIVED'

export interface Client {
  id: string
  clientCode: string
  name: string
  type: ClientType
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  postalCode: string | null
  country: string | null
  contactPerson: string | null
  contactPhone: string | null
  notes: string | null
  status: ClientStatus
  sitesCount?: number
  activeContractsCount?: number
  createdAt: string
  updatedAt: string
}

export interface ClientsSearchParams {
  type?: ClientType
  status?: ClientStatus
  hasActiveContract?: boolean
  search?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
  includeArchived?: boolean
}

export interface PaginatedClients {
  data: Client[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface CreateClientRequest {
  name: string
  type: ClientType
  email?: string
  phone?: string
  address?: string
  city?: string
  postalCode?: string
  country?: string
  contactPerson?: string
  contactPhone?: string
  notes?: string
}

export interface UpdateClientRequest {
  name?: string
  type?: ClientType
  email?: string
  phone?: string
  address?: string
  city?: string
  postalCode?: string
  country?: string
  contactPerson?: string
  contactPhone?: string
  notes?: string
  status?: ClientStatus
}

export const clientsApi = {
  /**
   * Get all clients with filters
   */
  getAll: async (params: ClientsSearchParams = {}): Promise<PaginatedClients> => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value))
      }
    })
    const query = searchParams.toString()
    return request<PaginatedClients>(`/clients${query ? `?${query}` : ''}`)
  },

  /**
   * Get a single client by ID
   */
  getById: async (id: string): Promise<Client> => {
    return request<Client>(`/clients/${id}`)
  },

  /**
   * Create a new client
   */
  create: async (data: CreateClientRequest): Promise<Client> => {
    return request<Client>('/clients', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  /**
   * Update a client
   */
  update: async (id: string, data: UpdateClientRequest): Promise<Client> => {
    return request<Client>(`/clients/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  /**
   * Soft delete (archive) a client
   */
  archive: async (id: string): Promise<{ success: boolean }> => {
    return request<{ success: boolean }>(`/clients/${id}`, {
      method: 'DELETE',
    })
  },

  /**
   * Restore an archived client
   */
  restore: async (id: string): Promise<Client> => {
    return request<Client>(`/clients/${id}/restore`, {
      method: 'POST',
    })
  },

  /**
   * Batch activate clients (update status to CURRENT via batch update)
   */
  batchActivate: async (ids: string[]): Promise<{ success: boolean; count: number }> => {
    // Use batch update to set status to CURRENT
    const clients = ids.map(id => ({ id, status: 'CURRENT' as const }))
    return request<{ success: boolean; count: number }>('/clients/batch/update', {
      method: 'PATCH',
      body: JSON.stringify({ clients }),
    }).then(() => ({ success: true, count: ids.length }))
  },

  /**
   * Batch archive (soft delete) clients
   */
  batchArchive: async (ids: string[]): Promise<{ success: boolean; count: number }> => {
    return request<{ deleted: string[]; errors: any[] }>('/clients/batch/delete', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    }).then(res => ({ success: true, count: res.deleted?.length || ids.length }))
  },
}

// ============================================
// Contracts API Endpoints
// ============================================

export type ServiceContractType = 'PERMANENT' | 'ONE_TIME'
export type ContractFrequency = 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'CUSTOM'
export type ContractStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'COMPLETED' | 'ARCHIVED'

export interface ContractPricing {
  hourlyRate?: number
  monthlyFee?: number
  perInterventionFee?: number
  currency: string
  billingCycle?: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY'
  paymentTerms?: string
  notes?: string
}

export interface ServiceScope {
  zones: string[]
  tasks: string[]
  schedules?: {
    startTime: string
    endTime: string
    daysOfWeek?: number[]
  }[]
  specialInstructions?: string
  excludedAreas?: string[]
}

export interface Contract {
  id: string
  contractCode: string
  clientId: string
  client?: Client
  siteId: string
  site?: Site
  type: ServiceContractType
  frequency: ContractFrequency | null
  startDate: string
  endDate: string | null
  status: ContractStatus
  pricing: ContractPricing | null
  serviceScope: ServiceScope | null
  notes: string | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface ContractsSearchParams {
  clientId?: string
  siteId?: string
  type?: ServiceContractType
  status?: ContractStatus
  search?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
  includeDeleted?: boolean
}

export interface PaginatedContracts {
  data: Contract[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface CreateContractRequest {
  clientId: string
  siteId: string
  type: ServiceContractType
  frequency?: ContractFrequency
  startDate: string
  endDate?: string
  pricing?: ContractPricing
  serviceScope?: ServiceScope
  notes?: string
}

export interface UpdateContractRequest {
  clientId?: string
  siteId?: string
  type?: ServiceContractType
  frequency?: ContractFrequency
  startDate?: string
  endDate?: string
  status?: ContractStatus
  pricing?: ContractPricing
  serviceScope?: ServiceScope
  notes?: string
}

export const contractsApi = {
  /**
   * Get all contracts with filters
   */
  getAll: async (params: ContractsSearchParams = {}): Promise<PaginatedContracts> => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value))
      }
    })
    const query = searchParams.toString()
    return request<PaginatedContracts>(`/contracts${query ? `?${query}` : ''}`)
  },

  /**
   * Get a single contract by ID
   */
  getById: async (id: string): Promise<Contract> => {
    return request<Contract>(`/contracts/${id}`)
  },

  /**
   * Create a new contract
   */
  create: async (data: CreateContractRequest): Promise<Contract> => {
    return request<Contract>('/contracts', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  /**
   * Update a contract
   */
  update: async (id: string, data: UpdateContractRequest): Promise<Contract> => {
    return request<Contract>(`/contracts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  /**
   * Soft delete (archive) a contract
   */
  archive: async (id: string): Promise<{ success: boolean }> => {
    return request<{ success: boolean }>(`/contracts/${id}`, {
      method: 'DELETE',
    })
  },

  /**
   * Restore an archived contract
   */
  restore: async (id: string): Promise<Contract> => {
    return request<Contract>(`/contracts/${id}/restore`, {
      method: 'POST',
    })
  },

  /**
   * Activate a contract (change status to ACTIVE)
   */
  activate: async (id: string): Promise<Contract> => {
    return request<Contract>(`/contracts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'ACTIVE' }),
    })
  },

  /**
   * Suspend/Deactivate a contract (change status to INACTIVE)
   */
  suspend: async (id: string): Promise<Contract> => {
    return request<Contract>(`/contracts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'INACTIVE' }),
    })
  },

  /**
   * Complete a contract
   */
  complete: async (id: string): Promise<Contract> => {
    return request<Contract>(`/contracts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'COMPLETED' }),
    })
  },

  /**
   * Batch archive contracts
   */
  batchArchive: async (ids: string[]): Promise<{ success: boolean; count: number }> => {
    return request<{ deleted: string[]; errors: any[] }>('/contracts/batch/delete', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    }).then(res => ({ success: true, count: res.deleted?.length || ids.length }))
  },
}

// ============================================
// Interventions API Endpoints
// ============================================

export type InterventionStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED'

export interface GpsCoordinates {
  latitude: number
  longitude: number
  timestamp: string
  accuracy?: number
}

export interface Intervention {
  id: string
  interventionCode: string
  contractId: string
  contract?: Contract
  siteId: string
  site?: Site
  scheduledDate: string
  scheduledStartTime: string
  scheduledEndTime: string
  actualStartTime: string | null
  actualEndTime: string | null
  status: InterventionStatus
  assignedZoneChiefId: string | null
  zoneChief?: User | null
  assignedTeamChiefId: string | null
  teamChief?: User | null
  assignedAgentIds: string[] | null
  agents?: User[]
  checklistTemplateId: string | null
  checklistCompleted: boolean
  gpsCheckInLat: number | null
  gpsCheckInLng: number | null
  gpsCheckOutLat: number | null
  gpsCheckOutLng: number | null
  gpsCheckInTime: string | null
  gpsCheckOutTime: string | null
  photoUrls: string[] | null
  qualityScore: number | null
  clientRating: number | null
  clientFeedback: string | null
  incidents: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface InterventionsSearchParams {
  contractId?: string
  siteId?: string
  clientId?: string
  status?: InterventionStatus
  startDate?: string
  endDate?: string
  agentId?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}

export interface CalendarSearchParams {
  startDate: string
  endDate: string
}

export interface PaginatedInterventions {
  data: Intervention[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface CreateInterventionRequest {
  contractId: string
  siteId: string
  scheduledDate: string
  scheduledStartTime: string
  scheduledEndTime: string
  assignedAgentIds: string[]
  assignedZoneChiefId?: string
  assignedTeamChiefId?: string
  checklistTemplateId?: string
  notes?: string
}

export interface UpdateInterventionRequest {
  scheduledDate?: string
  scheduledStartTime?: string
  scheduledEndTime?: string
  assignedAgentIds?: string[]
  assignedZoneChiefId?: string
  assignedTeamChiefId?: string
  checklistTemplateId?: string
  notes?: string
  status?: InterventionStatus
}

export interface RescheduleRequest {
  newDate: string
  newStartTime?: string
  newEndTime?: string
  reason?: string
}

export interface GpsCheckInRequest {
  latitude: number
  longitude: number
  accuracy?: number
}

export interface GpsCheckOutRequest {
  latitude: number
  longitude: number
  accuracy?: number
}

export const interventionsApi = {
  /**
   * Get all interventions with filters
   */
  getAll: async (params: InterventionsSearchParams = {}): Promise<PaginatedInterventions> => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value))
      }
    })
    const query = searchParams.toString()
    return request<PaginatedInterventions>(`/interventions${query ? `?${query}` : ''}`)
  },

  /**
   * Get calendar view for a date range
   */
  getCalendar: async (params: CalendarSearchParams): Promise<Intervention[]> => {
    const searchParams = new URLSearchParams()
    searchParams.append('startDate', params.startDate)
    searchParams.append('endDate', params.endDate)
    return request<Intervention[]>(`/interventions/calendar?${searchParams.toString()}`)
  },

  /**
   * Get a single intervention by ID
   */
  getById: async (id: string): Promise<Intervention> => {
    return request<Intervention>(`/interventions/${id}`)
  },

  /**
   * Create a new intervention
   */
  create: async (data: CreateInterventionRequest): Promise<Intervention> => {
    return request<Intervention>('/interventions', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  /**
   * Update an intervention
   */
  update: async (id: string, data: UpdateInterventionRequest): Promise<Intervention> => {
    return request<Intervention>(`/interventions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  /**
   * Delete an intervention (soft delete)
   */
  delete: async (id: string): Promise<void> => {
    return request<void>(`/interventions/${id}`, {
      method: 'DELETE',
    })
  },

  /**
   * Start an intervention
   */
  start: async (id: string): Promise<Intervention> => {
    return request<Intervention>(`/interventions/${id}/start`, {
      method: 'POST',
    })
  },

  /**
   * Complete an intervention
   */
  complete: async (id: string): Promise<Intervention> => {
    return request<Intervention>(`/interventions/${id}/complete`, {
      method: 'POST',
    })
  },

  /**
   * Cancel an intervention
   */
  cancel: async (id: string): Promise<Intervention> => {
    return request<Intervention>(`/interventions/${id}/cancel`, {
      method: 'POST',
    })
  },

  /**
   * Reschedule an intervention
   */
  reschedule: async (id: string, data: RescheduleRequest): Promise<Intervention> => {
    return request<Intervention>(`/interventions/${id}/reschedule`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  /**
   * GPS Check-in for an intervention
   */
  checkIn: async (id: string, data: GpsCheckInRequest): Promise<Intervention> => {
    return request<Intervention>(`/interventions/${id}/checkin`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  /**
   * GPS Check-out for an intervention
   */
  checkOut: async (id: string, data: GpsCheckOutRequest): Promise<Intervention> => {
    return request<Intervention>(`/interventions/${id}/checkout`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  /**
   * Add a photo to an intervention
   */
  addPhoto: async (id: string, photoUrl: string): Promise<Intervention> => {
    return request<Intervention>(`/interventions/${id}/photos`, {
      method: 'POST',
      body: JSON.stringify({ photoUrl }),
    })
  },
}

// ============================================
// Sites API Endpoints
// ============================================

export type SiteSize = 'SMALL' | 'MEDIUM' | 'LARGE'
export type SiteStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'

export interface Site {
  id: string
  clientId: string
  client?: Client
  name: string
  size: SiteSize
  address: string | null
  city: string | null
  postalCode: string | null
  country: string | null
  accessInstructions: string | null
  workingHours: string | null
  contactPerson: string | null
  contactPhone: string | null
  contactEmail: string | null
  notes: string | null
  status: SiteStatus
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface SitesSearchParams {
  clientId?: string
  size?: SiteSize
  status?: SiteStatus
  search?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}

export interface PaginatedSites {
  data: Site[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface CreateSiteRequest {
  clientId: string
  name: string
  size?: SiteSize
  address?: string
  city?: string
  postalCode?: string
  country?: string
  accessInstructions?: string
  workingHours?: string
  contactPerson?: string
  contactPhone?: string
  contactEmail?: string
  notes?: string
}

export interface UpdateSiteRequest {
  clientId?: string
  name?: string
  size?: SiteSize
  address?: string
  city?: string
  postalCode?: string
  country?: string
  accessInstructions?: string
  workingHours?: string
  contactPerson?: string
  contactPhone?: string
  contactEmail?: string
  notes?: string
  status?: SiteStatus
}

export const sitesApi = {
  /**
   * Get all sites with filters
   */
  getAll: async (params: SitesSearchParams = {}): Promise<PaginatedSites> => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value))
      }
    })
    const query = searchParams.toString()
    return request<PaginatedSites>(`/sites${query ? `?${query}` : ''}`)
  },

  /**
   * Get a single site by ID
   */
  getById: async (id: string): Promise<Site> => {
    return request<Site>(`/sites/${id}`)
  },

  /**
   * Create a new site
   */
  create: async (data: CreateSiteRequest): Promise<Site> => {
    return request<Site>('/sites', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  /**
   * Update a site
   */
  update: async (id: string, data: UpdateSiteRequest): Promise<Site> => {
    return request<Site>(`/sites/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  /**
   * Soft delete (archive) a site
   */
  archive: async (id: string): Promise<{ success: boolean }> => {
    return request<{ success: boolean }>(`/sites/${id}`, {
      method: 'DELETE',
    })
  },

  /**
   * Restore an archived site
   */
  restore: async (id: string): Promise<Site> => {
    return request<Site>(`/sites/${id}/restore`, {
      method: 'POST',
    })
  },

  /**
   * Batch activate sites
   */
  batchActivate: async (ids: string[]): Promise<{ success: boolean; count: number }> => {
    const sites = ids.map(id => ({ id, status: 'ACTIVE' as const }))
    return request<{ success: boolean; count: number }>('/sites/batch/update', {
      method: 'PATCH',
      body: JSON.stringify({ sites }),
    }).then(() => ({ success: true, count: ids.length }))
  },

  /**
   * Batch archive (soft delete) sites
   */
  batchArchive: async (ids: string[]): Promise<{ success: boolean; count: number }> => {
    return request<{ deleted: string[]; errors: any[] }>('/sites/batch/delete', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    }).then(res => ({ success: true, count: res.deleted?.length || ids.length }))
  },
}

// ============================================
// Zones API Endpoints
// ============================================

export type ZoneStatus = 'ACTIVE' | 'INACTIVE'

export interface Zone {
  id: string
  zoneName: string
  zoneCode: string
  status: ZoneStatus
  description: string | null
  zoneChiefId: string | null
  zoneChief?: User | null
  createdAt: string
  updatedAt: string
}

export interface ZonesSearchParams {
  status?: ZoneStatus
  search?: string
  page?: number
  limit?: number
}

export interface PaginatedZones {
  data: Zone[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export const zonesApi = {
  /**
   * Get all zones
   */
  getAll: async (params: ZonesSearchParams = {}): Promise<Zone[]> => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value))
      }
    })
    const query = searchParams.toString()
    // Return array directly for dropdown usage
    return request<Zone[] | PaginatedZones>(`/zones${query ? `?${query}` : ''}`).then((res) => 
      Array.isArray(res) ? res : res.data
    )
  },

  /**
   * Get a single zone by ID
   */
  getById: async (id: string): Promise<Zone> => {
    return request<Zone>(`/zones/${id}`)
  },
}

// =====================
// Absences API
// =====================

export type AbsenceType = 'VACATION' | 'SICK_LEAVE' | 'UNPAID' | 'AUTHORIZED' | 'UNAUTHORIZED'
export type AbsenceStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'

export interface Absence {
  id: string
  agentId: string
  agent?: User
  absenceType: AbsenceType
  startDate: string
  endDate: string
  totalDays: number
  reason: string | null
  status: AbsenceStatus
  requestedAt: string
  reviewedBy: string | null
  reviewer?: User | null
  reviewedAt: string | null
  reviewNotes: string | null
  attachmentUrl: string | null
  createdAt: string
  updatedAt: string
}

export interface AbsenceBalance {
  year: number
  vacationDaysAllocated: number
  vacationDaysUsed: number
  vacationDaysRemaining: number
  sickDaysUsed: number
  unpaidDaysUsed: number
  authorizedDaysUsed: number
}

export interface AbsencesSearchParams {
  agentId?: string
  zoneId?: string
  type?: AbsenceType
  status?: AbsenceStatus
  dateFrom?: string
  dateTo?: string
}

export interface CreateAbsenceRequest {
  agentId: string
  absenceType: AbsenceType
  startDate: string
  endDate: string
  reason?: string
  attachmentUrl?: string
}

export interface UpdateAbsenceRequest {
  absenceType?: AbsenceType
  startDate?: string
  endDate?: string
  reason?: string
  attachmentUrl?: string
}

export interface ReviewAbsenceRequest {
  status: 'APPROVED' | 'REJECTED'
  reviewNotes?: string
}

export const absencesApi = {
  /**
   * Get all absences with optional filters
   */
  getAll: async (params: AbsencesSearchParams = {}): Promise<Absence[]> => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value))
      }
    })
    const query = searchParams.toString()
    return request<Absence[]>(`/absences${query ? `?${query}` : ''}`)
  },

  /**
   * Get pending absences for review
   */
  getPending: async (): Promise<Absence[]> => {
    return request<Absence[]>('/absences/pending')
  },

  /**
   * Get absence calendar data
   */
  getCalendar: async (params: { zoneId?: string; dateFrom?: string; dateTo?: string }): Promise<Absence[]> => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value))
      }
    })
    const query = searchParams.toString()
    return request<Absence[]>(`/absences/calendar${query ? `?${query}` : ''}`)
  },

  /**
   * Get agent's absence balance
   */
  getBalance: async (agentId: string, year?: number): Promise<AbsenceBalance> => {
    const query = year ? `?year=${year}` : ''
    return request<AbsenceBalance>(`/absences/balance/${agentId}${query}`)
  },

  /**
   * Get absence by ID
   */
  getById: async (id: string): Promise<Absence> => {
    return request<Absence>(`/absences/${id}`)
  },

  /**
   * Create absence request
   */
  create: async (data: CreateAbsenceRequest): Promise<Absence> => {
    return request<Absence>('/absences', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  /**
   * Update absence request
   */
  update: async (id: string, data: UpdateAbsenceRequest): Promise<Absence> => {
    return request<Absence>(`/absences/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  /**
   * Review (approve/reject) absence
   */
  review: async (id: string, data: ReviewAbsenceRequest): Promise<Absence> => {
    return request<Absence>(`/absences/${id}/review`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  /**
   * Cancel absence request
   */
  cancel: async (id: string): Promise<Absence> => {
    return request<Absence>(`/absences/${id}/cancel`, {
      method: 'POST',
    })
  },

  /**
   * Delete absence
   */
  delete: async (id: string): Promise<void> => {
    return request<void>(`/absences/${id}`, {
      method: 'DELETE',
    })
  },
}

export default {
  auth: authApi,
  notifications: notificationsApi,
  attendance: attendanceApi,
  profile: profileApi,
  settings: settingsApi,
  audit: auditApi,
  reports: reportsApi,
  users: usersApi,
  clients: clientsApi,
  contracts: contractsApi,
  interventions: interventionsApi,
  sites: sitesApi,
  zones: zonesApi,
  absences: absencesApi,
  getToken,
  setToken,
  clearAuth,
  getStoredUser,
  setStoredUser,
}
