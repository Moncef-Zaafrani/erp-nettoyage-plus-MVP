import { PartialType } from '@nestjs/mapped-types';
import { CreateAbsenceDto } from './create-absence.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { AbsenceStatus } from '../../../shared/types/absence.types';

/**
 * DTO for updating an absence request
 * Only the agent can update before approval
 */
export class UpdateAbsenceDto extends PartialType(CreateAbsenceDto) {
  @IsEnum(AbsenceStatus)
  @IsOptional()
  status?: AbsenceStatus; // Only allow CANCELLED status for agent self-cancellation
}
