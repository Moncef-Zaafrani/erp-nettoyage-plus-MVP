import { UserRole } from '@/contexts/AuthContext'
import {
  LayoutDashboard,
  Users,
  UserCog,
  UserCheck,
  User,
  Building2,
  FileText,
  MapPin,
  Calendar,
  UsersRound,
  Bell,
  Settings,
  ClipboardList,
  Shield,
  Briefcase,
  Clock,
  Receipt,
  MessageSquare,
  FileWarning,
  CalendarDays,
  LucideIcon,
} from 'lucide-react'

export interface NavItem {
  id: string
  label: string
  labelKey: string // i18n key
  icon: LucideIcon
  href?: string
  badge?: number | string
  badgeColor?: 'default' | 'warning' | 'error' | 'success'
  wip?: boolean // Work in progress - greyed out
  wipPhase?: number
  children?: NavItem[]
}

export interface NavSection {
  id: string
  title?: string // Optional section title
  titleKey?: string // i18n key for title
  items: NavItem[]
}

// Navigation configuration per role
export const getNavigationConfig = (role: UserRole): NavSection[] => {
  switch (role) {
    case 'SUPER_ADMIN':
      return getSuperAdminNav()
    case 'ADMIN':
      return getAdminNav()
    case 'SUPERVISOR':
      return getSupervisorNav()
    case 'AGENT':
      return getAgentNav()
    case 'CLIENT':
      return getClientNav()
    default:
      return []
  }
}

function getSuperAdminNav(): NavSection[] {
  return [
    {
      id: 'principal',
      title: 'Principal',
      titleKey: 'nav.section.principal',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          labelKey: 'nav.dashboard',
          icon: LayoutDashboard,
          href: '/dashboard',
        },
      ],
    },
    {
      id: 'management',
      title: 'Management',
      titleKey: 'nav.section.management',
      items: [
        {
          id: 'users',
          label: 'Users',
          labelKey: 'nav.users',
          icon: Users,
          children: [
            { id: 'users-all', label: 'All Users', labelKey: 'nav.users.all', icon: Users, href: '/users' },
            { id: 'users-admins', label: 'Admins', labelKey: 'nav.users.admins', icon: Shield, href: '/users/admins' },
            { id: 'users-managers', label: 'Managers', labelKey: 'nav.users.supervisors', icon: UserCog, href: '/users/supervisors' },
            { id: 'users-agents', label: 'Agents', labelKey: 'nav.users.agents', icon: UserCheck, href: '/users/agents' },
          ],
        },
        {
          id: 'clients',
          label: 'Clients',
          labelKey: 'nav.clients',
          icon: Building2,
          children: [
            { id: 'clients-all', label: 'All Clients', labelKey: 'nav.clients.all', icon: Building2, href: '/clients' },
            { id: 'clients-companies', label: 'Companies', labelKey: 'nav.clients.companies', icon: Building2, href: '/clients/companies' },
            { id: 'clients-individuals', label: 'Individuals', labelKey: 'nav.clients.individuals', icon: User, href: '/clients/individuals' },
          ],
        },
        {
          id: 'contracts',
          label: 'Contracts',
          labelKey: 'nav.contracts',
          icon: FileText,
          children: [
            { id: 'contracts-all', label: 'All Contracts', labelKey: 'nav.contracts.all', icon: FileText, href: '/contracts' },
            { id: 'contracts-permanent', label: 'Permanent', labelKey: 'nav.contracts.permanent', icon: FileText, href: '/contracts/permanent' },
            { id: 'contracts-punctual', label: 'One-time', labelKey: 'nav.contracts.punctual', icon: FileText, href: '/contracts/punctual' },
          ],
        },
        {
          id: 'sites',
          label: 'Sites',
          labelKey: 'nav.sites',
          icon: MapPin,
          href: '/sites',
        },
      ],
    },
    {
      id: 'operations',
      title: 'Operations',
      titleKey: 'nav.section.operations',
      items: [
        {
          id: 'interventions',
          label: 'Interventions',
          labelKey: 'nav.interventions',
          icon: Calendar,
          children: [
            { id: 'interventions-list', label: 'List', labelKey: 'nav.interventions.list', icon: ClipboardList, href: '/interventions' },
            { id: 'interventions-planning', label: 'Planning', labelKey: 'nav.interventions.planning', icon: Calendar, href: '/planning' },
            { id: 'interventions-calendar', label: 'Calendar', labelKey: 'nav.interventions.calendar', icon: Calendar, href: '/interventions/calendar', wip: true, wipPhase: 2 },
          ],
        },
        {
          id: 'personnel',
          label: 'Personnel',
          labelKey: 'nav.personnel',
          icon: UsersRound,
          children: [
            { id: 'personnel-absences', label: 'Absences', labelKey: 'nav.personnel.absences', icon: Calendar, href: '/personnel/absences' },
            { id: 'personnel-attendance', label: 'Attendance', labelKey: 'nav.personnel.attendance', icon: Clock, href: '/personnel/attendance', wip: true, wipPhase: 2 },
          ],
        },
        {
          id: 'zones',
          label: 'Zones',
          labelKey: 'nav.zones',
          icon: MapPin,
          href: '/zones',
          wip: true,
          wipPhase: 2,
        },
      ],
    },
    {
      id: 'system',
      title: 'System',
      titleKey: 'nav.section.system',
      items: [
        {
          id: 'notifications',
          label: 'Notifications',
          labelKey: 'nav.notifications',
          icon: Bell,
          href: '/notifications',
          wip: true,
          wipPhase: 2,
        },
        {
          id: 'reports',
          label: 'Reports',
          labelKey: 'nav.issueReports',
          icon: FileWarning,
          href: '/reports',
        },
      ],
    },
  ]
}

function getAdminNav(): NavSection[] {
  return [
    {
      id: 'principal',
      title: 'Principal',
      titleKey: 'nav.section.principal',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          labelKey: 'nav.dashboard',
          icon: LayoutDashboard,
          href: '/dashboard',
        },
      ],
    },
    {
      id: 'management',
      title: 'Management',
      titleKey: 'nav.section.management',
      items: [
        {
          id: 'users',
          label: 'Users',
          labelKey: 'nav.users',
          icon: Users,
          children: [
            { id: 'users-supervisors', label: 'Supervisors', labelKey: 'nav.users.supervisors', icon: UserCog, href: '/users/supervisors' },
            { id: 'users-agents', label: 'Agents', labelKey: 'nav.users.agents', icon: UserCheck, href: '/users/agents' },
          ],
        },
        {
          id: 'clients',
          label: 'Clients',
          labelKey: 'nav.clients',
          icon: Building2,
          children: [
            { id: 'clients-all', label: 'All Clients', labelKey: 'nav.clients.all', icon: Building2, href: '/clients' },
            { id: 'clients-companies', label: 'Companies', labelKey: 'nav.clients.companies', icon: Building2, href: '/clients/companies' },
            { id: 'clients-individuals', label: 'Individuals', labelKey: 'nav.clients.individuals', icon: User, href: '/clients/individuals' },
          ],
        },
        {
          id: 'contracts',
          label: 'Contracts',
          labelKey: 'nav.contracts',
          icon: FileText,
          children: [
            { id: 'contracts-all', label: 'All Contracts', labelKey: 'nav.contracts.all', icon: FileText, href: '/contracts' },
            { id: 'contracts-permanent', label: 'Permanent', labelKey: 'nav.contracts.permanent', icon: FileText, href: '/contracts/permanent' },
            { id: 'contracts-punctual', label: 'One-time', labelKey: 'nav.contracts.punctual', icon: FileText, href: '/contracts/punctual' },
          ],
        },
        {
          id: 'sites',
          label: 'Sites',
          labelKey: 'nav.sites',
          icon: MapPin,
          href: '/sites',
        },
      ],
    },
    {
      id: 'operations',
      title: 'Operations',
      titleKey: 'nav.section.operations',
      items: [
        {
          id: 'interventions',
          label: 'Interventions',
          labelKey: 'nav.interventions',
          icon: Calendar,
          children: [
            { id: 'interventions-list', label: 'List', labelKey: 'nav.interventions.list', icon: ClipboardList, href: '/interventions' },
            { id: 'interventions-planning', label: 'Planning', labelKey: 'nav.interventions.planning', icon: Calendar, href: '/planning' },
          ],
        },
        {
          id: 'personnel',
          label: 'Personnel',
          labelKey: 'nav.personnel',
          icon: UsersRound,
          children: [
            { id: 'personnel-absences', label: 'Absences', labelKey: 'nav.personnel.absences', icon: Calendar, href: '/personnel/absences' },
            { id: 'personnel-attendance', label: 'Attendance', labelKey: 'nav.personnel.attendance', icon: Clock, href: '/personnel/attendance', wip: true, wipPhase: 2 },
          ],
        },
        {
          id: 'zones',
          label: 'Zones',
          labelKey: 'nav.zones',
          icon: MapPin,
          href: '/zones',
          wip: true,
          wipPhase: 2,
        },
      ],
    },
    {
      id: 'system',
      title: 'System',
      titleKey: 'nav.section.system',
      items: [
        {
          id: 'notifications',
          label: 'Notifications',
          labelKey: 'nav.notifications',
          icon: Bell,
          href: '/notifications',
          wip: true,
          wipPhase: 2,
        },
        {
          id: 'reports',
          label: 'Reports',
          labelKey: 'nav.issueReports',
          icon: FileWarning,
          href: '/reports',
        },
      ],
    },
  ]
}

function getSupervisorNav(): NavSection[] {
  return [
    {
      id: 'main',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          labelKey: 'nav.dashboard',
          icon: LayoutDashboard,
          href: '/dashboard',
        },
      ],
    },
    {
      id: 'team',
      title: 'My Team',
      titleKey: 'nav.section.myTeam',
      items: [
        {
          id: 'my-agents',
          label: 'Your Agents',
          labelKey: 'nav.myAgents',
          icon: UsersRound,
          href: '/my-agents',
        },
        {
          id: 'sites',
          label: 'Sites',
          labelKey: 'nav.sites',
          icon: MapPin,
          href: '/sites',
        },
        {
          id: 'planning',
          label: 'Planning',
          labelKey: 'nav.planning',
          icon: Calendar,
          href: '/planning',
        },
      ],
    },
    {
      id: 'system',
      items: [
        {
          id: 'reports',
          label: 'Reports',
          labelKey: 'nav.issueReports',
          icon: ClipboardList,
          href: '/reports',
        },
        {
          id: 'notifications',
          label: 'Notifications',
          labelKey: 'nav.notifications',
          icon: Bell,
          href: '/notifications',
          wip: true,
          wipPhase: 2,
        },
      ],
    },
  ]
}

function getAgentNav(): NavSection[] {
  return [
    {
      id: 'main',
      items: [
        {
          id: 'my-missions',
          label: 'My Missions',
          labelKey: 'nav.myMissions',
          icon: Briefcase,
          href: '/my-missions',
        },
        {
          id: 'my-schedule',
          label: 'My Schedule',
          labelKey: 'nav.mySchedule',
          icon: Clock,
          href: '/my-schedule',
        },
        {
          id: 'request-leave',
          label: 'Request Leave',
          labelKey: 'nav.requestLeave',
          icon: CalendarDays,
          href: '/absence-request',
        },
      ],
    },
    {
      id: 'personal',
      title: 'Personal',
      titleKey: 'nav.section.personal',
      items: [
        {
          id: 'my-profile',
          label: 'My Profile',
          labelKey: 'nav.myProfile',
          icon: User,
          href: '/profile',
        },
      ],
    },
  ]
}

function getClientNav(): NavSection[] {
  return [
    {
      id: 'main',
      items: [
        {
          id: 'my-contracts',
          label: 'My Contracts',
          labelKey: 'nav.myContracts',
          icon: FileText,
          href: '/my-contracts',
        },
        {
          id: 'my-sites',
          label: 'My Sites',
          labelKey: 'nav.mySites',
          icon: MapPin,
          href: '/my-sites',
        },
      ],
    },
    {
      id: 'billing',
      title: 'Billing',
      titleKey: 'nav.section.billing',
      items: [
        {
          id: 'invoices',
          label: 'Invoices',
          labelKey: 'nav.invoices',
          icon: Receipt,
          href: '/invoices',
          wip: true,
          wipPhase: 2,
        },
      ],
    },
    {
      id: 'support',
      title: 'Support',
      titleKey: 'nav.section.support',
      items: [
        {
          id: 'feedback',
          label: 'Feedback',
          labelKey: 'nav.feedback',
          icon: MessageSquare,
          href: '/feedback',
          wip: true,
          wipPhase: 2,
        },
        {
          id: 'complaints',
          label: 'Complaints',
          labelKey: 'nav.complaints',
          icon: FileWarning,
          href: '/complaints',
          wip: true,
          wipPhase: 2,
        },
      ],
    },
    {
      id: 'system',
      items: [
        {
          id: 'notifications',
          label: 'Notifications',
          labelKey: 'nav.notifications',
          icon: Bell,
          href: '/notifications',
          wip: true,
          wipPhase: 2,
        },
      ],
    },
  ]
}
