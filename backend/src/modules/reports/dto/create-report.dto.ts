import { IsString, IsOptional, IsEnum, MaxLength, MinLength } from 'class-validator';
import { ReportCategory, ReportPriority } from '../entities/report.entity';

export class CreateReportDto {
  @IsString()
  @MinLength(5, { message: 'Title must be at least 5 characters' })
  @MaxLength(200, { message: 'Title cannot exceed 200 characters' })
  title: string;

  @IsEnum(['equipment_issue', 'safety_concern', 'schedule_problem', 'site_access', 'client_complaint', 'other'])
  category: ReportCategory;

  @IsString()
  @MinLength(10, { message: 'Description must be at least 10 characters' })
  description: string;

  @IsOptional()
  @IsEnum(['low', 'medium', 'high', 'urgent'])
  priority?: ReportPriority;

  @IsOptional()
  @IsString()
  screenshotUrl?: string;
}
