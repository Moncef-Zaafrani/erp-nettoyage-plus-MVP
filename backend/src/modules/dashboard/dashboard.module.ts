import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { User } from '../users/entities/user.entity';
import { Client } from '../clients/entities/client.entity';
import { Site } from '../sites/entities/site.entity';
import { Contract } from '../contracts/entities/contract.entity';
import { Zone } from '../zones/entities/zone.entity';
import { Intervention } from '../interventions/entities/intervention.entity';
import { ChecklistInstance } from '../checklists/entities/checklist-instance.entity';
import { Absence } from '../absences/entities/absence.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Client,
      Site,
      Contract,
      Zone,
      Intervention,
      ChecklistInstance,
      Absence,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
