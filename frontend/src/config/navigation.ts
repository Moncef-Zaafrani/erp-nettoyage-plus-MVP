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
  Package,
  Receipt,
  BarChart3,
  MessageSquare,
  FileWarning,
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
            { id: 'users-admins', label: 'Admins', labelKey: 'nav.users.admins', icon: Shield, href: '/users/admins' },
            { id: 'users-supervisors', label: 'Supervisors', labelKey: 'nav.users.supervisors', icon: UserCog, href: '/users/supervisors' },
            { id: 'users-agents', label: 'Agents', labelKey: 'nav.users.agents', icon: UserCheck, href: '/users/agents' },
            { id: 'users-client-accounts', label: 'Client Accounts', labelKey: 'nav.users.clientAccounts', icon: User, href: '/users/clients' },
            { id: 'users-roles', label: 'Custom Roles', labelKey: 'nav.users.roles', icon: Shield, href: '/users/roles', wip: true, wipPhase: 2 },
          ],
        },
        {
          id: 'clients',
          label: 'Clients',
          labelKey: 'nav.clients',
          icon: Building2,
          href: '/clients',
        },
        {
          id: 'contracts',
          label: 'Contracts',
          labelKey: 'nav.contracts',
          icon: FileText,
          href: '/contracts',
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
          id: 'planning',
          label: 'Planning',
          labelKey: 'nav.planning',
          icon: Calendar,
          href: '/planning',
        },
        {
          id: 'personnel',
          label: 'Personnel',
          labelKey: 'nav.personnel',
          icon: UsersRound,
          href: '/personnel',
        },
        {
          id: 'quality',
          label: 'Quality Control',
          labelKey: 'nav.quality',
          icon: ClipboardList,
          href: '/quality',
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
        },
        {
          id: 'audit',
          label: 'Audit Logs',
          labelKey: 'nav.audit',
          icon: ClipboardList,
          href: '/audit',
        },
        {
          id: 'settings',
          label: 'Settings',
          labelKey: 'nav.settings',
          icon: Settings,
          href: '/settings',
        },
      ],
    },
    {
      id: 'future',
      title: 'Coming Soon',
      titleKey: 'nav.section.future',
      items: [
        {
          id: 'stock',
          label: 'Stock & Materials',
          labelKey: 'nav.stock',
          icon: Package,
          href: '/stock',
          wip: true,
          wipPhase: 2,
        },
        {
          id: 'billing',
          label: 'Billing',
          labelKey: 'nav.billing',
          icon: Receipt,
          href: '/billing',
          wip: true,
          wipPhase: 2,
        },
        {
          id: 'reports',
          label: 'Reports',
          labelKey: 'nav.reports',
          icon: BarChart3,
          href: '/reports',
          wip: true,
          wipPhase: 2,
        },
      ],
    },
  ]
}

function getAdminNav(): NavSection[] {
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
            { id: 'users-client-accounts', label: 'Client Accounts', labelKey: 'nav.users.clientAccounts', icon: User, href: '/users/clients' },
          ],
        },
        {
          id: 'clients',
          label: 'Clients',
          labelKey: 'nav.clients',
          icon: Building2,
          href: '/clients',
        },
        {
          id: 'contracts',
          label: 'Contracts',
          labelKey: 'nav.contracts',
          icon: FileText,
          href: '/contracts',
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
          id: 'planning',
          label: 'Planning',
          labelKey: 'nav.planning',
          icon: Calendar,
          href: '/planning',
        },
        {
          id: 'personnel',
          label: 'Personnel',
          labelKey: 'nav.personnel',
          icon: UsersRound,
          href: '/personnel',
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
        },
        {
          id: 'settings',
          label: 'Settings',
          labelKey: 'nav.settings',
          icon: Settings,
          href: '/settings',
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
          id: 'notifications',
          label: 'Notifications',
          labelKey: 'nav.notifications',
          icon: Bell,
          href: '/notifications',
        },
        {
          id: 'settings',
          label: 'Settings',
          labelKey: 'nav.settings',
          icon: Settings,
          href: '/settings',
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
        {
          id: 'notifications',
          label: 'Notifications',
          labelKey: 'nav.notifications',
          icon: Bell,
          href: '/notifications',
        },
        {
          id: 'settings',
          label: 'Settings',
          labelKey: 'nav.settings',
          icon: Settings,
          href: '/settings',
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
        },
        {
          id: 'settings',
          label: 'Settings',
          labelKey: 'nav.settings',
          icon: Settings,
          href: '/settings',
        },
      ],
    },
  ]
}
