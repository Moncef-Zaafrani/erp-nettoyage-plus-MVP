import {
  IsString,
  IsOptional,
  IsEmail,
  IsDateString,
  IsUrl,
  IsObject,
  IsArray,
  ValidateNested,
  MaxLength,
  IsEnum,
  IsBoolean,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  EmergencyContact,
  Certification,
  LanguageSkill,
  EquipmentCompetency,
  WorkPreferences,
} from '../entities/user.entity';

// ============================================
// Emergency Contact DTO
// ============================================

export class EmergencyContactDto implements EmergencyContact {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsEnum(['spouse', 'parent', 'sibling', 'friend', 'other'])
  relationship: 'spouse' | 'parent' | 'sibling' | 'friend' | 'other';

  @IsString()
  @MaxLength(20)
  phone: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  secondaryPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  notes?: string;
}

// ============================================
// Certification DTO
// ============================================

export class CertificationDto implements Certification {
  @IsString()
  id: string;

  @IsString()
  @MaxLength(100)
  name: string;

  @IsString()
  @MaxLength(100)
  issuingAuthority: string;

  @IsDateString()
  issueDate: string;

  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @IsOptional()
  @IsUrl()
  documentUrl?: string;

  @IsEnum(['valid', 'expiring_soon', 'expired'])
  status: 'valid' | 'expiring_soon' | 'expired';
}

// ============================================
// Language Skill DTO
// ============================================

export class LanguageSkillDto implements LanguageSkill {
  @IsString()
  @MaxLength(50)
  language: string;

  @IsEnum(['basic', 'intermediate', 'fluent', 'native'])
  proficiency: 'basic' | 'intermediate' | 'fluent' | 'native';
}

// ============================================
// Equipment Competency DTO
// ============================================

export class EquipmentCompetencyDto implements EquipmentCompetency {
  @IsString()
  @MaxLength(100)
  equipment: string;

  @IsBoolean()
  certified: boolean;

  @IsOptional()
  @IsDateString()
  certifiedDate?: string;
}

// ============================================
// Work Preferences DTO
// ============================================

export class WorkPreferencesDto implements WorkPreferences {
  @IsOptional()
  @IsObject()
  preferredHours?: { start: string; end: string };

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  daysAvailable?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(200)
  maxTravelDistanceKm?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredZones?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredSiteTypes?: string[];

  @IsOptional()
  @IsArray()
  sitesToAvoid?: { siteId: string; reason: string }[];

  @IsOptional()
  @IsBoolean()
  preferRecurring?: boolean;
}

// ============================================
// Update Profile DTO
// ============================================

export class UpdateProfileDto {
  // Basic Info
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  secondaryPhone?: string;

  @IsOptional()
  @IsEmail()
  personalEmail?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  nationalId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  region?: string;

  // Emergency Contact
  @IsOptional()
  @ValidateNested()
  @Type(() => EmergencyContactDto)
  emergencyContact?: EmergencyContactDto;

  // Certifications
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CertificationDto)
  certifications?: CertificationDto[];

  // Languages
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LanguageSkillDto)
  languages?: LanguageSkillDto[];

  // Equipment Competencies
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EquipmentCompetencyDto)
  equipmentCompetencies?: EquipmentCompetencyDto[];

  // Special Skills
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specialSkills?: string[];

  // Work Preferences
  @IsOptional()
  @ValidateNested()
  @Type(() => WorkPreferencesDto)
  workPreferences?: WorkPreferencesDto;
}

// ============================================
// Update Profile Photo DTO
// ============================================

export class UpdateProfilePhotoDto {
  @IsUrl()
  profilePhotoUrl: string;
}

// ============================================
// Change Password DTO
// ============================================

export class ChangePasswordDto {
  @IsString()
  currentPassword: string;

  @IsString()
  @MaxLength(100)
  newPassword: string;

  @IsString()
  @MaxLength(100)
  confirmPassword: string;
}
