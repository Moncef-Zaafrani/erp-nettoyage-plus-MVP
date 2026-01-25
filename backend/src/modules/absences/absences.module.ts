import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AbsencesService } from './absences.service';
import { AbsencesController } from './absences.controller';
import { Absence } from './entities/absence.entity';
import { User } from '../users/entities/user.entity';
import { AgentZoneAssignment } from '../zones/entities/agent-zone-assignment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Absence, User, AgentZoneAssignment]),
  ],
  controllers: [AbsencesController],
  providers: [AbsencesService],
  exports: [AbsencesService],
})
export class AbsencesModule {}
