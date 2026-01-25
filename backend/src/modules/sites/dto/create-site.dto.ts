import {
  IsString,
  IsOptional,
  IsEnum,
  IsUUID,
  MaxLength,
  IsEmail,
} from 'class-validator';
import { SiteSize, SiteStatus } from '../../../shared/types/site.types';

export class CreateSiteDto {
  @IsUUID('4', { message: 'Invalid client ID format' })
  clientId: string;

  @IsString()
  @MaxLength(200)
  name: string;

  @IsOptional()
  @IsEnum(SiteSize, { message: 'Invalid site size' })
  size?: SiteSize;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @IsOptional()
  @IsString()
  accessInstructions?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  workingHours?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  contactPerson?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  contactPhone?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  contactEmail?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(SiteStatus, { message: 'Invalid status' })
  status?: SiteStatus;
}
