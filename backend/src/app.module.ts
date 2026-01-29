import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import configuration from './config/configuration';
import { getDatabaseConfig } from './config/database.config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ClientsModule } from './modules/clients/clients.module';
import { SitesModule } from './modules/sites/sites.module';
import { ContractsModule } from './modules/contracts/contracts.module';
import { ZonesModule } from './modules/zones/zones.module';
import { InterventionsModule } from './modules/interventions/interventions.module';
import { SchedulesModule } from './modules/schedules/schedules.module';
import { ChecklistsModule } from './modules/checklists/checklists.module';
import { AbsencesModule } from './modules/absences/absences.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { EmailModule } from './modules/email/email.module';
import { AuditModule } from './modules/audit/audit.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { ReportsModule } from './modules/reports/reports.module';
import { JwtAuthGuard } from './common/guards';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    TypeOrmModule.forRoot({
      ...getDatabaseConfig(),
      retryAttempts: 30,
      retryDelay: 1000,
    }),
    AuthModule,
    UsersModule,
    ClientsModule,
    SitesModule,
    ContractsModule,
    ZonesModule,
    InterventionsModule,
    SchedulesModule,
    ChecklistsModule,
    AbsencesModule,
    DashboardModule,
    EmailModule,
    AuditModule,
    NotificationsModule,
    AttendanceModule,
    ReportsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Apply JwtAuthGuard globally - use @Public() to skip auth
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule { }
