import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Save,
  AlertCircle,
  CheckCircle,
  Building2,
  User,
  Globe,
} from 'lucide-react'
import { clientsApi, CreateClientRequest, UpdateClientRequest, ClientType } from '@/services/api'
import { useAuth } from '@/contexts/AuthContext'

// Type options
const typeOptions: { value: ClientType; labelKey: string; icon: React.ElementType }[] = [
  { value: 'INDIVIDUAL', labelKey: 'clients.types.INDIVIDUAL', icon: User },
  { value: 'COMPANY', labelKey: 'clients.types.COMPANY', icon: Building2 },
  { value: 'MULTI_SITE', labelKey: 'clients.types.MULTI_SITE', icon: Globe },
]

// Status options (lifecycle: PROSPECT → CURRENT → FORMER → ARCHIVED)
const statusOptions = [
  { value: 'PROSPECT', labelKey: 'clients.status.PROSPECT' },
  { value: 'CURRENT', labelKey: 'clients.status.CURRENT' },
  { value: 'FORMER', labelKey: 'clients.status.FORMER' },
]

export function ClientFormPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { user: currentUser } = useAuth()
  
  const isEditMode = Boolean(id)
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: 'COMPANY' as ClientType,
    status: 'CURRENT',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
    contactPerson: '',
    contactPhone: '',
    notes: '',
    // New fields for user account creation
    createUserAccount: false,
    password: '',
    confirmPassword: '',
  })
  
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(isEditMode)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  
  // Permission check
  const canEdit = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN'
  
  // Redirect if no permission
  useEffect(() => {
    if (!canEdit) {
      navigate('/clients')
    }
  }, [canEdit, navigate])
  
  // Fetch existing client data for edit mode
  useEffect(() => {
    async function fetchClient() {
      if (!id) return
      
      try {
        setFetchLoading(true)
        const client = await clientsApi.getById(id)
        setFormData({
          name: client.name || '',
          type: client.type || 'COMPANY',
          status: client.status || 'PROSPECT',
          email: client.email || '',
          phone: client.phone || '',
          address: client.address || '',
          city: client.city || '',
          postalCode: client.postalCode || '',
          country: client.country || '',
          contactPerson: client.contactPerson || '',
          contactPhone: client.contactPhone || '',
          notes: client.notes || '',
          // Edit mode: don't allow creating user account
          createUserAccount: false,
          password: '',
          confirmPassword: '',
        })
      } catch (err: any) {
        setError(err.message || t('clients.form.errors.loadFailed', 'Failed to load client'))
      } finally {
        setFetchLoading(false)
      }
    }
    
    fetchClient()
  }, [id, t])
  
  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }))
    }
  }
  
  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    
    if (!formData.name.trim()) {
      errors.name = t('clients.form.errors.nameRequired', 'Name is required')
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = t('clients.form.errors.emailInvalid', 'Invalid email format')
    }
    
    // Validate user account fields if createUserAccount is checked
    if (formData.createUserAccount) {
      if (!formData.email) {
        errors.email = t('clients.form.errors.emailRequiredForAccount', 'Email is required for login account')
      }
      if (!formData.password) {
        errors.password = t('clients.form.errors.passwordRequired', 'Password is required')
      } else if (formData.password.length < 6) {
        errors.password = t('clients.form.errors.passwordTooShort', 'Password must be at least 6 characters')
      }
      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = t('clients.form.errors.passwordMismatch', 'Passwords do not match')
      }
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
        // Update client
        const updateData: UpdateClientRequest = {
          name: formData.name,
          type: formData.type,
          status: formData.status as any,
          email: formData.email || undefined,
          phone: formData.phone || undefined,
          address: formData.address || undefined,
          city: formData.city || undefined,
          postalCode: formData.postalCode || undefined,
          country: formData.country || undefined,
          contactPerson: formData.contactPerson || undefined,
          contactPhone: formData.contactPhone || undefined,
          notes: formData.notes || undefined,
        }
        
        await clientsApi.update(id!, updateData)
        setSuccess(t('clients.form.updateSuccess', 'Client updated successfully'))
        
        // Navigate to details page after short delay
        setTimeout(() => navigate(`/clients/view/${id}`), 1500)
      } else {
        // Create client
        const createData: CreateClientRequest = {
          name: formData.name,
          type: formData.type,
          email: formData.email || undefined,
          phone: formData.phone || undefined,
          address: formData.address || undefined,
          city: formData.city || undefined,
          postalCode: formData.postalCode || undefined,
          country: formData.country || undefined,
          contactPerson: formData.contactPerson || undefined,
          contactPhone: formData.contactPhone || undefined,
          notes: formData.notes || undefined,
          // Include user account creation fields
          createUserAccount: formData.createUserAccount,
          password: formData.createUserAccount ? formData.password : undefined,
        }
        
        const newClient = await clientsApi.create(createData)
        setSuccess(
          formData.createUserAccount
            ? t('clients.form.createSuccessWithAccount', 'Client created successfully with login account')
            : t('clients.form.createSuccess', 'Client created successfully')
        )
        
        // Navigate to details page after short delay
        setTimeout(() => navigate(`/clients/view/${newClient.id}`), 1500)
      }
    } catch (err: any) {
      setError(err.message || t('clients.form.errors.saveFailed', 'Failed to save client'))
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
              onClick={() => navigate(isEditMode ? `/clients/view/${id}` : '/clients')}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {isEditMode 
                  ? t('clients.form.editTitle', 'Edit Client')
                  : t('clients.form.createTitle', 'Add New Client')
                }
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {isEditMode 
                  ? t('clients.form.editSubtitle', 'Update client information')
                  : t('clients.form.createSubtitle', 'Create a new client record')
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
          {/* Basic Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {t('clients.form.sections.basic', 'Basic Information')}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div className="md:col-span-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('clients.fields.name', 'Name')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                    validationErrors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  } focus:ring-2 focus:ring-emerald-500 focus:border-transparent`}
                />
                {validationErrors.name && (
                  <p className="mt-1 text-sm text-red-500">{validationErrors.name}</p>
                )}
              </div>
              
              {/* Type */}
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('clients.fields.type', 'Type')} <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {typeOptions.map(option => {
                    const Icon = option.icon
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, type: option.value }))}
                        className={`flex flex-col items-center justify-center gap-1 p-3 rounded-lg border transition-colors ${
                          formData.type === option.value
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                            : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <Icon className="h-6 w-6" />
                        <span className="text-xs font-medium">{t(option.labelKey, option.value)}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
              
              {/* Status (only for edit mode) */}
              {isEditMode && (
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('clients.fields.status', 'Status')} <span className="text-red-500">*</span>
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
              )}
            </div>
          </div>
          
          {/* Contact Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('clients.form.sections.contact', 'Contact Information')}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('clients.fields.email', 'Email')}
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                    validationErrors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  } focus:ring-2 focus:ring-emerald-500 focus:border-transparent`}
                />
                {validationErrors.email && (
                  <p className="mt-1 text-sm text-red-500">{validationErrors.email}</p>
                )}
              </div>
              
              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('clients.fields.phone', 'Phone')}
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
              
              {/* Contact Person */}
              <div>
                <label htmlFor="contactPerson" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('clients.fields.contactPerson', 'Contact Person')}
                </label>
                <input
                  type="text"
                  id="contactPerson"
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              
              {/* Contact Phone */}
              <div>
                <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('clients.fields.contactPhone', 'Contact Phone')}
                </label>
                <input
                  type="tel"
                  id="contactPhone"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
          
          {/* Address */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('clients.form.sections.address', 'Address')}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Address */}
              <div className="md:col-span-2">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('clients.fields.address', 'Address')}
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
                  {t('clients.fields.city', 'City')}
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
              
              {/* Postal Code */}
              <div>
                <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('clients.fields.postalCode', 'Postal Code')}
                </label>
                <input
                  type="text"
                  id="postalCode"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              
              {/* Country */}
              <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('clients.fields.country', 'Country')}
                </label>
                <input
                  type="text"
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
          
          {/* Login Account - Only show in create mode */}
          {!isEditMode && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {t('clients.form.sections.loginAccount', 'Login Account')}
              </h2>
              
              {/* Create User Account Checkbox */}
              <div className="mb-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="createUserAccount"
                    checked={formData.createUserAccount}
                    onChange={handleChange}
                    className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {t('clients.form.createUserAccount', 'Create login account for this client')}
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t('clients.form.createUserAccountHint', 'Allow this client to log in to the portal and view their sites, contracts, and interventions')}
                    </p>
                  </div>
                </label>
              </div>
              
              {/* Password Fields - Only show when checkbox is checked */}
              {formData.createUserAccount && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  {/* Password */}
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('clients.form.password', 'Password')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder={t('clients.form.passwordPlaceholder', 'Min. 6 characters')}
                      className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                        validationErrors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      } focus:ring-2 focus:ring-emerald-500 focus:border-transparent`}
                    />
                    {validationErrors.password && (
                      <p className="mt-1 text-sm text-red-500">{validationErrors.password}</p>
                    )}
                  </div>
                  
                  {/* Confirm Password */}
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('clients.form.confirmPassword', 'Confirm Password')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder={t('clients.form.confirmPasswordPlaceholder', 'Re-enter password')}
                      className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                        validationErrors.confirmPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      } focus:ring-2 focus:ring-emerald-500 focus:border-transparent`}
                    />
                    {validationErrors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-500">{validationErrors.confirmPassword}</p>
                    )}
                  </div>
                  
                  {/* Info about email */}
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t('clients.form.loginEmailHint', 'The client will use their email address above to log in.')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Notes */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('clients.form.sections.notes', 'Notes')}
            </h2>
            
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={4}
              placeholder={t('clients.form.notesPlaceholder', 'Add any additional notes about this client...')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          
          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(isEditMode ? `/clients/view/${id}` : '/clients')}
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
                  : t('clients.form.createClient', 'Create Client')
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ClientFormPage
