import { IsDateString, IsNotEmpty } from 'class-validator';

export class RescheduleInterventionDto {
  @IsDateString()
  @IsNotEmpty()
  newDate: string;

  @IsNotEmpty()
  newStartTime: string;

  @IsNotEmpty()
  newEndTime: string;
}
