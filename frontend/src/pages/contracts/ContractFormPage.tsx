import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  FileText,
  Building2,
  MapPin,
  Calendar,
  DollarSign,
  ClipboardList,
  Loader2,
  Save,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react'
import {
  contractsApi,
  CreateContractRequest,
  UpdateContractRequest,
  ServiceContractType,
  ContractFrequency,
  ContractStatus,
  ContractPricing,
  ServiceScope,
  clientsApi,
  Client,
  sitesApi,
  Site,
} from '@/services/api'
import { useAuth } from '@/contexts/AuthContext'
import { SearchableSelect, SelectOption } from '@/components/shared/SearchableSelect'

// Type options
const typeOptions: { value: ServiceContractType; labelKey: string; description: string; icon: typeof RefreshCw }[] = [
  { value: 'PERMANENT', labelKey: 'contracts.type.permanent', description: 'contracts.form.permanentDesc', icon: RefreshCw },
  { value: 'ONE_TIME', labelKey: 'contracts.type.oneTime', description: 'contracts.form.oneTimeDesc', icon: Calendar },
]

// Frequency options
const frequencyOptions: { value: ContractFrequency; labelKey: string }[] = [
  { value: 'DAILY', labelKey: 'contracts.frequency.daily' },
  { value: 'WEEKLY', labelKey: 'contracts.frequency.weekly' },
  { value: 'BIWEEKLY', labelKey: 'contracts.frequency.biweekly' },
  { value: 'MONTHLY', labelKey: 'contracts.frequency.monthly' },
  { value: 'QUARTERLY', labelKey: 'contracts.frequency.quarterly' },
  { value: 'CUSTOM', labelKey: 'contracts.frequency.custom' },
]

// Status options (for edit mode)
const statusOptions: { value: ContractStatus; labelKey: string; color: string }[] = [
  { value: 'DRAFT', labelKey: 'contracts.status.draft', color: 'text-gray-600' },
  { value: 'ACTIVE', labelKey: 'contracts.status.active', color: 'text-green-600' },
  { value: 'INACTIVE', labelKey: 'contracts.status.inactive', color: 'text-yellow-600' },
  { value: 'COMPLETED', labelKey: 'contracts.status.completed', color: 'text-blue-600' },
]

// Form sections
const formSections = [
  { id: 'basic', labelKey: 'contracts.form.sections.basic', icon: FileText },
  { id: 'schedule', labelKey: 'contracts.form.sections.schedule', icon: Calendar },
  { id: 'pricing', labelKey: 'contracts.form.sections.pricing', icon: DollarSign },
  { id: 'scope', labelKey: 'contracts.form.sections.scope', icon: ClipboardList },
]

// Billing cycle options
const billingCycleOptions = [
  { value: 'WEEKLY', labelKey: 'contracts.billing.weekly' },
  { value: 'MONTHLY', labelKey: 'contracts.billing.monthly' },
  { value: 'QUARTERLY', labelKey: 'contracts.billing.quarterly' },
  { value: 'ANNUALLY', labelKey: 'contracts.billing.annually' },
]

export function ContractFormPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { user: currentUser } = useAuth()
  const isEditMode = Boolean(id)

  // Form state
  const [formData, setFormData] = useState<{
    clientId: string
    siteId: string
    type: ServiceContractType
    frequency: ContractFrequency | null
    startDate: string
    endDate: string
    status?: ContractStatus
    notes: string
    pricing: ContractPricing
    serviceScope: ServiceScope
  }>({
    clientId: '',
    siteId: '',
    type: 'PERMANENT',
    frequency: 'DAILY',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    notes: '',
    pricing: {
      currency: 'MRU',
      monthlyFee: undefined,
      perInterventionFee: undefined,
      hourlyRate: undefined,
      billingCycle: 'MONTHLY',
      paymentTerms: '',
    },
    serviceScope: {
      zones: [],
      tasks: [],
      specialInstructions: '',
      excludedAreas: [],
    },
  })

  // UI state
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [clients, setClients] = useState<Client[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [clientsLoading, setClientsLoading] = useState(true)
  const [sitesLoading, setSitesLoading] = useState(false)
  const [activeSection, setActiveSection] = useState('basic')
  
  // Refs for scroll observation
  const formContainerRef = useRef<HTMLDivElement>(null)
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map())
  
  // Register section ref
  const setSectionRef = useCallback((id: string, element: HTMLElement | null) => {
    if (element) {
      sectionRefs.current.set(id, element)
    } else {
      sectionRefs.current.delete(id)
    }
  }, [])

  // Scroll observation to update active section
  useEffect(() => {
    const container = formContainerRef.current
    if (!container) return

    const handleScroll = () => {
      const containerRect = container.getBoundingClientRect()
      const headerOffset = 120
      
      let currentSection = 'basic'
      let minDistance = Infinity
      
      sectionRefs.current.forEach((element, id) => {
        const rect = element.getBoundingClientRect()
        const distanceFromTop = Math.abs(rect.top - containerRect.top - headerOffset)
        
        if (rect.top <= containerRect.top + headerOffset + 100 && distanceFromTop < minDistance) {
          minDistance = distanceFromTop
          currentSection = id
        }
      })
      
      setActiveSection(currentSection)
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  // Role-based access check
  useEffect(() => {
    if (currentUser?.role === 'AGENT' || currentUser?.role === 'CLIENT') {
      navigate('/dashboard')
    }
  }, [currentUser, navigate])

  // Fetch clients for dropdown
  useEffect(() => {
    async function fetchClients() {
      try {
        setClientsLoading(true)
        const response = await clientsApi.getAll({ limit: 100 })
        setClients(response.data || [])
      } catch (err) {
        console.error('Failed to fetch clients:', err)
      } finally {
        setClientsLoading(false)
      }
    }
    fetchClients()
  }, [])

  // Fetch sites when client is selected
  useEffect(() => {
    async function fetchSites() {
      if (!formData.clientId) {
        setSites([])
        return
      }
      try {
        setSitesLoading(true)
        const response = await sitesApi.getAll({ clientId: formData.clientId, limit: 100, status: 'ACTIVE' })
        setSites(response.data || [])
      } catch (err) {
        console.error('Failed to fetch sites:', err)
      } finally {
        setSitesLoading(false)
      }
    }
    fetchSites()
  }, [formData.clientId])

  // Convert clients to select options
  const clientOptions: SelectOption[] = useMemo(
    () =>
      clients.map((client) => ({
        value: client.id,
        label: client.name,
        sublabel: client.email || client.phone || undefined,
        icon: <Building2 className="h-4 w-4" />,
      })),
    [clients]
  )

  // Convert sites to select options
  const siteOptions: SelectOption[] = useMemo(
    () =>
      sites.map((site) => ({
        value: site.id,
        label: site.name,
        sublabel: site.address || site.city || undefined,
        icon: <MapPin className="h-4 w-4" />,
      })),
    [sites]
  )

  // Fetch existing contract in edit mode
  useEffect(() => {
    if (isEditMode && id) {
      async function fetchContract() {
        try {
          setLoading(true)
          const contract = await contractsApi.getById(id!)
          setFormData({
            clientId: contract.clientId,
            siteId: contract.siteId,
            type: contract.type,
            frequency: contract.frequency,
            startDate: contract.startDate.split('T')[0],
            endDate: contract.endDate ? contract.endDate.split('T')[0] : '',
            status: contract.status,
            notes: contract.notes || '',
            pricing: contract.pricing || {
              currency: 'MRU',
              billingCycle: 'MONTHLY',
            },
            serviceScope: contract.serviceScope || {
              zones: [],
              tasks: [],
            },
          })
        } catch (err: any) {
          console.error('Failed to fetch contract:', err)
          setError(err.message || 'Failed to load contract')
        } finally {
          setLoading(false)
        }
      }
      fetchContract()
    }
  }, [isEditMode, id])

  // Validation
  const validate = (): boolean => {
    const errors: Record<string, string> = {}
    
    if (!formData.clientId) {
      errors.clientId = t('contracts.validation.clientRequired', 'Client is required')
    }
    if (!formData.siteId) {
      errors.siteId = t('contracts.validation.siteRequired', 'Site is required')
    }
    if (!formData.startDate) {
      errors.startDate = t('contracts.validation.startDateRequired', 'Start date is required')
    }
    if (formData.type === 'ONE_TIME' && !formData.endDate) {
      errors.endDate = t('contracts.validation.endDateRequired', 'End date is required for one-time contracts')
    }
    if (formData.endDate && formData.startDate && new Date(formData.endDate) <= new Date(formData.startDate)) {
      errors.endDate = t('contracts.validation.endDateAfterStart', 'End date must be after start date')
    }
    if (formData.type === 'PERMANENT' && !formData.frequency) {
      errors.frequency = t('contracts.validation.frequencyRequired', 'Frequency is required for permanent contracts')
    }
    
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validate()) return
    
    try {
      setSaving(true)
      setError(null)
      
      const requestData: CreateContractRequest | UpdateContractRequest = {
        clientId: formData.clientId,
        siteId: formData.siteId,
        type: formData.type,
        frequency: formData.type === 'PERMANENT' ? formData.frequency! : undefined,
        startDate: formData.startDate,
        endDate: formData.endDate || undefined,
        notes: formData.notes || undefined,
        pricing: formData.pricing.monthlyFee || formData.pricing.perInterventionFee || formData.pricing.hourlyRate
          ? formData.pricing
          : undefined,
        serviceScope: formData.serviceScope.zones.length > 0 || formData.serviceScope.tasks.length > 0
          ? formData.serviceScope
          : undefined,
      }

      if (isEditMode && id) {
        await contractsApi.update(id, {
          ...requestData,
          status: formData.status,
        })
      } else {
        await contractsApi.create(requestData as CreateContractRequest)
      }

      setSuccess(true)
      setTimeout(() => {
        navigate('/contracts')
      }, 1500)
    } catch (err: any) {
      console.error('Failed to save contract:', err)
      setError(err.message || 'Failed to save contract')
    } finally {
      setSaving(false)
    }
  }

  // Scroll to section
  const scrollToSection = (sectionId: string) => {
    const element = sectionRefs.current.get(sectionId)
    if (element && formContainerRef.current) {
      const container = formContainerRef.current
      const headerOffset = 100
      const elementTop = element.offsetTop - headerOffset
      container.scrollTo({ top: elementTop, behavior: 'smooth' })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {isEditMode ? t('contracts.form.editTitle', 'Edit Contract') : t('contracts.form.createTitle', 'New Contract')}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isEditMode
                ? t('contracts.form.editSubtitle', 'Update contract details')
                : t('contracts.form.createSubtitle', 'Create a new service contract')}
            </p>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : success ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? t('common.saving', 'Saving...') : success ? t('common.saved', 'Saved!') : t('common.save', 'Save')}
          </button>
        </div>

        {/* Section Tabs */}
        <div className="mt-4 flex items-center gap-1 overflow-x-auto pb-1">
          {formSections.map((section) => {
            const Icon = section.icon
            const isActive = activeSection === section.id
            return (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                {t(section.labelKey)}
              </button>
            )
          })}
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mx-4 sm:mx-6 mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-300">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {success && (
        <div className="mx-4 sm:mx-6 mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2 text-green-700 dark:text-green-300">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span className="text-sm">{t('contracts.form.success', 'Contract saved successfully!')}</span>
        </div>
      )}

      {/* Form Content */}
      <div ref={formContainerRef} className="flex-1 overflow-auto p-4 sm:p-6">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6">
          {/* Basic Information Section */}
          <section
            ref={(el) => setSectionRef('basic', el)}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-500" />
                {t('contracts.form.sections.basic', 'Basic Information')}
              </h2>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              {/* Client */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('contracts.form.client', 'Client')} <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  options={clientOptions}
                  value={formData.clientId}
                  onChange={(value) => {
                    setFormData(prev => ({ ...prev, clientId: value || '', siteId: '' }))
                    setValidationErrors(prev => ({ ...prev, clientId: '' }))
                  }}
                  placeholder={t('contracts.form.selectClient', 'Select a client...')}
                  loading={clientsLoading}
                  error={validationErrors.clientId}
                />
              </div>

              {/* Site */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('contracts.form.site', 'Site')} <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  options={siteOptions}
                  value={formData.siteId}
                  onChange={(value) => {
                    setFormData(prev => ({ ...prev, siteId: value || '' }))
                    setValidationErrors(prev => ({ ...prev, siteId: '' }))
                  }}
                  placeholder={
                    !formData.clientId
                      ? t('contracts.form.selectClientFirst', 'Select a client first')
                      : t('contracts.form.selectSite', 'Select a site...')
                  }
                  loading={sitesLoading}
                  disabled={!formData.clientId}
                  error={validationErrors.siteId}
                />
              </div>

              {/* Contract Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('contracts.form.type', 'Contract Type')} <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {typeOptions.map((option) => {
                    const Icon = option.icon
                    const isSelected = formData.type === option.value
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            type: option.value,
                            frequency: option.value === 'PERMANENT' ? 'DAILY' : null,
                          }))
                        }}
                        className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <div className={`p-2 rounded-lg ${isSelected ? 'bg-indigo-100 dark:bg-indigo-900/50' : 'bg-gray-100 dark:bg-gray-700'}`}>
                          <Icon className={`h-5 w-5 ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500'}`} />
                        </div>
                        <div>
                          <div className={`font-medium ${isSelected ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-900 dark:text-white'}`}>
                            {t(option.labelKey)}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {t(option.description)}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Status (edit mode only) */}
              {isEditMode && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('contracts.form.status', 'Status')}
                  </label>
                  <select
                    value={formData.status || 'DRAFT'}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as ContractStatus }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {t(option.labelKey)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('contracts.form.notes', 'Notes')}
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  placeholder={t('contracts.form.notesPlaceholder', 'Additional notes or special requirements...')}
                />
              </div>
            </div>
          </section>

          {/* Schedule Section */}
          <section
            ref={(el) => setSectionRef('schedule', el)}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Calendar className="h-5 w-5 text-indigo-500" />
                {t('contracts.form.sections.schedule', 'Schedule')}
              </h2>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              {/* Frequency (for permanent contracts) */}
              {formData.type === 'PERMANENT' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('contracts.form.frequency', 'Frequency')} <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.frequency || ''}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, frequency: e.target.value as ContractFrequency }))
                      setValidationErrors(prev => ({ ...prev, frequency: '' }))
                    }}
                    className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      validationErrors.frequency ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    {frequencyOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {t(option.labelKey)}
                      </option>
                    ))}
                  </select>
                  {validationErrors.frequency && (
                    <p className="mt-1 text-sm text-red-500">{validationErrors.frequency}</p>
                  )}
                </div>
              )}

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('contracts.form.startDate', 'Start Date')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, startDate: e.target.value }))
                      setValidationErrors(prev => ({ ...prev, startDate: '' }))
                    }}
                    className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      validationErrors.startDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {validationErrors.startDate && (
                    <p className="mt-1 text-sm text-red-500">{validationErrors.startDate}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('contracts.form.endDate', 'End Date')}
                    {formData.type === 'ONE_TIME' && <span className="text-red-500"> *</span>}
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, endDate: e.target.value }))
                      setValidationErrors(prev => ({ ...prev, endDate: '' }))
                    }}
                    className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      validationErrors.endDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {validationErrors.endDate && (
                    <p className="mt-1 text-sm text-red-500">{validationErrors.endDate}</p>
                  )}
                  {formData.type === 'PERMANENT' && !formData.endDate && (
                    <p className="mt-1 text-xs text-gray-500">{t('contracts.form.ongoingHint', 'Leave empty for ongoing contract')}</p>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Pricing Section */}
          <section
            ref={(el) => setSectionRef('pricing', el)}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-indigo-500" />
                {t('contracts.form.sections.pricing', 'Pricing')}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {t('contracts.form.pricingHint', 'Optional pricing details for billing')}
              </p>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              {/* Currency */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('contracts.form.currency', 'Currency')}
                </label>
                <select
                  value={formData.pricing.currency}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    pricing: { ...prev.pricing, currency: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="MRU">MRU - Mauritanian Ouguiya</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="USD">USD - US Dollar</option>
                </select>
              </div>

              {/* Pricing Fields */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('contracts.form.monthlyFee', 'Monthly Fee')}
                  </label>
                  <input
                    type="number"
                    value={formData.pricing.monthlyFee || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      pricing: { ...prev.pricing, monthlyFee: e.target.value ? Number(e.target.value) : undefined }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('contracts.form.perIntervention', 'Per Intervention')}
                  </label>
                  <input
                    type="number"
                    value={formData.pricing.perInterventionFee || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      pricing: { ...prev.pricing, perInterventionFee: e.target.value ? Number(e.target.value) : undefined }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('contracts.form.hourlyRate', 'Hourly Rate')}
                  </label>
                  <input
                    type="number"
                    value={formData.pricing.hourlyRate || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      pricing: { ...prev.pricing, hourlyRate: e.target.value ? Number(e.target.value) : undefined }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Billing Cycle */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('contracts.form.billingCycle', 'Billing Cycle')}
                  </label>
                  <select
                    value={formData.pricing.billingCycle || 'MONTHLY'}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      pricing: { ...prev.pricing, billingCycle: e.target.value as 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY' }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    {billingCycleOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {t(option.labelKey)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('contracts.form.paymentTerms', 'Payment Terms')}
                  </label>
                  <input
                    type="text"
                    value={formData.pricing.paymentTerms || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      pricing: { ...prev.pricing, paymentTerms: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder={t('contracts.form.paymentTermsPlaceholder', 'e.g., Net 30 days')}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Scope Section */}
          <section
            ref={(el) => setSectionRef('scope', el)}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-indigo-500" />
                {t('contracts.form.sections.scope', 'Service Scope')}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {t('contracts.form.scopeHint', 'Define areas and tasks covered by this contract')}
              </p>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              {/* Zones */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('contracts.form.zones', 'Zones / Areas')}
                </label>
                <input
                  type="text"
                  value={formData.serviceScope.zones.join(', ')}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    serviceScope: { ...prev.serviceScope, zones: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder={t('contracts.form.zonesPlaceholder', 'Reception, Bureaux, Sanitaires, Cuisine...')}
                />
                <p className="mt-1 text-xs text-gray-500">{t('contracts.form.zonesHint', 'Separate with commas')}</p>
              </div>

              {/* Tasks */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('contracts.form.tasks', 'Tasks')}
                </label>
                <input
                  type="text"
                  value={formData.serviceScope.tasks.join(', ')}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    serviceScope: { ...prev.serviceScope, tasks: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder={t('contracts.form.tasksPlaceholder', 'Nettoyage sols, Vitres, Désinfection...')}
                />
                <p className="mt-1 text-xs text-gray-500">{t('contracts.form.tasksHint', 'Separate with commas')}</p>
              </div>

              {/* Special Instructions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('contracts.form.specialInstructions', 'Special Instructions')}
                </label>
                <textarea
                  value={formData.serviceScope.specialInstructions || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    serviceScope: { ...prev.serviceScope, specialInstructions: e.target.value }
                  }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  placeholder={t('contracts.form.specialInstructionsPlaceholder', 'Any special requirements or instructions...')}
                />
              </div>
            </div>
          </section>

          {/* Bottom padding for scroll */}
          <div className="h-8" />
        </form>
      </div>
    </div>
  )
}

export default ContractFormPage
