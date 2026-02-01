import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Save,
  Eye,
  EyeOff,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Shield,
  UserCog,
  UserCheck,
  User as UserIcon,
} from 'lucide-react'
import { usersApi, User, CreateUserRequest, UpdateUserRequest } from '@/services/api'
import { useAuth } from '@/contexts/AuthContext'

// Role options - CLIENT users are created via Client entity, not directly as users
const roleOptions = [
  { value: 'SUPER_ADMIN', labelKey: 'users.roles.SUPER_ADMIN', icon: Shield },
  { value: 'ADMIN', labelKey: 'users.roles.ADMIN', icon: Shield },
  { value: 'SUPERVISOR', labelKey: 'users.roles.SUPERVISOR', icon: UserCog },
  { value: 'AGENT', labelKey: 'users.roles.AGENT', icon: UserCheck },
]

// Status options
const statusOptions = [
  { value: 'ACTIVE', labelKey: 'users.status.ACTIVE' },
  { value: 'INACTIVE', labelKey: 'users.status.INACTIVE' },
]

// Contract types
const contractTypes = [
  { value: 'CDI', label: 'CDI' },
  { value: 'CDD', label: 'CDD' },
  { value: 'FREELANCE', label: 'Freelance' },
]

// Generate random password
function generatePassword(length = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

export function UserFormPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { user: currentUser } = useAuth()
  
  const isEditMode = Boolean(id)
  
  // Redirect if no permission - only SUPER_ADMIN and ADMIN can create/edit users
  useEffect(() => {
    if (currentUser?.role === 'AGENT' || currentUser?.role === 'CLIENT') {
      navigate('/dashboard', { replace: true })
    }
  }, [currentUser, navigate])
  
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    displayName: '',
    role: 'AGENT',
    status: 'ACTIVE',
    phone: '',
    secondaryPhone: '',
    personalEmail: '',
    address: '',
    city: '',
    region: '',
    employeeId: '',
    hireDate: '',
    contractType: '' as string,
    supervisorId: '' as string,
    sendWelcomeEmail: true,
    emailVerified: false,
  })
  
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(isEditMode)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [supervisors, setSupervisors] = useState<User[]>([])
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  
  // Determine which roles current user can assign
  const allowedRoles = useMemo(() => {
    if (currentUser?.role === 'SUPER_ADMIN') {
      return roleOptions
    }
    if (currentUser?.role === 'ADMIN') {
      // Admins can only create Supervisors and Agents (CLIENT users created via Client entity)
      return roleOptions.filter(r => ['SUPERVISOR', 'AGENT'].includes(r.value))
    }
    return []
  }, [currentUser])
  
  // Fetch supervisors for dropdown
  useEffect(() => {
    async function fetchSupervisors() {
      try {
        const data = await usersApi.getSupervisors()
        setSupervisors(data)
      } catch (err) {
        console.error('Failed to fetch supervisors:', err)
      }
    }
    fetchSupervisors()
  }, [])
  
  // Fetch existing user data for edit mode
  useEffect(() => {
    async function fetchUser() {
      if (!id) return
      
      try {
        setFetchLoading(true)
        const user = await usersApi.getById(id)
        setFormData({
          email: user.email || '',
          password: '', // Don't populate password
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          displayName: user.displayName || '',
          role: user.role || 'AGENT',
          status: user.status || 'ACTIVE',
          phone: user.phone || '',
          secondaryPhone: user.secondaryPhone || '',
          personalEmail: user.personalEmail || '',
          address: user.address || '',
          city: user.city || '',
          region: user.region || '',
          employeeId: user.employeeId || '',
          hireDate: user.hireDate ? new Date(user.hireDate).toISOString().split('T')[0] : '',
          contractType: user.contractType || '',
          supervisorId: user.supervisorId || '',
          sendWelcomeEmail: false, // No email on edit
          emailVerified: user.emailVerified || false,
        })
      } catch (err: any) {
        setError(err.message || t('users.form.errors.loadFailed', 'Failed to load user'))
      } finally {
        setFetchLoading(false)
      }
    }
    
    fetchUser()
  }, [id, t])
  
  // Generate password for new users
  useEffect(() => {
    if (!isEditMode && !formData.password) {
      setFormData(prev => ({ ...prev, password: generatePassword() }))
    }
  }, [isEditMode, formData.password])
  
  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }))
    }
  }
  
  // Regenerate password
  const handleRegeneratePassword = () => {
    setFormData(prev => ({ ...prev, password: generatePassword() }))
  }
  
  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    
    if (!formData.email) {
      errors.email = t('users.form.errors.emailRequired', 'Email is required')
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = t('users.form.errors.emailInvalid', 'Invalid email format')
    }
    
    if (!isEditMode && !formData.password) {
      errors.password = t('users.form.errors.passwordRequired', 'Password is required')
    } else if (!isEditMode && formData.password.length < 8) {
      errors.password = t('users.form.errors.passwordTooShort', 'Password must be at least 8 characters')
    }
    
    if (!formData.firstName) {
      errors.firstName = t('users.form.errors.firstNameRequired', 'First name is required')
    }
    
    if (!formData.lastName) {
      errors.lastName = t('users.form.errors.lastNameRequired', 'Last name is required')
    }
    
    // Supervisor required for Agents
    if (formData.role === 'AGENT' && !formData.supervisorId) {
      errors.supervisorId = t('users.form.errors.supervisorRequired', 'Supervisor is required for agents')
    }
    
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }
  
  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    try {
      setLoading(true)
      setError(null)
      setSuccess(null)
      
      if (isEditMode) {
        // Update user
        const updateData: UpdateUserRequest = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          displayName: formData.displayName || undefined,
          role: formData.role as any,
          status: formData.status as any,
          phone: formData.phone || undefined,
          secondaryPhone: formData.secondaryPhone || undefined,
          personalEmail: formData.personalEmail || undefined,
          address: formData.address || undefined,
          city: formData.city || undefined,
          region: formData.region || undefined,
          employeeId: formData.employeeId || undefined,
          hireDate: formData.hireDate || undefined,
          contractType: formData.contractType as any || undefined,
          supervisorId: formData.supervisorId || null,
        }
        
        await usersApi.update(id!, updateData)
        setSuccess(t('users.form.updateSuccess', 'User updated successfully'))
        
        // Navigate to details page after short delay
        setTimeout(() => navigate(`/users/view/${id}`), 1500)
      } else {
        // Create user
        const createData: CreateUserRequest = {
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          displayName: formData.displayName || undefined,
          role: formData.role as any,
          phone: formData.phone || undefined,
          secondaryPhone: formData.secondaryPhone || undefined,
          personalEmail: formData.personalEmail || undefined,
          address: formData.address || undefined,
          city: formData.city || undefined,
          region: formData.region || undefined,
          employeeId: formData.employeeId || undefined,
          hireDate: formData.hireDate || undefined,
          contractType: formData.contractType as any || undefined,
          supervisorId: formData.supervisorId || undefined,
          emailVerified: formData.emailVerified || undefined,
        }
        
        const newUser = await usersApi.create(createData)
        setSuccess(t('users.form.createSuccess', 'User created successfully'))
        
        // Log password for dev (in production would send email)
        console.log(`[DEV] Password for ${formData.email}: ${formData.password}`)
        
        // Navigate to details page after short delay
        setTimeout(() => navigate(`/users/view/${newUser.id}`), 1500)
      }
    } catch (err: any) {
      setError(err.message || t('users.form.errors.saveFailed', 'Failed to save user'))
    } finally {
      setLoading(false)
    }
  }
  
  // Loading state for edit mode
  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent" />
      </div>
    )
  }
  
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(isEditMode ? `/users/${id}` : '/users')}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {isEditMode 
                  ? t('users.form.editTitle', 'Edit User')
                  : t('users.form.createTitle', 'Add New User')
                }
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {isEditMode 
                  ? t('users.form.editSubtitle', 'Update user information')
                  : t('users.form.createSubtitle', 'Create a new user account')
                }
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Messages */}
      {error && (
        <div className="mx-4 sm:mx-6 mt-4 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}
      
      {success && (
        <div className="mx-4 sm:mx-6 mt-4 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          <span>{success}</span>
        </div>
      )}
      
      {/* Form */}
      <div className="flex-1 overflow-auto p-4 sm:p-6">
        <form onSubmit={handleSubmit} className="max-w-4xl">
          {/* Account Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <UserIcon className="h-5 w-5" />
              {t('users.form.sections.account', 'Account Information')}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('users.fields.email', 'Email')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isEditMode}
                  className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                    validationErrors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  } focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-700`}
                />
                {validationErrors.email && (
                  <p className="mt-1 text-sm text-red-500">{validationErrors.email}</p>
                )}
              </div>
              
              {/* Password (only for new users) */}
              {!isEditMode && (
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('users.fields.password', 'Password')} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 pr-10 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                          validationErrors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                        } focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={handleRegeneratePassword}
                      className="px-3 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                      title={t('users.form.regeneratePassword', 'Generate new password')}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  </div>
                  {validationErrors.password && (
                    <p className="mt-1 text-sm text-red-500">{validationErrors.password}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {t('users.form.passwordHint', 'Auto-generated password. Share it securely with the user.')}
                  </p>
                </div>
              )}
              
              {/* Email Verified Checkbox (only for new users) */}
              {!isEditMode && (
                <div className="md:col-span-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="emailVerified"
                      checked={formData.emailVerified}
                      onChange={handleChange}
                      className="w-5 h-5 text-emerald-600 border-gray-300 dark:border-gray-600 rounded focus:ring-emerald-500 cursor-pointer"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('users.form.emailVerified', 'Mark email as verified')}
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t('users.form.emailVerifiedHint', 'Skip email verification step. User can login immediately.')}
                      </p>
                    </div>
                  </label>
                </div>
              )}
              
              {/* Role */}
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('users.fields.role', 'Role')} <span className="text-red-500">*</span>
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  {allowedRoles.map(role => (
                    <option key={role.value} value={role.value}>
                      {t(role.labelKey, role.value)}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Status */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('users.fields.status', 'Status')} <span className="text-red-500">*</span>
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  {statusOptions.map(status => (
                    <option key={status.value} value={status.value}>
                      {t(status.labelKey, status.value)}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Supervisor (required for Agents) */}
              {formData.role === 'AGENT' && (
                <div className="md:col-span-2">
                  <label htmlFor="supervisorId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('users.fields.supervisor', 'Supervisor')} <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="supervisorId"
                    name="supervisorId"
                    value={formData.supervisorId}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                      validationErrors.supervisorId ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    } focus:ring-2 focus:ring-emerald-500 focus:border-transparent`}
                  >
                    <option value="">{t('users.form.selectSupervisor', 'Select a supervisor...')}</option>
                    {supervisors.map(sup => (
                      <option key={sup.id} value={sup.id}>
                        {sup.firstName} {sup.lastName} ({sup.email})
                      </option>
                    ))}
                  </select>
                  {validationErrors.supervisorId && (
                    <p className="mt-1 text-sm text-red-500">{validationErrors.supervisorId}</p>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Personal Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('users.form.sections.personal', 'Personal Information')}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* First Name */}
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('users.fields.firstName', 'First Name')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                    validationErrors.firstName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  } focus:ring-2 focus:ring-emerald-500 focus:border-transparent`}
                />
                {validationErrors.firstName && (
                  <p className="mt-1 text-sm text-red-500">{validationErrors.firstName}</p>
                )}
              </div>
              
              {/* Last Name */}
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('users.fields.lastName', 'Last Name')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                    validationErrors.lastName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  } focus:ring-2 focus:ring-emerald-500 focus:border-transparent`}
                />
                {validationErrors.lastName && (
                  <p className="mt-1 text-sm text-red-500">{validationErrors.lastName}</p>
                )}
              </div>
              
              {/* Display Name */}
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('users.fields.displayName', 'Display Name')}
                </label>
                <input
                  type="text"
                  id="displayName"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleChange}
                  placeholder={`${formData.firstName} ${formData.lastName}`}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              
              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('users.fields.phone', 'Phone')}
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              
              {/* Secondary Phone */}
              <div>
                <label htmlFor="secondaryPhone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('users.fields.secondaryPhone', 'Secondary Phone')}
                </label>
                <input
                  type="tel"
                  id="secondaryPhone"
                  name="secondaryPhone"
                  value={formData.secondaryPhone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              
              {/* Personal Email */}
              <div>
                <label htmlFor="personalEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('users.fields.personalEmail', 'Personal Email')}
                </label>
                <input
                  type="email"
                  id="personalEmail"
                  name="personalEmail"
                  value={formData.personalEmail}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
          
          {/* Address */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('users.form.sections.address', 'Address')}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Address */}
              <div className="md:col-span-2">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('users.fields.address', 'Address')}
                </label>
                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              
              {/* City */}
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('users.fields.city', 'City')}
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              
              {/* Region */}
              <div>
                <label htmlFor="region" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('users.fields.region', 'Region')}
                </label>
                <input
                  type="text"
                  id="region"
                  name="region"
                  value={formData.region}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
          
          {/* Employment Details (for non-client roles) */}
          {formData.role !== 'CLIENT' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {t('users.form.sections.employment', 'Employment Details')}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Employee ID */}
                <div>
                  <label htmlFor="employeeId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('users.fields.employeeId', 'Employee ID')}
                  </label>
                  <input
                    type="text"
                    id="employeeId"
                    name="employeeId"
                    value={formData.employeeId}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                
                {/* Hire Date */}
                <div>
                  <label htmlFor="hireDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('users.fields.hireDate', 'Hire Date')}
                  </label>
                  <input
                    type="date"
                    id="hireDate"
                    name="hireDate"
                    value={formData.hireDate}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                
                {/* Contract Type */}
                <div>
                  <label htmlFor="contractType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('users.fields.contractType', 'Contract Type')}
                  </label>
                  <select
                    id="contractType"
                    name="contractType"
                    value={formData.contractType}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="">{t('users.form.selectContractType', 'Select type...')}</option>
                    {contractTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
          
          {/* Welcome Email Option (for new users only) */}
          {!isEditMode && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="sendWelcomeEmail"
                  checked={formData.sendWelcomeEmail}
                  onChange={handleChange}
                  className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {t('users.form.sendWelcomeEmail', 'Send welcome email')}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('users.form.sendWelcomeEmailDesc', 'Send an email with login credentials to the user')}
                  </p>
                </div>
              </label>
            </div>
          )}
          
          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(isEditMode ? `/users/${id}` : '/users')}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {t('common.cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {loading 
                ? t('common.saving', 'Saving...') 
                : isEditMode 
                  ? t('common.save', 'Save') 
                  : t('users.form.createUser', 'Create User')
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default UserFormPage
