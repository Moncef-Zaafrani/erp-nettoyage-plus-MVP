import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ZonesService } from './zones.service';
import { ZonesController } from './zones.controller';
import { Zone } from './entities/zone.entity';
import { SiteAssignment } from './entities/site-assignment.entity';
import { AgentZoneAssignment } from './entities/agent-zone-assignment.entity';
import { Site } from '../sites/entities/site.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Zone,
      SiteAssignment,
      AgentZoneAssignment,
      Site,
      User,
    ]),
  ],
  controllers: [ZonesController],
  providers: [ZonesService],
  exports: [ZonesService],
})
export class ZonesModule {}
