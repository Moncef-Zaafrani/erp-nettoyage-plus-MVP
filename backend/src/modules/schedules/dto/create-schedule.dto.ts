import {
  IsNotEmpty,
  IsUUID,
  IsEnum,
  IsArray,
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
  Matches,
  ArrayMinSize,
} from 'class-validator';
import { RecurrencePattern } from '../../../shared/types/schedule.types';

export class CreateScheduleDto {
  @IsNotEmpty()
  @IsUUID()
  contractId: string;

  @IsNotEmpty()
  @IsUUID()
  siteId: string;

  @IsOptional()
  @IsUUID()
  zoneId?: string;

  @IsNotEmpty()
  @IsEnum(RecurrencePattern)
  recurrencePattern: RecurrencePattern;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  daysOfWeek?: number[]; // For WEEKLY pattern: 0=Sunday, 1=Monday, etc.

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  dayOfMonth?: number; // For MONTHLY pattern

  @IsNotEmpty()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'startTime must be in HH:MM format (24-hour)',
  })
  startTime: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'endTime must be in HH:MM format (24-hour)',
  })
  endTime: string;

  @IsNotEmpty()
  validFrom: Date;

  @IsOptional()
  validUntil?: Date;

  @IsOptional()
  @IsUUID()
  defaultZoneChiefId?: string;

  @IsOptional()
  @IsUUID()
  defaultTeamChiefId?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  defaultAgentIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  exceptionDates?: string[]; // ISO date strings to skip

  @IsOptional()
  @IsString()
  notes?: string;
}
