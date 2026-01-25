import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  BeforeInsert,
  BeforeUpdate,
  ManyToOne,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { UserRole, UserStatus, AttendanceStatus } from '../../../shared/types/user.types';
import {
  ensurePasswordHashed,
  validatePassword as validatePwd,
} from '../../../shared/utils/password.util';
import { UserSettings } from './user-settings.entity';

// ============================================
// Profile JSON Types
// ============================================

export interface EmergencyContact {
  name: string;
  relationship: 'spouse' | 'parent' | 'sibling' | 'friend' | 'other';
  phone: string;
  secondaryPhone?: string;
  notes?: string;
}

export interface Certification {
  id: string;
  name: string;
  issuingAuthority: string;
  issueDate: string;
  expiryDate?: string;
  documentUrl?: string;
  status: 'valid' | 'expiring_soon' | 'expired';
}

export interface LanguageSkill {
  language: string;
  proficiency: 'basic' | 'intermediate' | 'fluent' | 'native';
}

export interface EquipmentCompetency {
  equipment: string;
  certified: boolean;
  certifiedDate?: string;
}

export interface WorkPreferences {
  preferredHours?: { start: string; end: string };
  daysAvailable?: string[];
  maxTravelDistanceKm?: number;
  preferredZones?: string[];
  preferredSiteTypes?: string[];
  sitesToAvoid?: { siteId: string; reason: string }[];
  preferRecurring?: boolean;
}

export interface ProfileCompletion {
  hasPhoto: boolean;
  hasPhone: boolean;
  hasEmergencyContact: boolean;
  hasCertifications: boolean;
  percentage: number;
}

@Entity('users')
@Index(['role'])
@Index(['status'])
@Index(['supervisorId'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  firstName: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  lastName: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  displayName: string;

  @Column({
    type: 'varchar',
    default: UserRole.AGENT,
  })
  role: UserRole;

  @Column({
    type: 'varchar',
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  /**
   * Real-time attendance status for employees (agents, supervisors)
   * Updated by Superviseurs during shifts
   */
  @Column({
    type: 'varchar',
    nullable: true,
  })
  attendanceStatus: AttendanceStatus | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  secondaryPhone: string;

  // ============================================
  // Profile Fields
  // ============================================

  @Column({ type: 'varchar', length: 500, nullable: true })
  profilePhotoUrl: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  personalEmail: string;

  @Column({ type: 'date', nullable: true })
  dateOfBirth: Date;

  @Column({ type: 'varchar', length: 50, nullable: true })
  nationalId: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  region: string;

  // ============================================
  // Emergency Contact (JSON)
  // ============================================

  @Column({ type: 'jsonb', nullable: true })
  emergencyContact: EmergencyContact | null;

  // ============================================
  // Employment Details
  // ============================================

  @Column({ type: 'varchar', length: 50, nullable: true })
  employeeId: string;

  @Column({ type: 'date', nullable: true })
  hireDate: Date;

  @Column({ type: 'varchar', length: 20, nullable: true })
  contractType: 'CDI' | 'CDD' | 'FREELANCE' | null;

  // ============================================
  // Skills & Qualifications (JSON arrays)
  // ============================================

  @Column({ type: 'jsonb', default: [] })
  certifications: Certification[];

  @Column({ type: 'jsonb', default: [] })
  languages: LanguageSkill[];

  @Column({ type: 'jsonb', default: [] })
  equipmentCompetencies: EquipmentCompetency[];

  @Column({ type: 'simple-array', nullable: true })
  specialSkills: string[];

  // ============================================
  // Work Preferences (JSON)
  // ============================================

  @Column({ type: 'jsonb', nullable: true })
  workPreferences: WorkPreferences | null;

  // ============================================
  // Relationships
  // ============================================

  /**
   * FK to supervisor user (for agents)
   * Agents must be linked to at least one Supervisor per Plan.md
   */
  @Column({ type: 'uuid', nullable: true })
  supervisorId: string | null;

  @ManyToOne(() => User, { eager: false, nullable: true })
  @JoinColumn({ name: 'supervisorId' })
  supervisor: User | null;

  @OneToOne(() => UserSettings, (settings) => settings.user, { cascade: true, eager: false })
  settings: UserSettings;

  // ============================================
  // Verification & Security
  // ============================================

  @Column({ default: false })
  emailVerified: boolean;

  @Column({ type: 'timestamp', nullable: true })
  emailVerifiedAt: Date;

  @Column({ default: 0 })
  failedLoginAttempts: number;

  @Column({ type: 'timestamp', nullable: true })
  lastFailedLoginAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastPasswordChangeAt: Date;

  @Column({ default: false })
  forcePasswordChange: boolean;

  // ============================================
  // Timestamps
  // ============================================

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  // Hash password before saving (uses shared utility)
  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password) {
      this.password = await ensurePasswordHashed(this.password);
    }
  }

  // Validate password (used in auth)
  async validatePassword(password: string): Promise<boolean> {
    return validatePwd(password, this.password);
  }

  // Helper to check if user is active
  get isActive(): boolean {
    return this.status === UserStatus.ACTIVE;
  }

  // Helper to check if email is verified
  get isEmailVerified(): boolean {
    return this.emailVerified;
  }

  // Helper to get full name
  get fullName(): string {
    return `${this.firstName || ''} ${this.lastName || ''}`.trim();
  }
}

