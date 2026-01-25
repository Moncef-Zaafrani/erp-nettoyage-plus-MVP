import { IsNotEmpty, IsOptional, IsInt, Min } from 'class-validator';

export class GenerateInterventionsDto {
  @IsNotEmpty()
  startDate: Date;

  @IsNotEmpty()
  endDate: Date;

  @IsOptional()
  @IsInt()
  @Min(1)
  daysAhead?: number; // Alternative: generate X days from startDate
}
