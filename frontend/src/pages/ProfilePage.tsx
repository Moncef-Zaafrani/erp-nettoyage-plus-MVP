import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  User,
  Camera,
  Phone,
  MapPin,
  Briefcase,
  Award,
  Languages,
  Wrench,
  ChevronRight,
  Save,
  X,
  Plus,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { profileApi, UserProfile, ProfileCompletion, UpdateProfileRequest, EmergencyContact } from '@/services/api'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

// ============================================
// Profile Completion Banner
// ============================================

function ProfileCompletionBanner({ completion }: { completion: ProfileCompletion }) {
  const { t } = useTranslation()
  
  if (completion.percentage === 100) return null
  
  const missingItems = []
  if (!completion.hasPhoto) missingItems.push(t('profile.missing.photo', 'Profile photo'))
  if (!completion.hasPhone) missingItems.push(t('profile.missing.phone', 'Phone number'))
  if (!completion.hasEmergencyContact) missingItems.push(t('profile.missing.emergency', 'Emergency contact'))
  if (!completion.hasCertifications) missingItems.push(t('profile.missing.certifications', 'Certifications'))
  
  return (
    <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            {t('profile.completeProfile', 'Complete your profile')}
          </h3>
          <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
            {t('profile.completionMessage', 'Complete your profile to receive better assignments.')}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {missingItems.map((item) => (
              <span
                key={item}
                className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200"
              >
                {item}
              </span>
            ))}
          </div>
          {/* Progress bar */}
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-yellow-200 dark:bg-yellow-800">
            <div
              className="h-full bg-yellow-500 transition-all duration-500"
              style={{ width: `${completion.percentage}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-yellow-600 dark:text-yellow-400">
            {completion.percentage}% {t('profile.complete', 'complete')}
          </p>
        </div>
      </div>
    </div>
  )
}

// ============================================
// Profile Header with Photo
// ============================================

function ProfileHeader({
  profile,
  completion,
  onPhotoChange,
}: {
  profile: UserProfile
  completion: ProfileCompletion
  onPhotoChange: () => void
}) {
  const { t } = useTranslation()
  
  const initials = `${profile.firstName?.[0] || ''}${profile.lastName?.[0] || ''}`.toUpperCase() || 'U'
  
  return (
    <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-primary-500 to-primary-700 dark:border-gray-700">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
      
      <div className="relative p-6 sm:p-8">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
          {/* Avatar */}
          <div className="relative group">
            {profile.profilePhotoUrl ? (
              <img
                src={profile.profilePhotoUrl}
                alt={profile.displayName || `${profile.firstName} ${profile.lastName}`}
                className="h-24 w-24 rounded-full border-4 border-white object-cover shadow-lg sm:h-32 sm:w-32"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-white/20 text-3xl font-bold text-white shadow-lg sm:h-32 sm:w-32 sm:text-4xl">
                {initials}
              </div>
            )}
            <button
              onClick={onPhotoChange}
              className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-700 shadow-lg transition-transform hover:scale-110 sm:h-10 sm:w-10"
            >
              <Camera className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
          
          {/* Info */}
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl font-bold text-white sm:text-3xl">
              {profile.displayName || `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || t('profile.unnamed', 'Unnamed User')}
            </h1>
            <p className="mt-1 text-primary-100">{profile.email}</p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-sm font-medium text-white">
                {profile.role}
              </span>
              {profile.employeeId && (
                <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-sm text-white">
                  ID: {profile.employeeId}
                </span>
              )}
              {completion.percentage === 100 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-500 px-3 py-1 text-sm font-medium text-white">
                  <CheckCircle2 className="h-4 w-4" />
                  {t('profile.verified', 'Verified')}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// Section Card Component
// ============================================

function SectionCard({
  title,
  icon: Icon,
  children,
  action,
}: {
  title: string
  icon: React.ElementType
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700 sm:px-6">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          <h2 className="font-semibold text-gray-900 dark:text-white">{title}</h2>
        </div>
        {action}
      </div>
      <div className="p-4 sm:p-6">{children}</div>
    </div>
  )
}

// ============================================
// Form Field Display/Edit Component
// ============================================

function FormField({
  label,
  value,
  isEditing,
  type = 'text',
  onChange,
  placeholder,
}: {
  label: string
  value?: string
  isEditing: boolean
  type?: string
  onChange?: (value: string) => void
  placeholder?: string
}) {
  if (isEditing) {
    return (
      <Input
        label={label}
        type={type}
        value={value || ''}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
      />
    )
  }
  
  return (
    <div>
      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
        {label}
      </label>
      <p className="mt-1 text-gray-900 dark:text-white">
        {value || <span className="text-gray-400 dark:text-gray-500">—</span>}
      </p>
    </div>
  )
}

// ============================================
// Main Profile Page
// ============================================

export default function ProfilePage() {
  const { t } = useTranslation()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [completion, setCompletion] = useState<ProfileCompletion | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Editing states
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [formData, setFormData] = useState<UpdateProfileRequest>({})
  
  // Load profile
  useEffect(() => {
    loadProfile()
  }, [])
  
  async function loadProfile() {
    try {
      setIsLoading(true)
      setError(null)
      const data = await profileApi.getProfile()
      setProfile(data.profile)
      setCompletion(data.completion)
    } catch (err) {
      setError(t('profile.loadError', 'Failed to load profile'))
      console.error('Failed to load profile:', err)
    } finally {
      setIsLoading(false)
    }
  }
  
  async function handleSave() {
    if (!profile) return
    
    try {
      setIsSaving(true)
      setError(null)
      const data = await profileApi.updateProfile(formData)
      setProfile(data.profile)
      setCompletion(data.completion)
      setEditingSection(null)
      setFormData({})
    } catch (err) {
      setError(t('profile.saveError', 'Failed to save changes'))
      console.error('Failed to save profile:', err)
    } finally {
      setIsSaving(false)
    }
  }
  
  function startEditing(section: string) {
    if (!profile) return
    setEditingSection(section)
    // Pre-populate form data based on section
    if (section === 'basic') {
      setFormData({
        firstName: profile.firstName,
        lastName: profile.lastName,
        displayName: profile.displayName,
        phone: profile.phone,
        secondaryPhone: profile.secondaryPhone,
        personalEmail: profile.personalEmail,
        dateOfBirth: profile.dateOfBirth,
      })
    } else if (section === 'address') {
      setFormData({
        address: profile.address,
        city: profile.city,
        region: profile.region,
        nationalId: profile.nationalId,
      })
    } else if (section === 'emergency') {
      setFormData({
        emergencyContact: profile.emergencyContact || {
          name: '',
          relationship: 'other',
          phone: '',
        },
      })
    }
  }
  
  function cancelEditing() {
    setEditingSection(null)
    setFormData({})
  }
  
  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent" />
      </div>
    )
  }
  
  if (!profile) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <p className="text-gray-600 dark:text-gray-400">{error || t('profile.notFound', 'Profile not found')}</p>
        <Button onClick={loadProfile}>{t('common.retry', 'Retry')}</Button>
      </div>
    )
  }
  
  const isEditing = (section: string) => editingSection === section
  
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Error Alert */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}
      
      {/* Completion Banner */}
      {completion && <ProfileCompletionBanner completion={completion} />}
      
      {/* Header */}
      <ProfileHeader
        profile={profile}
        completion={completion!}
        onPhotoChange={() => {
          // TODO: Implement photo upload modal
          console.log('Open photo upload')
        }}
      />
      
      {/* Basic Information */}
      <SectionCard
        title={t('profile.sections.basic', 'Basic Information')}
        icon={User}
        action={
          isEditing('basic') ? (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={cancelEditing}>
                <X className="h-4 w-4 mr-1" /> {t('common.cancel', 'Cancel')}
              </Button>
              <Button size="sm" onClick={handleSave} isLoading={isSaving}>
                <Save className="h-4 w-4 mr-1" /> {t('common.save', 'Save')}
              </Button>
            </div>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => startEditing('basic')}>
              {t('common.edit', 'Edit')}
            </Button>
          )
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label={t('profile.fields.firstName', 'First Name')}
            value={isEditing('basic') ? formData.firstName : profile.firstName}
            isEditing={isEditing('basic')}
            onChange={(v) => setFormData({ ...formData, firstName: v })}
          />
          <FormField
            label={t('profile.fields.lastName', 'Last Name')}
            value={isEditing('basic') ? formData.lastName : profile.lastName}
            isEditing={isEditing('basic')}
            onChange={(v) => setFormData({ ...formData, lastName: v })}
          />
          <FormField
            label={t('profile.fields.displayName', 'Display Name')}
            value={isEditing('basic') ? formData.displayName : profile.displayName}
            isEditing={isEditing('basic')}
            onChange={(v) => setFormData({ ...formData, displayName: v })}
            placeholder={t('profile.placeholders.displayName', 'How your name appears in the app')}
          />
          <FormField
            label={t('profile.fields.phone', 'Phone')}
            value={isEditing('basic') ? formData.phone : profile.phone}
            isEditing={isEditing('basic')}
            type="tel"
            onChange={(v) => setFormData({ ...formData, phone: v })}
          />
          <FormField
            label={t('profile.fields.secondaryPhone', 'Secondary Phone')}
            value={isEditing('basic') ? formData.secondaryPhone : profile.secondaryPhone}
            isEditing={isEditing('basic')}
            type="tel"
            onChange={(v) => setFormData({ ...formData, secondaryPhone: v })}
          />
          <FormField
            label={t('profile.fields.personalEmail', 'Personal Email')}
            value={isEditing('basic') ? formData.personalEmail : profile.personalEmail}
            isEditing={isEditing('basic')}
            type="email"
            onChange={(v) => setFormData({ ...formData, personalEmail: v })}
          />
          <FormField
            label={t('profile.fields.dateOfBirth', 'Date of Birth')}
            value={isEditing('basic') ? formData.dateOfBirth : profile.dateOfBirth}
            isEditing={isEditing('basic')}
            type="date"
            onChange={(v) => setFormData({ ...formData, dateOfBirth: v })}
          />
        </div>
      </SectionCard>
      
      {/* Address */}
      <SectionCard
        title={t('profile.sections.address', 'Address')}
        icon={MapPin}
        action={
          isEditing('address') ? (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={cancelEditing}>
                <X className="h-4 w-4 mr-1" /> {t('common.cancel', 'Cancel')}
              </Button>
              <Button size="sm" onClick={handleSave} isLoading={isSaving}>
                <Save className="h-4 w-4 mr-1" /> {t('common.save', 'Save')}
              </Button>
            </div>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => startEditing('address')}>
              {t('common.edit', 'Edit')}
            </Button>
          )
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <FormField
              label={t('profile.fields.address', 'Street Address')}
              value={isEditing('address') ? formData.address : profile.address}
              isEditing={isEditing('address')}
              onChange={(v) => setFormData({ ...formData, address: v })}
            />
          </div>
          <FormField
            label={t('profile.fields.city', 'City')}
            value={isEditing('address') ? formData.city : profile.city}
            isEditing={isEditing('address')}
            onChange={(v) => setFormData({ ...formData, city: v })}
          />
          <FormField
            label={t('profile.fields.region', 'Region')}
            value={isEditing('address') ? formData.region : profile.region}
            isEditing={isEditing('address')}
            onChange={(v) => setFormData({ ...formData, region: v })}
          />
          <FormField
            label={t('profile.fields.nationalId', 'National ID / Passport')}
            value={isEditing('address') ? formData.nationalId : profile.nationalId}
            isEditing={isEditing('address')}
            onChange={(v) => setFormData({ ...formData, nationalId: v })}
          />
        </div>
      </SectionCard>
      
      {/* Emergency Contact */}
      <SectionCard
        title={t('profile.sections.emergency', 'Emergency Contact')}
        icon={Phone}
        action={
          isEditing('emergency') ? (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={cancelEditing}>
                <X className="h-4 w-4 mr-1" /> {t('common.cancel', 'Cancel')}
              </Button>
              <Button size="sm" onClick={handleSave} isLoading={isSaving}>
                <Save className="h-4 w-4 mr-1" /> {t('common.save', 'Save')}
              </Button>
            </div>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => startEditing('emergency')}>
              {t('common.edit', 'Edit')}
            </Button>
          )
        }
      >
        {profile.emergencyContact || isEditing('emergency') ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label={t('profile.fields.contactName', 'Contact Name')}
              value={isEditing('emergency') ? formData.emergencyContact?.name : profile.emergencyContact?.name}
              isEditing={isEditing('emergency')}
              onChange={(v) => setFormData({
                ...formData,
                emergencyContact: { ...formData.emergencyContact!, name: v },
              })}
            />
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                {t('profile.fields.relationship', 'Relationship')}
              </label>
              {isEditing('emergency') ? (
                <select
                  value={formData.emergencyContact?.relationship || 'other'}
                  onChange={(e) => setFormData({
                    ...formData,
                    emergencyContact: {
                      ...formData.emergencyContact!,
                      relationship: e.target.value as EmergencyContact['relationship'],
                    },
                  })}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="spouse">{t('profile.relationships.spouse', 'Spouse')}</option>
                  <option value="parent">{t('profile.relationships.parent', 'Parent')}</option>
                  <option value="sibling">{t('profile.relationships.sibling', 'Sibling')}</option>
                  <option value="friend">{t('profile.relationships.friend', 'Friend')}</option>
                  <option value="other">{t('profile.relationships.other', 'Other')}</option>
                </select>
              ) : (
                <p className="mt-1 text-gray-900 capitalize dark:text-white">
                  {profile.emergencyContact?.relationship || '—'}
                </p>
              )}
            </div>
            <FormField
              label={t('profile.fields.contactPhone', 'Phone')}
              value={isEditing('emergency') ? formData.emergencyContact?.phone : profile.emergencyContact?.phone}
              isEditing={isEditing('emergency')}
              type="tel"
              onChange={(v) => setFormData({
                ...formData,
                emergencyContact: { ...formData.emergencyContact!, phone: v },
              })}
            />
            <FormField
              label={t('profile.fields.secondaryPhone', 'Secondary Phone')}
              value={isEditing('emergency') ? formData.emergencyContact?.secondaryPhone : profile.emergencyContact?.secondaryPhone}
              isEditing={isEditing('emergency')}
              type="tel"
              onChange={(v) => setFormData({
                ...formData,
                emergencyContact: { ...formData.emergencyContact!, secondaryPhone: v },
              })}
            />
            <div className="sm:col-span-2">
              <FormField
                label={t('profile.fields.notes', 'Notes')}
                value={isEditing('emergency') ? formData.emergencyContact?.notes : profile.emergencyContact?.notes}
                isEditing={isEditing('emergency')}
                onChange={(v) => setFormData({
                  ...formData,
                  emergencyContact: { ...formData.emergencyContact!, notes: v },
                })}
                placeholder={t('profile.placeholders.notes', 'e.g., Call after 6pm')}
              />
            </div>
          </div>
        ) : (
          <div className="py-8 text-center">
            <Phone className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              {t('profile.noEmergencyContact', 'No emergency contact added')}
            </p>
            <Button variant="secondary" className="mt-4" onClick={() => startEditing('emergency')}>
              <Plus className="h-4 w-4 mr-2" />
              {t('profile.addEmergencyContact', 'Add Emergency Contact')}
            </Button>
          </div>
        )}
      </SectionCard>
      
      {/* Employment Details (Read-only for most users) */}
      <SectionCard title={t('profile.sections.employment', 'Employment Details')} icon={Briefcase}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
              {t('profile.fields.employeeId', 'Employee ID')}
            </label>
            <p className="mt-1 text-gray-900 dark:text-white">{profile.employeeId || '—'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
              {t('profile.fields.role', 'Role')}
            </label>
            <p className="mt-1 text-gray-900 dark:text-white">{profile.role}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
              {t('profile.fields.hireDate', 'Hire Date')}
            </label>
            <p className="mt-1 text-gray-900 dark:text-white">
              {profile.hireDate ? new Date(profile.hireDate).toLocaleDateString() : '—'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
              {t('profile.fields.contractType', 'Contract Type')}
            </label>
            <p className="mt-1 text-gray-900 dark:text-white">{profile.contractType || '—'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
              {t('profile.fields.status', 'Status')}
            </label>
            <span className={cn(
              'mt-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
              profile.status === 'ACTIVE'
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
            )}>
              {profile.status}
            </span>
          </div>
        </div>
      </SectionCard>
      
      {/* Certifications */}
      <SectionCard
        title={t('profile.sections.certifications', 'Certifications')}
        icon={Award}
        action={
          <Button variant="ghost" size="sm">
            <Plus className="h-4 w-4 mr-1" /> {t('common.add', 'Add')}
          </Button>
        }
      >
        {profile.certifications && profile.certifications.length > 0 ? (
          <div className="space-y-3">
            {profile.certifications.map((cert) => (
              <div
                key={cert.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full',
                    cert.status === 'valid'
                      ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                      : cert.status === 'expiring_soon'
                      ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'
                      : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                  )}>
                    <Award className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{cert.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {cert.issuingAuthority} • {cert.expiryDate ? `Expires ${new Date(cert.expiryDate).toLocaleDateString()}` : 'No expiry'}
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <Award className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              {t('profile.noCertifications', 'No certifications added')}
            </p>
          </div>
        )}
      </SectionCard>
      
      {/* Languages */}
      <SectionCard
        title={t('profile.sections.languages', 'Languages')}
        icon={Languages}
        action={
          <Button variant="ghost" size="sm">
            <Plus className="h-4 w-4 mr-1" /> {t('common.add', 'Add')}
          </Button>
        }
      >
        {profile.languages && profile.languages.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {profile.languages.map((lang, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800"
              >
                <span className="font-medium text-gray-900 dark:text-white">{lang.language}</span>
                <span className="text-gray-500 dark:text-gray-400">({lang.proficiency})</span>
              </span>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <Languages className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              {t('profile.noLanguages', 'No languages added')}
            </p>
          </div>
        )}
      </SectionCard>
      
      {/* Equipment Competencies */}
      <SectionCard
        title={t('profile.sections.equipment', 'Equipment Competencies')}
        icon={Wrench}
        action={
          <Button variant="ghost" size="sm">
            <Plus className="h-4 w-4 mr-1" /> {t('common.add', 'Add')}
          </Button>
        }
      >
        {profile.equipmentCompetencies && profile.equipmentCompetencies.length > 0 ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {profile.equipmentCompetencies.map((equip, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700"
              >
                <div className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full',
                  equip.certified
                    ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                )}>
                  {equip.certified ? <CheckCircle2 className="h-4 w-4" /> : <Wrench className="h-4 w-4" />}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{equip.equipment}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {equip.certified ? t('profile.certified', 'Certified') : t('profile.notCertified', 'Not Certified')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <Wrench className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              {t('profile.noEquipment', 'No equipment competencies added')}
            </p>
          </div>
        )}
      </SectionCard>
    </div>
  )
}
