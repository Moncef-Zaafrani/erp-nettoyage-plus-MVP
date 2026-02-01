import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { ProfileController } from './profile.controller';
import { SettingsController } from './settings.controller';
import { UsersService } from './users.service';
import { ProfileService } from './profile.service';
import { SettingsService } from './settings.service';
import { User } from './entities/user.entity';
import { UserNote } from './entities/user-note.entity';
import { UserZoneAssignment } from './entities/user-zone-assignment.entity';
import { UserSiteAssignment } from './entities/user-site-assignment.entity';
import { UserSettings } from './entities/user-settings.entity';
import { UserSession } from './entities/user-session.entity';
import { AuditModule } from '../audit/audit.module';
import { ClientsModule } from '../clients/clients.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      UserNote,
      UserZoneAssignment,
      UserSiteAssignment,
      UserSettings,
      UserSession,
    ]),
    forwardRef(() => AuditModule),
    forwardRef(() => ClientsModule),
  ],
  controllers: [UsersController, ProfileController, SettingsController],
  providers: [UsersService, ProfileService, SettingsService],
  exports: [UsersService, ProfileService, SettingsService],
})
export class UsersModule { }
