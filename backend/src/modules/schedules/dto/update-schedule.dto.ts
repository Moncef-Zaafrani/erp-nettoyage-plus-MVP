import { PartialType } from '@nestjs/mapped-types';
import { CreateScheduleDto } from './create-schedule.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { ScheduleStatus } from '../../../shared/types/schedule.types';

export class UpdateScheduleDto extends PartialType(CreateScheduleDto) {
  @IsOptional()
  @IsEnum(ScheduleStatus)
  status?: ScheduleStatus;
}
