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
  AlertCircle,
  CheckCircle2,
  Construction,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'

// ============================================
// Profile Header Component
// ============================================

function ProfileHeader({
  user,
}: {
  user: {
    firstName: string
    lastName: string
    email: string
    role: string
    profilePhotoUrl?: string | null
  }
}) {
  const { t } = useTranslation()
  
  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || '?'
  const displayName = `${user.firstName} ${user.lastName}`.trim() || t('profile.unnamed', 'Unnamed User')
  
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        {/* Avatar */}
        <div className="relative">
          {user.profilePhotoUrl ? (
            <img
              src={user.profilePhotoUrl}
              alt={displayName}
              className="h-24 w-24 rounded-full object-cover ring-4 ring-white dark:ring-gray-800"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-2xl font-bold text-white ring-4 ring-white dark:ring-gray-800">
              {initials}
            </div>
          )}
          <button
            className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200 dark:border-gray-800 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 opacity-50 cursor-not-allowed"
            title={t('profile.photoChangeComingSoon', 'Coming soon')}
          >
            <Camera className="h-4 w-4" />
          </button>
        </div>
        
        {/* Info */}
        <div className="flex-1 text-center sm:text-left">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {displayName}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">{user.email}</p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <span className="rounded-full bg-primary-100 px-3 py-1 text-sm font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
              {t(`role.${user.role}`, user.role)}
            </span>
            <span className="flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm text-green-700 dark:bg-green-900/30 dark:text-green-300">
              <CheckCircle2 className="h-3 w-3" />
              {t('profile.verified', 'Verified')}
            </span>
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
  isWip,
}: {
  title: string
  icon: React.ElementType
  children: React.ReactNode
  isWip?: boolean
}) {
  const { t } = useTranslation()
  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700 sm:px-6">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          <h2 className="font-semibold text-gray-900 dark:text-white">{title}</h2>
          {isWip && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              <Construction className="h-3 w-3" />
              {t('common.comingSoon', 'Coming Soon')}
            </span>
          )}
        </div>
      </div>
      <div className={cn('p-4 sm:p-6', isWip && 'opacity-50')}>{children}</div>
    </div>
  )
}

// ============================================
// Display Field Component
// ============================================

function DisplayField({
  label,
  value,
}: {
  label: string
  value?: string | null
}) {
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
  const { user } = useAuth()
  
  if (!user) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <p className="text-gray-600 dark:text-gray-400">{t('profile.notFound', 'Profile not found')}</p>
      </div>
    )
  }
  
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* WIP Banner */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
        <div className="flex items-center gap-3">
          <Construction className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="font-medium text-amber-800 dark:text-amber-200">{t('profile.editComingSoon', 'Profile editing is coming soon')}</p>
            <p className="text-sm text-amber-600 dark:text-amber-400">{t('profile.editComingSoonDesc', 'You can view your profile information below. Editing features will be available in a future update.')}</p>
          </div>
        </div>
      </div>
      
      {/* Header */}
      <ProfileHeader user={user} />
      
      {/* Basic Information */}
      <SectionCard
        title={t('profile.sections.basic', 'Basic Information')}
        icon={User}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <DisplayField
            label={t('profile.fields.firstName', 'First Name')}
            value={user.firstName}
          />
          <DisplayField
            label={t('profile.fields.lastName', 'Last Name')}
            value={user.lastName}
          />
          <DisplayField
            label={t('profile.fields.displayName', 'Display Name')}
            value={`${user.firstName} ${user.lastName}`}
          />
          <DisplayField
            label={t('profile.fields.phone', 'Phone')}
            value={user.phone}
          />
          <div className="sm:col-span-2">
            <DisplayField
              label={t('profile.fields.email', 'Email')}
              value={user.email}
            />
          </div>
        </div>
      </SectionCard>
      
      {/* Address */}
      <SectionCard
        title={t('profile.sections.address', 'Address')}
        icon={MapPin}
        isWip
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <DisplayField label={t('profile.fields.address', 'Street Address')} value={null} />
          <DisplayField label={t('profile.fields.city', 'City')} value={null} />
          <DisplayField label={t('profile.fields.region', 'Region')} value={null} />
          <DisplayField label={t('profile.fields.nationalId', 'National ID / Passport')} value={null} />
        </div>
      </SectionCard>
      
      {/* Emergency Contact */}
      <SectionCard
        title={t('profile.sections.emergency', 'Emergency Contact')}
        icon={Phone}
        isWip
      >
        <div className="py-8 text-center">
          <Phone className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            {t('profile.noEmergencyContact', 'No emergency contact added')}
          </p>
        </div>
      </SectionCard>
      
      {/* Employment Details */}
      <SectionCard 
        title={t('profile.sections.employment', 'Employment Details')} 
        icon={Briefcase}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <DisplayField
            label={t('profile.fields.employeeId', 'Employee ID')}
            value={`EMP-${user.id.slice(0, 6).toUpperCase()}`}
          />
          <DisplayField
            label={t('profile.fields.role', 'Role')}
            value={t(`role.${user.role}`, user.role)}
          />
          <DisplayField
            label={t('profile.fields.status', 'Status')}
            value={user.status}
          />
          <DisplayField
            label={t('profile.fields.contractType', 'Contract Type')}
            value="CDI"
          />
        </div>
      </SectionCard>
      
      {/* Certifications */}
      <SectionCard
        title={t('profile.sections.certifications', 'Certifications')}
        icon={Award}
        isWip
      >
        <div className="py-8 text-center">
          <Award className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            {t('profile.noCertifications', 'No certifications added')}
          </p>
        </div>
      </SectionCard>
      
      {/* Languages */}
      <SectionCard
        title={t('profile.sections.languages', 'Languages')}
        icon={Languages}
        isWip
      >
        <div className="py-8 text-center">
          <Languages className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            {t('profile.noLanguages', 'No languages added')}
          </p>
        </div>
      </SectionCard>
      
      {/* Equipment Competencies */}
      <SectionCard
        title={t('profile.sections.equipment', 'Equipment Competencies')}
        icon={Wrench}
        isWip
      >
        <div className="py-8 text-center">
          <Wrench className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            {t('profile.noEquipment', 'No equipment competencies added')}
          </p>
        </div>
      </SectionCard>
    </div>
  )
}
