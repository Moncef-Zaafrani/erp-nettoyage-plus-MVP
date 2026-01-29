import { IsString, IsOptional, IsEnum, MaxLength } from 'class-validator';
import { ReportStatus } from '../entities/report.entity';

export class UpdateReportDto {
  @IsOptional()
  @IsEnum(['open', 'in_progress', 'resolved', 'closed'])
  status?: ReportStatus;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  resolution?: string;

  @IsOptional()
  @IsString()
  assignedToId?: string;
}

export class ResolveReportDto {
  @IsString()
  @MaxLength(1000)
  resolution: string;
}
