import {
  IsUUID,
  IsDateString,
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
  IsNumber,
  Min,
  Max,
  Matches,
} from 'class-validator';
import { InterventionStatus } from '../../../shared/types/intervention.types';

export class UpdateInterventionDto {
  @IsDateString()
  @IsOptional()
  scheduledDate?: string;

  @IsString()
  @IsOptional()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  scheduledStartTime?: string;

  @IsString()
  @IsOptional()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  scheduledEndTime?: string;

  @IsEnum(InterventionStatus)
  @IsOptional()
  status?: InterventionStatus;

  @IsUUID()
  @IsOptional()
  assignedZoneChiefId?: string;

  @IsUUID()
  @IsOptional()
  assignedTeamChiefId?: string;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  assignedAgentIds?: string[];

  @IsUUID()
  @IsOptional()
  checklistTemplateId?: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  @IsOptional()
  qualityScore?: number;

  @IsNumber()
  @Min(1)
  @Max(5)
  @IsOptional()
  clientRating?: number;

  @IsString()
  @IsOptional()
  clientFeedback?: string;

  @IsString()
  @IsOptional()
  incidents?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
