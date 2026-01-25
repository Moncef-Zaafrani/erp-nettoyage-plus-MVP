import {
  IsOptional,
  IsObject,
  IsEnum,
  IsBoolean,
  IsNumber,
  IsString,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  ThemeType,
  AppearanceSettings,
  NotificationSettings,
  TableSettings,
  CalendarSettings,
  MapSettings,
  GpsSettings,
  PhotoSettings,
  OfflineSettings,
  MissionSettings,
  ShiftSettings,
  HelpSettings,
} from '../entities/user-settings.entity';

// ============================================
// Appearance Settings DTO
// ============================================

export class AppearanceSettingsDto implements AppearanceSettings {
  @IsEnum(['system', 'light', 'dark', 'ocean-blue', 'forest-green', 'sunset-orange', 'high-contrast', 'minimal-gray', 'nettoyage-brand'])
  theme: ThemeType;

  @IsBoolean()
  sidebarCollapsed: boolean;

  @IsEnum(['left', 'right'])
  sidebarPosition: 'left' | 'right';

  @IsBoolean()
  animationsEnabled: boolean;

  @IsEnum(['small', 'medium', 'large'])
  fontSize: 'small' | 'medium' | 'large';

  @IsBoolean()
  compactMode: boolean;
}

// ============================================
// Notification Settings DTO
// ============================================

export class NotificationSettingsDto implements Partial<NotificationSettings> {
  @IsOptional()
  @IsBoolean()
  inAppEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  soundEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  desktopEnabled?: boolean;

  @IsOptional()
  @IsEnum(['instant', 'daily', 'weekly', 'none'])
  emailDigest?: 'instant' | 'daily' | 'weekly' | 'none';

  @IsOptional()
  @IsObject()
  emailCategories?: {
    newMissions: boolean;
    missionChanges: boolean;
    scheduleReminders: boolean;
    qualityResults: boolean;
    absenceUpdates: boolean;
    systemAnnouncements: boolean;
    weeklyPerformance: boolean;
  };

  @IsOptional()
  @IsBoolean()
  pushEnabled?: boolean;

  @IsOptional()
  @IsObject()
  quietHours?: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

// ============================================
// Table Settings DTO
// ============================================

export class TableSettingsDto implements Partial<TableSettings> {
  @IsOptional()
  @IsEnum([10, 25, 50, 100])
  defaultRowsPerPage?: 10 | 25 | 50 | 100;

  @IsOptional()
  @IsBoolean()
  compactRows?: boolean;

  @IsOptional()
  @IsBoolean()
  showRowNumbers?: boolean;

  @IsOptional()
  @IsBoolean()
  stickyHeader?: boolean;

  @IsOptional()
  @IsObject()
  columnPreferences?: Record<string, string[]>;

  @IsOptional()
  @IsObject()
  sortPreferences?: Record<string, { field: string; direction: 'asc' | 'desc' }>;
}

// ============================================
// Calendar Settings DTO
// ============================================

export class CalendarSettingsDto implements Partial<CalendarSettings> {
  @IsOptional()
  @IsEnum(['day', 'week', 'month'])
  defaultView?: 'day' | 'week' | 'month';

  @IsOptional()
  @IsEnum(['sunday', 'monday'])
  weekStartsOn?: 'sunday' | 'monday';

  @IsOptional()
  @IsBoolean()
  showWeekends?: boolean;

  @IsOptional()
  @IsEnum(['12h', '24h'])
  timeFormat?: '12h' | '24h';

  @IsOptional()
  @IsBoolean()
  showCompleted?: boolean;
}

// ============================================
// Map Settings DTO
// ============================================

export class MapSettingsDto implements Partial<MapSettings> {
  @IsOptional()
  @IsEnum(['satellite', 'street', 'hybrid'])
  defaultView?: 'satellite' | 'street' | 'hybrid';

  @IsOptional()
  @IsBoolean()
  showAgentLocations?: boolean;

  @IsOptional()
  @IsBoolean()
  showTraffic?: boolean;

  @IsOptional()
  @IsBoolean()
  clusterSites?: boolean;
}

// ============================================
// GPS Settings DTO
// ============================================

export class GpsSettingsDto implements Partial<GpsSettings> {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsEnum(['high', 'balanced', 'low'])
  accuracy?: 'high' | 'balanced' | 'low';
}

// ============================================
// Photo Settings DTO
// ============================================

export class PhotoSettingsDto implements Partial<PhotoSettings> {
  @IsOptional()
  @IsEnum(['front', 'back'])
  defaultCamera?: 'front' | 'back';

  @IsOptional()
  @IsEnum(['low', 'medium', 'high', 'original'])
  quality?: 'low' | 'medium' | 'high' | 'original';

  @IsOptional()
  @IsBoolean()
  autoCompress?: boolean;

  @IsOptional()
  @IsBoolean()
  timestampOverlay?: boolean;

  @IsOptional()
  @IsBoolean()
  locationOverlay?: boolean;
}

// ============================================
// Offline Settings DTO
// ============================================

export class OfflineSettingsDto implements Partial<OfflineSettings> {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsBoolean()
  autoSync?: boolean;

  @IsOptional()
  @IsEnum([50, 100, 500])
  maxStorageMb?: 50 | 100 | 500;
}

// ============================================
// Mission Settings DTO
// ============================================

export class MissionSettingsDto implements Partial<MissionSettings> {
  @IsOptional()
  @IsBoolean()
  showNotesFirst?: boolean;

  @IsOptional()
  @IsBoolean()
  expandChecklists?: boolean;

  @IsOptional()
  @IsEnum(['time', 'site', 'priority'])
  defaultSort?: 'time' | 'site' | 'priority';
}

// ============================================
// Shift Settings DTO
// ============================================

export class ShiftSettingsDto implements Partial<ShiftSettings> {
  @IsOptional()
  @IsEnum([0, 30, 60, 120])
  reminderBefore?: 0 | 30 | 60 | 120;

  @IsOptional()
  @IsEnum([0, 15, 30])
  missedClockInReminder?: 0 | 15 | 30;

  @IsOptional()
  @IsEnum([0, 15, 30])
  endShiftReminder?: 0 | 15 | 30;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(24)
  autoClockOutHours?: number;

  @IsOptional()
  @IsBoolean()
  notifySupervisorAutoClockOut?: boolean;

  @IsOptional()
  @IsEnum([30, 60])
  defaultBreakMinutes?: 30 | 60;

  @IsOptional()
  @IsEnum([0, 4, 5])
  breakReminderHours?: 0 | 4 | 5;
}

// ============================================
// Help Settings DTO
// ============================================

export class HelpSettingsDto implements Partial<HelpSettings> {
  @IsOptional()
  @IsBoolean()
  showEmptyStateTips?: boolean;

  @IsOptional()
  @IsBoolean()
  showFeatureTutorials?: boolean;
}

// ============================================
// Full Settings Update DTO
// ============================================

export class UpdateSettingsDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => AppearanceSettingsDto)
  appearance?: Partial<AppearanceSettingsDto>;

  @IsOptional()
  @ValidateNested()
  @Type(() => NotificationSettingsDto)
  notifications?: NotificationSettingsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => TableSettingsDto)
  tables?: TableSettingsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CalendarSettingsDto)
  calendar?: CalendarSettingsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => MapSettingsDto)
  map?: MapSettingsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => GpsSettingsDto)
  gps?: GpsSettingsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => PhotoSettingsDto)
  photo?: PhotoSettingsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => OfflineSettingsDto)
  offline?: OfflineSettingsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => MissionSettingsDto)
  mission?: MissionSettingsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ShiftSettingsDto)
  shift?: ShiftSettingsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => HelpSettingsDto)
  help?: HelpSettingsDto;
}

// ============================================
// Section-specific Update DTOs
// ============================================

export class UpdateThemeDto {
  @IsEnum(['system', 'light', 'dark', 'ocean-blue', 'forest-green', 'sunset-orange', 'high-contrast', 'minimal-gray', 'nettoyage-brand'])
  theme: ThemeType;
}
