import {
  IsEnum,
  IsString,
  IsOptional,
  MaxLength,
  IsNotEmpty,
} from 'class-validator';
import { AbsenceStatus } from '../../../shared/types/absence.types';

/**
 * DTO for reviewing (approving/rejecting) an absence request
 */
export class ReviewAbsenceDto {
  @IsEnum(AbsenceStatus)
  @IsNotEmpty()
  status: AbsenceStatus; // APPROVED or REJECTED only

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  reviewNotes?: string; // Reason for approval or rejection
}
