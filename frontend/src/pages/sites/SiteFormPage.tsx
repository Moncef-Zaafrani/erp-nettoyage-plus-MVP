import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  MapPin,
  Building2,
  Clock,
  User as UserIcon,
  Phone,
  Mail,
  FileText,
  Loader2,
  Save,
  AlertCircle,
  CheckCircle2,
  Ruler,
  KeyRound,
} from 'lucide-react'
import { sitesApi, CreateSiteRequest, UpdateSiteRequest, clientsApi, Client, SiteSize, SiteStatus } from '@/services/api'
import { useAuth } from '@/contexts/AuthContext'
import { SearchableSelect, SelectOption } from '@/components/shared/SearchableSelect'
import { LocationPickerModal, LocationPickerTrigger, LocationData } from '@/components/shared/LocationPicker'

// Size options with descriptions
const sizeOptions: { value: SiteSize; labelKey: string; description: string; icon: string }[] = [
  { value: 'SMALL', labelKey: 'sites.size.SMALL', description: '< 500 m²', icon: '🏠' },
  { value: 'MEDIUM', labelKey: 'sites.size.MEDIUM', description: '500 - 2000 m²', icon: '🏢' },
  { value: 'LARGE', labelKey: 'sites.size.LARGE', description: '> 2000 m²', icon: '🏭' },
]

// Form sections for progress indicator
const formSections = [
  { id: 'basic', labelKey: 'sites.form.sections.basic', icon: Building2 },
  { id: 'location', labelKey: 'sites.form.sections.location', icon: MapPin },
  { id: 'contact', labelKey: 'sites.form.sections.contact', icon: UserIcon },
  { id: 'details', labelKey: 'sites.form.sections.details', icon: FileText },
]

export function SiteFormPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { user: currentUser } = useAuth()
  const isEditMode = Boolean(id)

  // Form state
  const [formData, setFormData] = useState<CreateSiteRequest & { status?: SiteStatus }>({
    clientId: '',
    name: '',
    size: 'MEDIUM',
    address: '',
    city: '',
    postalCode: '',
    country: '',
    accessInstructions: '',
    workingHours: '',
    contactPerson: '',
    contactPhone: '',
    contactEmail: '',
    notes: '',
  })

  // Location data for map
  const [locationData, setLocationData] = useState<LocationData | null>(null)
  const [showLocationPicker, setShowLocationPicker] = useState(false)

  // UI state
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [clients, setClients] = useState<Client[]>([])
  const [clientsLoading, setClientsLoading] = useState(true)
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
      const headerOffset = 120 // Account for sticky header + tabs
      
      // Find which section is currently most visible
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
        // Get all clients (CURRENT, PROSPECT) - excluding ARCHIVED
        const response = await clientsApi.getAll({ limit: 100 })
        // Filter out archived clients on frontend
        const activeClients = (response.data || []).filter(
          (client) => client.status !== 'ARCHIVED'
        )
        setClients(activeClients)
      } catch (err) {
        console.error('Failed to fetch clients:', err)
      } finally {
        setClientsLoading(false)
      }
    }
    fetchClients()
  }, [])

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

  // Fetch existing site data in edit mode
  useEffect(() => {
    if (isEditMode && id) {
      async function fetchSite() {
        try {
          setLoading(true)
          const site = await sitesApi.getById(id!)
          setFormData({
            clientId: site.clientId,
            name: site.name,
            size: site.size,
            address: site.address || '',
            city: site.city || '',
            postalCode: site.postalCode || '',
            country: site.country || '',
            accessInstructions: site.accessInstructions || '',
            workingHours: site.workingHours || '',
            contactPerson: site.contactPerson || '',
            contactPhone: site.contactPhone || '',
            contactEmail: site.contactEmail || '',
            notes: site.notes || '',
            status: site.status,
          })
        } catch (err: any) {
          console.error('Failed to fetch site:', err)
          setError(err.message || 'Failed to load site')
        } finally {
          setLoading(false)
        }
      }
      fetchSite()
    }
  }, [isEditMode, id])

  // Handle input change
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const { [name]: _, ...rest } = prev
        return rest
      })
    }
  }

  // Handle client selection
  const handleClientChange = (clientId: string | null) => {
    setFormData((prev) => ({ ...prev, clientId: clientId || '' }))
    if (validationErrors.clientId) {
      setValidationErrors((prev) => {
        const { clientId: _, ...rest } = prev
        return rest
      })
    }
  }

  // Handle location selection from map
  const handleLocationChange = (location: LocationData | null) => {
    setLocationData(location)
    if (location) {
      setFormData((prev) => ({
        ...prev,
        address: location.address || prev.address,
        city: location.city || prev.city,
        postalCode: location.postalCode || prev.postalCode,
        country: location.country || prev.country,
      }))
    }
  }

  // Handle size selection
  const handleSizeSelect = (size: SiteSize) => {
    setFormData((prev) => ({ ...prev, size }))
  }

  // Calculate form completion
  const completionPercentage = useMemo(() => {
    const requiredFields = ['clientId', 'name']
    const optionalFields = ['address', 'city', 'workingHours', 'contactPerson', 'contactPhone']
    
    const requiredCompleted = requiredFields.filter(
      (field) => formData[field as keyof typeof formData]
    ).length
    const optionalCompleted = optionalFields.filter(
      (field) => formData[field as keyof typeof formData]
    ).length

    return Math.round(
      ((requiredCompleted / requiredFields.length) * 70 +
        (optionalCompleted / optionalFields.length) * 30)
    )
  }, [formData])

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!formData.clientId) {
      errors.clientId = t('sites.form.errors.clientRequired', 'Client is required')
    }

    if (!formData.name.trim()) {
      errors.name = t('sites.form.errors.nameRequired', 'Site name is required')
    }

    if (
      formData.contactEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)
    ) {
      errors.contactEmail = t('sites.form.errors.invalidEmail', 'Invalid email format')
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      // Scroll to first error
      const firstErrorField = Object.keys(validationErrors)[0]
      const element = document.querySelector(`[name="${firstErrorField}"]`)
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    try {
      setSaving(true)
      setError(null)

      if (isEditMode && id) {
        const updateData: UpdateSiteRequest = {
          ...formData,
        }
        await sitesApi.update(id, updateData)
        setSuccess(true)
        setTimeout(() => navigate(`/sites/view/${id}`), 1000)
      } else {
        const createData: CreateSiteRequest = {
          clientId: formData.clientId,
          name: formData.name,
          size: formData.size,
          address: formData.address || undefined,
          city: formData.city || undefined,
          postalCode: formData.postalCode || undefined,
          country: formData.country || undefined,
          accessInstructions: formData.accessInstructions || undefined,
          workingHours: formData.workingHours || undefined,
          contactPerson: formData.contactPerson || undefined,
          contactPhone: formData.contactPhone || undefined,
          contactEmail: formData.contactEmail || undefined,
          notes: formData.notes || undefined,
        }
        const newSite = await sitesApi.create(createData)
        setSuccess(true)
        setTimeout(() => navigate(`/sites/view/${newSite.id}`), 1000)
      }
    } catch (err: any) {
      console.error('Failed to save site:', err)
      setError(err.message || 'Failed to save site')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-600 mx-auto" />
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">Loading site...</p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
            {isEditMode ? 'Site Updated!' : 'Site Created!'}
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Redirecting...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Compact Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 sticky top-0 z-20">
        <div className="px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Go back"
              >
                <ArrowLeft className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                {isEditMode
                  ? t('sites.form.editTitle', 'Edit Site')
                  : t('sites.form.addTitle', 'New Site')}
              </h1>
            </div>

            {/* Completion indicator - compact */}
            <div className="flex items-center gap-2">
              <div className="w-20 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-emerald-600">{completionPercentage}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Section Navigation */}
      <div className="sticky top-[53px] z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="px-4 sm:px-6 py-2">
          <div className="flex items-center gap-1 overflow-x-auto">
            {formSections.map((section) => {
              const Icon = section.icon
              const isActive = activeSection === section.id
              return (
                <button
                  key={section.id}
                  onClick={() => {
                    setActiveSection(section.id)
                    document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }}
                  className={`
                    flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all
                    ${isActive
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{t(section.labelKey, section.id)}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div ref={formContainerRef} className="flex-1 overflow-y-auto">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          {/* Error Alert */}
          {error && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-red-800 dark:text-red-300">
                  {t('common.error', 'Error')}
                </h3>
                <p className="text-sm text-red-700 dark:text-red-400 mt-1">{error}</p>
              </div>
              <button
                type="button"
                onClick={() => setError(null)}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                <span className="sr-only">Dismiss</span>
                ×
              </button>
            </div>
          )}

          {/* Basic Information Section */}
          <section
            id="basic"
            ref={(el) => setSectionRef('basic', el)}
            className={`bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm ${
              activeSection === 'basic' ? 'ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-gray-900' : ''
            }`}
          >
            <div className="px-6 py-4 bg-gradient-to-r from-emerald-50 to-white dark:from-emerald-900/20 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Building2 className="h-5 w-5 text-emerald-600" />
                {t('sites.form.basicInfo', 'Basic Information')}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Essential details about the site
              </p>
            </div>

            <div className="p-6 space-y-5">
              {/* Client Selection */}
              <div>
                <label htmlFor="client-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('sites.form.client', 'Client')} <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  id="client-select"
                  name="clientId"
                  options={clientOptions}
                  value={formData.clientId || null}
                  onChange={handleClientChange}
                  placeholder={t('sites.form.selectClient', 'Select a client...')}
                  searchPlaceholder={t('sites.form.searchClients', 'Search clients...')}
                  noResultsText={t('sites.form.noClientsFound', 'No clients found')}
                  loading={clientsLoading}
                  error={validationErrors.clientId}
                  icon={<Building2 className="h-4 w-4" />}
                />
              </div>

              {/* Site Name */}
              <div>
                <label htmlFor="site-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('sites.form.name', 'Site Name')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="site-name"
                  name="name"
                  autoComplete="organization"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder={t('sites.form.namePlaceholder', 'e.g., Main Office Building')}
                  className={`w-full px-4 py-3 border rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-all ${
                    validationErrors.name
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 dark:border-gray-600 focus:ring-emerald-500 focus:border-emerald-500'
                  } focus:ring-2 focus:ring-offset-0`}
                />
                {validationErrors.name && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {validationErrors.name}
                  </p>
                )}
              </div>

              {/* Site Size - Visual Cards */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  <Ruler className="h-4 w-4 inline mr-1" />
                  {t('sites.form.size', 'Site Size')}
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {sizeOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleSizeSelect(option.value)}
                      className={`
                        relative p-4 rounded-xl border-2 text-center transition-all
                        ${formData.size === option.value
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                        }
                      `}
                    >
                      <div className="text-2xl mb-2">{option.icon}</div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {t(option.labelKey)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {option.description}
                      </div>
                      {formData.size === option.value && (
                        <div className="absolute top-2 right-2">
                          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Working Hours */}
              <div>
                <label htmlFor="working-hours" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Clock className="h-4 w-4 inline mr-1" />
                  {t('sites.form.workingHours', 'Working Hours')}
                </label>
                <input
                  type="text"
                  id="working-hours"
                  name="workingHours"
                  autoComplete="off"
                  value={formData.workingHours}
                  onChange={handleChange}
                  placeholder={t('sites.form.workingHoursPlaceholder', 'e.g., Mon-Fri 08:00-17:00')}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                />
              </div>
            </div>
          </section>

          {/* Location Section */}
          <section
            id="location"
            ref={(el) => setSectionRef('location', el)}
            className={`bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm ${
              activeSection === 'location' ? 'ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-gray-900' : ''
            }`}
          >
            <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                {t('sites.form.location', 'Location')}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Site address and geographic location
              </p>
            </div>

            <div className="p-6 space-y-5">
              {/* Map Location Picker */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('sites.form.mapLocation', 'Select on Map')}
                </label>
                <LocationPickerTrigger
                  value={locationData}
                  onClick={() => setShowLocationPicker(true)}
                  placeholder={t('sites.form.mapPlaceholder', 'Click to select location on map')}
                />
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200 dark:border-gray-700" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-white dark:bg-gray-800 text-gray-500">
                    {t('common.or', 'or enter manually')}
                  </span>
                </div>
              </div>

              {/* Manual Address Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('sites.form.address', 'Street Address')}
                  </label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    autoComplete="street-address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder={t('sites.form.addressPlaceholder', 'Street address')}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('sites.form.city', 'City')}
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    autoComplete="address-level2"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder={t('sites.form.cityPlaceholder', 'City')}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="postal-code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('sites.form.postalCode', 'Postal Code')}
                  </label>
                  <input
                    type="text"
                    id="postal-code"
                    name="postalCode"
                    autoComplete="postal-code"
                    value={formData.postalCode}
                    onChange={handleChange}
                    placeholder={t('sites.form.postalCodePlaceholder', 'Postal code')}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('sites.form.country', 'Country')}
                  </label>
                  <input
                    type="text"
                    id="country"
                    name="country"
                    autoComplete="country-name"
                    value={formData.country}
                    onChange={handleChange}
                    placeholder={t('sites.form.countryPlaceholder', 'Country')}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="access-instructions" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <KeyRound className="h-4 w-4 inline mr-1" />
                    {t('sites.form.accessInstructions', 'Access Instructions')}
                  </label>
                  <textarea
                    id="access-instructions"
                    name="accessInstructions"
                    autoComplete="off"
                    value={formData.accessInstructions}
                    onChange={handleChange}
                    rows={3}
                    placeholder={t(
                      'sites.form.accessInstructionsPlaceholder',
                      'Parking, entry codes, key location, specific instructions...'
                    )}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all resize-none"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Contact Section */}
          <section
            id="contact"
            ref={(el) => setSectionRef('contact', el)}
            className={`bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm ${
              activeSection === 'contact' ? 'ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-gray-900' : ''
            }`}
          >
            <div className="px-6 py-4 bg-gradient-to-r from-purple-50 to-white dark:from-purple-900/20 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-purple-600" />
                {t('sites.form.contactInfo', 'On-site Contact')}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Contact person at this site
              </p>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="contact-person" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('sites.form.contactPerson', 'Contact Person')}
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      id="contact-person"
                      name="contactPerson"
                      autoComplete="name"
                      value={formData.contactPerson}
                      onChange={handleChange}
                      placeholder={t('sites.form.contactPersonPlaceholder', 'Full name')}
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="contact-phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('sites.form.contactPhone', 'Phone')}
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="tel"
                      id="contact-phone"
                      name="contactPhone"
                      autoComplete="tel"
                      value={formData.contactPhone}
                      onChange={handleChange}
                      placeholder={t('sites.form.contactPhonePlaceholder', 'Phone number')}
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="contact-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('sites.form.contactEmail', 'Email')}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      id="contact-email"
                      name="contactEmail"
                      autoComplete="email"
                      value={formData.contactEmail}
                      onChange={handleChange}
                      placeholder={t('sites.form.contactEmailPlaceholder', 'email@example.com')}
                      className={`w-full pl-11 pr-4 py-3 border rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-all ${
                        validationErrors.contactEmail
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-gray-300 dark:border-gray-600 focus:ring-emerald-500 focus:border-emerald-500'
                      } focus:ring-2`}
                    />
                  </div>
                  {validationErrors.contactEmail && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {validationErrors.contactEmail}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Additional Details Section */}
          <section
            id="details"
            ref={(el) => setSectionRef('details', el)}
            className={`bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm ${
              activeSection === 'details' ? 'ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-gray-900' : ''
            }`}
          >
            <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white dark:from-gray-700 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-gray-600" />
                {t('sites.form.additionalInfo', 'Additional Information')}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Notes and special requirements
              </p>
            </div>

            <div className="p-6">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('sites.form.notes', 'Notes')}
              </label>
              <textarea
                id="notes"
                name="notes"
                autoComplete="off"
                value={formData.notes}
                onChange={handleChange}
                rows={5}
                placeholder={t(
                  'sites.form.notesPlaceholder',
                  'Any additional notes, requirements, or special instructions for this site...'
                )}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all resize-none"
              />
            </div>
          </section>

          {/* Form Actions - Sticky Footer */}
          <div className="sticky bottom-0 -mx-4 sm:-mx-6 px-4 sm:px-6 py-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg">
            <div className="flex items-center justify-between max-w-4xl mx-auto">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-600/25 hover:shadow-emerald-600/40"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('common.saving', 'Saving...')}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {isEditMode
                      ? t('common.saveChanges', 'Save Changes')
                      : t('sites.form.createSite', 'Create Site')}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Location Picker Modal */}
      <LocationPickerModal
        isOpen={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        value={locationData}
        onChange={handleLocationChange}
        onAddressSelect={(data) => {
          setFormData((prev) => ({
            ...prev,
            address: data.address || prev.address,
            city: data.city || prev.city,
            postalCode: data.postalCode || prev.postalCode,
            country: data.country || prev.country,
          }))
        }}
      />
    </div>
  )
}

export default SiteFormPage
