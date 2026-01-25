import {
  IsEnum,
  IsDateString,
  IsString,
  IsOptional,
  IsUUID,
  MaxLength,
  IsNotEmpty,
} from 'class-validator';
import { AbsenceType } from '../../../shared/types/absence.types';

/**
 * DTO for creating an absence request
 */
export class CreateAbsenceDto {
  @IsUUID()
  @IsNotEmpty()
  agentId: string;

  @IsEnum(AbsenceType)
  @IsNotEmpty()
  absenceType: AbsenceType;

  @IsDateString()
  @IsNotEmpty()
  startDate: string; // Format: YYYY-MM-DD

  @IsDateString()
  @IsNotEmpty()
  endDate: string; // Format: YYYY-MM-DD

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  reason?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  attachmentUrl?: string; // URL to uploaded medical certificate or document
}
