import { IsUUID, IsNotEmpty, IsDateString, IsOptional } from 'class-validator';

export class AssignAgentDto {
  @IsUUID()
  @IsNotEmpty()
  agentId: string;

  @IsUUID()
  @IsOptional()
  teamChiefId?: string;

  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;
}
