import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  FileText,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
} from 'lucide-react'
import {
  interventionsApi,
  CreateInterventionRequest,
  UpdateInterventionRequest,
  contractsApi,
  Contract,
  sitesApi,
  Site,
  usersApi,
  User,
} from '@/services/api'
import { SearchableSelect, SelectOption } from '@/components/shared/SearchableSelect'

// Form sections
const formSections = [
  { id: 'basic', labelKey: 'interventions.form.sections.basic', icon: FileText },
  { id: 'schedule', labelKey: 'interventions.form.sections.schedule', icon: Calendar },
  { id: 'team', labelKey: 'interventions.form.sections.team', icon: Users },
  { id: 'details', labelKey: 'interventions.form.sections.details', icon: Clock },
]

export function InterventionFormPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEditMode = Boolean(id)

  // Form state
  const [formData, setFormData] = useState<{
    contractId: string
    siteId: string
    scheduledDate: string
    scheduledStartTime: string
    scheduledEndTime: string
    assignedAgentIds: string[]
    assignedZoneChiefId: string
    assignedTeamChiefId: string
    notes: string
  }>({
    contractId: '',
    siteId: '',
    scheduledDate: new Date().toISOString().split('T')[0],
    scheduledStartTime: '08:00',
    scheduledEndTime: '17:00',
    assignedAgentIds: [],
    assignedZoneChiefId: '',
    assignedTeamChiefId: '',
    notes: '',
  })

  // UI state
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [activeSection, setActiveSection] = useState('basic')

  // Reference data
  const [contracts, setContracts] = useState<Contract[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [agents, setAgents] = useState<User[]>([])
  const [supervisors, setSupervisors] = useState<User[]>([])
  const [contractsLoading, setContractsLoading] = useState(false)
  const [sitesLoading, setSitesLoading] = useState(false)
  const [agentsLoading, setAgentsLoading] = useState(false)

  // Load contracts
  useEffect(() => {
    const loadContracts = async () => {
      setContractsLoading(true)
      try {
        const response = await contractsApi.getAll({ limit: 100 })
        setContracts(response.data || [])
      } catch (err) {
        console.error('Failed to load contracts:', err)
      } finally {
        setContractsLoading(false)
      }
    }
    loadContracts()
  }, [])

  // Load sites when contract changes
  useEffect(() => {
    if (formData.contractId) {
      const selectedContract = contracts.find(c => c.id === formData.contractId)
      if (selectedContract?.clientId) {
        setSitesLoading(true)
        sitesApi.getAll({ clientId: selectedContract.clientId, limit: 100 })
          .then(response => {
            setSites(Array.isArray(response) ? response : response.data || [])
          })
          .catch(err => console.error('Failed to load sites:', err))
          .finally(() => setSitesLoading(false))
      }
    } else {
      setSites([])
    }
  }, [formData.contractId, contracts])

  // Load agents and supervisors
  useEffect(() => {
    const loadUsers = async () => {
      setAgentsLoading(true)
      try {
        const [agentsResponse, supervisorsResponse] = await Promise.all([
          usersApi.getAll({ role: 'AGENT', status: 'ACTIVE', limit: 100 }),
          usersApi.getAll({ role: 'SUPERVISOR', status: 'ACTIVE', limit: 100 }),
        ])
        setAgents(Array.isArray(agentsResponse) ? agentsResponse : agentsResponse.data || [])
        setSupervisors(Array.isArray(supervisorsResponse) ? supervisorsResponse : supervisorsResponse.data || [])
      } catch (err) {
        console.error('Failed to load users:', err)
      } finally {
        setAgentsLoading(false)
      }
    }
    loadUsers()
  }, [])

  // Load existing intervention for edit mode
  useEffect(() => {
    if (isEditMode && id) {
      setLoading(true)
      interventionsApi.getById(id)
        .then((intervention) => {
          setFormData({
            contractId: intervention.contractId || '',
            siteId: intervention.siteId || '',
            scheduledDate: intervention.scheduledDate || '',
            scheduledStartTime: intervention.scheduledStartTime?.slice(0, 5) || '08:00',
            scheduledEndTime: intervention.scheduledEndTime?.slice(0, 5) || '17:00',
            assignedAgentIds: intervention.assignedAgentIds || [],
            assignedZoneChiefId: intervention.assignedZoneChiefId || '',
            assignedTeamChiefId: intervention.assignedTeamChiefId || '',
            notes: intervention.notes || '',
          })
        })
        .catch(err => {
          setError(t('interventions.form.errors.loadFailed', 'Failed to load intervention'))
          console.error('Failed to load intervention:', err)
        })
        .finally(() => setLoading(false))
    }
  }, [isEditMode, id, t])

  // Contract options for select
  const contractOptions: SelectOption[] = useMemo(() =>
    contracts.map(c => ({
      value: c.id,
      label: `${c.contractCode} - ${c.client?.name || 'Unknown Client'}`,
    })),
    [contracts]
  )

  // Site options for select
  const siteOptions: SelectOption[] = useMemo(() =>
    sites.map(s => ({
      value: s.id,
      label: s.name,
    })),
    [sites]
  )

  // Supervisor options
  const supervisorOptions: SelectOption[] = useMemo(() =>
    supervisors.map(s => ({
      value: s.id,
      label: `${s.firstName || ''} ${s.lastName || ''}`.trim() || s.email,
    })),
    [supervisors]
  )

  // Validation
  const validate = (): boolean => {
    const errors: Record<string, string> = {}

    if (!formData.contractId) {
      errors.contractId = t('interventions.form.errors.contractRequired', 'Contract is required')
    }
    if (!formData.siteId) {
      errors.siteId = t('interventions.form.errors.siteRequired', 'Site is required')
    }
    if (!formData.scheduledDate) {
      errors.scheduledDate = t('interventions.form.errors.dateRequired', 'Date is required')
    }
    if (!formData.scheduledStartTime) {
      errors.scheduledStartTime = t('interventions.form.errors.startTimeRequired', 'Start time is required')
    }
    if (!formData.scheduledEndTime) {
      errors.scheduledEndTime = t('interventions.form.errors.endTimeRequired', 'End time is required')
    }
    if (formData.scheduledStartTime >= formData.scheduledEndTime) {
      errors.scheduledEndTime = t('interventions.form.errors.endTimeInvalid', 'End time must be after start time')
    }
    if (formData.assignedAgentIds.length === 0) {
      errors.assignedAgentIds = t('interventions.form.errors.agentsRequired', 'At least one agent is required')
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      // Scroll to first error
      const firstErrorSection = formSections.find(s =>
        Object.keys(validationErrors).some(key => {
          if (s.id === 'basic') return ['contractId', 'siteId'].includes(key)
          if (s.id === 'schedule') return ['scheduledDate', 'scheduledStartTime', 'scheduledEndTime'].includes(key)
          if (s.id === 'team') return key === 'assignedAgentIds'
          return false
        })
      )
      if (firstErrorSection) {
        setActiveSection(firstErrorSection.id)
      }
      return
    }

    setSaving(true)
    setError(null)

    try {
      const payload: CreateInterventionRequest = {
        contractId: formData.contractId,
        siteId: formData.siteId,
        scheduledDate: formData.scheduledDate,
        scheduledStartTime: formData.scheduledStartTime,
        scheduledEndTime: formData.scheduledEndTime,
        assignedAgentIds: formData.assignedAgentIds,
        assignedZoneChiefId: formData.assignedZoneChiefId || undefined,
        assignedTeamChiefId: formData.assignedTeamChiefId || undefined,
        notes: formData.notes || undefined,
      }

      if (isEditMode && id) {
        await interventionsApi.update(id, payload as UpdateInterventionRequest)
      } else {
        await interventionsApi.create(payload)
      }

      setSuccess(true)
      setTimeout(() => {
        navigate('/interventions')
      }, 1500)
    } catch (err: any) {
      setError(err.message || t('interventions.form.errors.saveFailed', 'Failed to save intervention'))
    } finally {
      setSaving(false)
    }
  }

  // Toggle agent selection
  const toggleAgent = (agentId: string) => {
    setFormData(prev => ({
      ...prev,
      assignedAgentIds: prev.assignedAgentIds.includes(agentId)
        ? prev.assignedAgentIds.filter(id => id !== agentId)
        : [...prev.assignedAgentIds, agentId],
    }))
    setValidationErrors(prev => ({ ...prev, assignedAgentIds: '' }))
  }

  // Calculate form completion
  const completion = useMemo(() => {
    const fields = [
      formData.contractId,
      formData.siteId,
      formData.scheduledDate,
      formData.scheduledStartTime,
      formData.scheduledEndTime,
      formData.assignedAgentIds.length > 0,
    ]
    const filled = fields.filter(Boolean).length
    return Math.round((filled / fields.length) * 100)
  }, [formData])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/interventions')}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  {isEditMode
                    ? t('interventions.form.editTitle', 'Edit Intervention')
                    : t('interventions.form.addTitle', 'Schedule Intervention')
                  }
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {isEditMode
                    ? t('interventions.form.editSubtitle', 'Update intervention details')
                    : t('interventions.form.addSubtitle', 'Create a new cleaning intervention')
                  }
                </p>
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSubmit}
              disabled={saving || success}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : success ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving
                ? t('interventions.form.saving', 'Saving...')
                : success
                ? t('interventions.form.saved', 'Saved!')
                : t('interventions.form.save', 'Save Intervention')
              }
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Section Navigation */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-28 space-y-2">
              {formSections.map((section) => {
                const Icon = section.icon
                const isActive = activeSection === section.id
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      isActive
                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{t(section.labelKey, section.id)}</span>
                  </button>
                )
              })}

              {/* Completion Progress */}
              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('interventions.form.completion', 'Form Completion')}
                  </span>
                  <span className="text-sm font-bold text-primary-600 dark:text-primary-400">
                    {completion}%
                  </span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-600 rounded-full transition-all duration-300"
                    style={{ width: `${completion}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="flex-1 min-w-0">
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-700 dark:text-green-300">
                  {isEditMode
                    ? t('interventions.form.updateSuccess', 'Intervention updated successfully')
                    : t('interventions.form.createSuccess', 'Intervention created successfully')
                  }
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Information Section */}
              <div
                id="section-basic"
                className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${
                  activeSection === 'basic' ? 'ring-2 ring-primary-500' : ''
                }`}
              >
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-gray-400" />
                  {t('interventions.form.basicInfo', 'Basic Information')}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Contract */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('interventions.form.contract', 'Contract')} <span className="text-red-500">*</span>
                    </label>
                    <SearchableSelect
                      options={contractOptions}
                      value={formData.contractId}
                      onChange={(value) => {
                        setFormData(prev => ({ ...prev, contractId: value || '', siteId: '' }))
                        setValidationErrors(prev => ({ ...prev, contractId: '' }))
                      }}
                      placeholder={t('interventions.form.selectContract', 'Select a contract...')}
                      loading={contractsLoading}
                      error={validationErrors.contractId}
                    />
                  </div>

                  {/* Site */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('interventions.form.site', 'Site')} <span className="text-red-500">*</span>
                    </label>
                    <SearchableSelect
                      options={siteOptions}
                      value={formData.siteId}
                      onChange={(value) => {
                        setFormData(prev => ({ ...prev, siteId: value || '' }))
                        setValidationErrors(prev => ({ ...prev, siteId: '' }))
                      }}
                      placeholder={
                        !formData.contractId
                          ? t('interventions.form.selectContractFirst', 'Select a contract first')
                          : t('interventions.form.selectSite', 'Select a site...')
                      }
                      loading={sitesLoading}
                      disabled={!formData.contractId}
                      error={validationErrors.siteId}
                    />
                  </div>
                </div>
              </div>

              {/* Schedule Section */}
              <div
                id="section-schedule"
                className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${
                  activeSection === 'schedule' ? 'ring-2 ring-primary-500' : ''
                }`}
              >
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  {t('interventions.form.schedule', 'Schedule')}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('interventions.form.date', 'Date')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.scheduledDate}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, scheduledDate: e.target.value }))
                        setValidationErrors(prev => ({ ...prev, scheduledDate: '' }))
                      }}
                      min={new Date().toISOString().split('T')[0]}
                      className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                        validationErrors.scheduledDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                    {validationErrors.scheduledDate && (
                      <p className="mt-1 text-sm text-red-500">{validationErrors.scheduledDate}</p>
                    )}
                  </div>

                  {/* Start Time */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('interventions.form.startTime', 'Start Time')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      value={formData.scheduledStartTime}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, scheduledStartTime: e.target.value }))
                        setValidationErrors(prev => ({ ...prev, scheduledStartTime: '' }))
                      }}
                      className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                        validationErrors.scheduledStartTime ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                    {validationErrors.scheduledStartTime && (
                      <p className="mt-1 text-sm text-red-500">{validationErrors.scheduledStartTime}</p>
                    )}
                  </div>

                  {/* End Time */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('interventions.form.endTime', 'End Time')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      value={formData.scheduledEndTime}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, scheduledEndTime: e.target.value }))
                        setValidationErrors(prev => ({ ...prev, scheduledEndTime: '' }))
                      }}
                      className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                        validationErrors.scheduledEndTime ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                    {validationErrors.scheduledEndTime && (
                      <p className="mt-1 text-sm text-red-500">{validationErrors.scheduledEndTime}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Team Section */}
              <div
                id="section-team"
                className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${
                  activeSection === 'team' ? 'ring-2 ring-primary-500' : ''
                }`}
              >
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <Users className="h-5 w-5 text-gray-400" />
                  {t('interventions.form.team', 'Team Assignment')}
                </h2>

                {/* Agents Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('interventions.form.agents', 'Agents')} <span className="text-red-500">*</span>
                  </label>

                  {/* Selected Agents */}
                  {formData.assignedAgentIds.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {formData.assignedAgentIds.map((agentId) => {
                        const agent = agents.find(a => a.id === agentId)
                        return (
                          <span
                            key={agentId}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm"
                          >
                            {agent ? `${agent.firstName || ''} ${agent.lastName || ''}`.trim() || agent.email : agentId}
                            <button
                              type="button"
                              onClick={() => toggleAgent(agentId)}
                              className="text-primary-500 hover:text-primary-700"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </span>
                        )
                      })}
                    </div>
                  )}

                  {/* Agent List */}
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg max-h-60 overflow-y-auto">
                    {agentsLoading ? (
                      <div className="p-4 text-center text-gray-500">
                        <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                      </div>
                    ) : agents.length === 0 ? (
                      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                        {t('interventions.form.noAgents', 'No agents available')}
                      </div>
                    ) : (
                      agents.map((agent) => {
                        const isSelected = formData.assignedAgentIds.includes(agent.id)
                        return (
                          <button
                            key={agent.id}
                            type="button"
                            onClick={() => toggleAgent(agent.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-700/50 last:border-b-0 transition-colors ${
                              isSelected
                                ? 'bg-primary-50 dark:bg-primary-900/20'
                                : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                            }`}
                          >
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                              isSelected
                                ? 'bg-primary-600 border-primary-600'
                                : 'border-gray-300 dark:border-gray-600'
                            }`}>
                              {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                            </div>
                            <div className="flex-1 text-left">
                              <div className="font-medium text-gray-900 dark:text-white">
                                {`${agent.firstName || ''} ${agent.lastName || ''}`.trim() || agent.email}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {agent.email}
                              </div>
                            </div>
                          </button>
                        )
                      })
                    )}
                  </div>
                  {validationErrors.assignedAgentIds && (
                    <p className="mt-2 text-sm text-red-500">{validationErrors.assignedAgentIds}</p>
                  )}
                </div>

                {/* Supervisors */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Zone Chief */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('interventions.form.zoneChief', 'Zone Chief')}
                    </label>
                    <SearchableSelect
                      options={supervisorOptions}
                      value={formData.assignedZoneChiefId}
                      onChange={(value) => setFormData(prev => ({ ...prev, assignedZoneChiefId: value || '' }))}
                      placeholder={t('interventions.form.selectZoneChief', 'Select zone chief (optional)...')}
                    />
                  </div>

                  {/* Team Chief */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('interventions.form.teamChief', 'Team Chief')}
                    </label>
                    <SearchableSelect
                      options={supervisorOptions}
                      value={formData.assignedTeamChiefId}
                      onChange={(value) => setFormData(prev => ({ ...prev, assignedTeamChiefId: value || '' }))}
                      placeholder={t('interventions.form.selectTeamChief', 'Select team chief (optional)...')}
                    />
                  </div>
                </div>
              </div>

              {/* Details Section */}
              <div
                id="section-details"
                className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${
                  activeSection === 'details' ? 'ring-2 ring-primary-500' : ''
                }`}
              >
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-gray-400" />
                  {t('interventions.form.additionalDetails', 'Additional Details')}
                </h2>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('interventions.form.notes', 'Notes / Instructions')}
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={4}
                    placeholder={t('interventions.form.notesPlaceholder', 'Special instructions, access codes, etc...')}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InterventionFormPage
