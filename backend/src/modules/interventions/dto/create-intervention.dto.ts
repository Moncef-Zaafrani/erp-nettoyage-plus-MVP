import {
  IsUUID,
  IsDateString,
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  Matches,
  ArrayMinSize,
} from 'class-validator';

export class CreateInterventionDto {
  @IsUUID()
  @IsNotEmpty()
  contractId: string;

  @IsUUID()
  @IsNotEmpty()
  siteId: string;

  @IsDateString()
  @IsNotEmpty()
  scheduledDate: string;

    @IsString()
    @IsNotEmpty()
    @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
      message: 'scheduledStartTime must be in HH:MM format (e.g., 08:00)',
    })
    scheduledStartTime: string;

    @IsString()
    @IsNotEmpty()
    @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
      message: 'scheduledEndTime must be in HH:MM format (e.g., 17:00)',
    })
    scheduledEndTime: string;

  @IsUUID()
  @IsOptional()
  assignedZoneChiefId?: string;

  @IsUUID()
  @IsOptional()
  assignedTeamChiefId?: string;

  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMinSize(1, { message: 'At least one agent must be assigned' })
  assignedAgentIds: string[];

  @IsUUID()
  @IsOptional()
  checklistTemplateId?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
