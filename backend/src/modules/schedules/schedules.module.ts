import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchedulesService } from './schedules.service';
import { SchedulesController } from './schedules.controller';
import { Schedule } from './entities/schedule.entity';
import { Contract } from '../contracts/entities/contract.entity';
import { Site } from '../sites/entities/site.entity';
import { Intervention } from '../interventions/entities/intervention.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Schedule, Contract, Site, Intervention]),
  ],
  controllers: [SchedulesController],
  providers: [SchedulesService],
  exports: [SchedulesService],
})
export class SchedulesModule {}
