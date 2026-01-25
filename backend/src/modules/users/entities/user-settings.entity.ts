import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

// ============================================
// Settings JSON Types
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
  | 'nettoyage-brand';

export interface AppearanceSettings {
  theme: ThemeType;
  sidebarCollapsed: boolean;
  sidebarPosition: 'left' | 'right';
  animationsEnabled: boolean;
  fontSize: 'small' | 'medium' | 'large';
  compactMode: boolean;
}

export interface NotificationSettings {
  inAppEnabled: boolean;
  soundEnabled: boolean;
  desktopEnabled: boolean;
  emailDigest: 'instant' | 'daily' | 'weekly' | 'none';
  emailCategories: {
    newMissions: boolean;
    missionChanges: boolean;
    scheduleReminders: boolean;
    qualityResults: boolean;
    absenceUpdates: boolean;
    systemAnnouncements: boolean;
    weeklyPerformance: boolean;
  };
  pushEnabled: boolean;
  quietHours: {
    enabled: boolean;
    start: string; // "22:00"
    end: string;   // "07:00"
  };
}

export interface TableSettings {
  defaultRowsPerPage: 10 | 25 | 50 | 100;
  compactRows: boolean;
  showRowNumbers: boolean;
  stickyHeader: boolean;
  columnPreferences: Record<string, string[]>; // tableName -> visible columns
  sortPreferences: Record<string, { field: string; direction: 'asc' | 'desc' }>;
}

export interface CalendarSettings {
  defaultView: 'day' | 'week' | 'month';
  weekStartsOn: 'sunday' | 'monday';
  showWeekends: boolean;
  timeFormat: '12h' | '24h';
  showCompleted: boolean;
}

export interface MapSettings {
  defaultView: 'satellite' | 'street' | 'hybrid';
  showAgentLocations: boolean;
  showTraffic: boolean;
  clusterSites: boolean;
}

export interface GpsSettings {
  enabled: boolean;
  accuracy: 'high' | 'balanced' | 'low';
}

export interface PhotoSettings {
  defaultCamera: 'front' | 'back';
  quality: 'low' | 'medium' | 'high' | 'original';
  autoCompress: boolean;
  timestampOverlay: boolean;
  locationOverlay: boolean;
}

export interface OfflineSettings {
  enabled: boolean;
  autoSync: boolean;
  maxStorageMb: 50 | 100 | 500;
}

export interface MissionSettings {
  showNotesFirst: boolean;
  expandChecklists: boolean;
  defaultSort: 'time' | 'site' | 'priority';
}

export interface ShiftSettings {
  reminderBefore: 30 | 60 | 120 | 0; // minutes, 0 = none
  missedClockInReminder: 15 | 30 | 0;
  endShiftReminder: 15 | 30 | 0;
  autoClockOutHours: number;
  notifySupervisorAutoClockOut: boolean;
  defaultBreakMinutes: 30 | 60;
  breakReminderHours: 4 | 5 | 0;
}

export interface HelpSettings {
  showEmptyStateTips: boolean;
  showFeatureTutorials: boolean;
}

@Entity('user_settings')
export class UserSettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  userId: string;

  @OneToOne(() => User, (user) => user.settings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  // ============================================
  // Appearance
  // ============================================

  @Column({ type: 'jsonb', default: {} })
  appearance: AppearanceSettings;

  // ============================================
  // Notifications
  // ============================================

  @Column({ type: 'jsonb', default: {} })
  notifications: NotificationSettings;

  // ============================================
  // Table & Data Display
  // ============================================

  @Column({ type: 'jsonb', default: {} })
  tables: TableSettings;

  @Column({ type: 'jsonb', default: {} })
  calendar: CalendarSettings;

  @Column({ type: 'jsonb', default: {} })
  map: MapSettings;

  // ============================================
  // GPS & Location (Agents)
  // ============================================

  @Column({ type: 'jsonb', default: {} })
  gps: GpsSettings;

  // ============================================
  // Photo & Upload (Agents)
  // ============================================

  @Column({ type: 'jsonb', default: {} })
  photo: PhotoSettings;

  @Column({ type: 'jsonb', default: {} })
  offline: OfflineSettings;

  @Column({ type: 'jsonb', default: {} })
  mission: MissionSettings;

  // ============================================
  // Shift & Clock (Agents/Supervisors)
  // ============================================

  @Column({ type: 'jsonb', default: {} })
  shift: ShiftSettings;

  // ============================================
  // Help & Support
  // ============================================

  @Column({ type: 'jsonb', default: {} })
  help: HelpSettings;

  // ============================================
  // Timestamps
  // ============================================

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // ============================================
  // Default Settings Factory
  // ============================================

  static createDefaults(): Partial<UserSettings> {
    return {
      appearance: {
        theme: 'system',
        sidebarCollapsed: false,
        sidebarPosition: 'left',
        animationsEnabled: true,
        fontSize: 'medium',
        compactMode: false,
      },
      notifications: {
        inAppEnabled: true,
        soundEnabled: true,
        desktopEnabled: false,
        emailDigest: 'daily',
        emailCategories: {
          newMissions: true,
          missionChanges: true,
          scheduleReminders: true,
          qualityResults: true,
          absenceUpdates: true,
          systemAnnouncements: true,
          weeklyPerformance: false,
        },
        pushEnabled: true,
        quietHours: {
          enabled: false,
          start: '22:00',
          end: '07:00',
        },
      },
      tables: {
        defaultRowsPerPage: 25,
        compactRows: false,
        showRowNumbers: false,
        stickyHeader: true,
        columnPreferences: {},
        sortPreferences: {},
      },
      calendar: {
        defaultView: 'week',
        weekStartsOn: 'monday',
        showWeekends: true,
        timeFormat: '24h',
        showCompleted: false,
      },
      map: {
        defaultView: 'street',
        showAgentLocations: true,
        showTraffic: false,
        clusterSites: true,
      },
      gps: {
        enabled: true,
        accuracy: 'balanced',
      },
      photo: {
        defaultCamera: 'back',
        quality: 'medium',
        autoCompress: true,
        timestampOverlay: true,
        locationOverlay: false,
      },
      offline: {
        enabled: true,
        autoSync: true,
        maxStorageMb: 100,
      },
      mission: {
        showNotesFirst: false,
        expandChecklists: true,
        defaultSort: 'time',
      },
      shift: {
        reminderBefore: 60,
        missedClockInReminder: 15,
        endShiftReminder: 15,
        autoClockOutHours: 10,
        notifySupervisorAutoClockOut: true,
        defaultBreakMinutes: 30,
        breakReminderHours: 4,
      },
      help: {
        showEmptyStateTips: true,
        showFeatureTutorials: true,
      },
    };
  }
}
