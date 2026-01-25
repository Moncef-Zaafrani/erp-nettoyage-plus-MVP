import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { UserNote } from './entities/user-note.entity';
import { UserZoneAssignment } from './entities/user-zone-assignment.entity';
import { UserSiteAssignment } from './entities/user-site-assignment.entity';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      UserNote,
      UserZoneAssignment,
      UserSiteAssignment,
    ]),
    forwardRef(() => AuditModule),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule { }
