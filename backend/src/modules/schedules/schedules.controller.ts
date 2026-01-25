import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { CreateScheduleDto, UpdateScheduleDto, GenerateInterventionsDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../shared/types/user.types';
import { ScheduleStatus } from '../../shared/types/schedule.types';

@Controller('schedules')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  /**
   * Create a new schedule
   * Access: SUPER_ADMIN, DIRECTOR, SECTOR_CHIEF
   */
  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.SUPERVISOR)
  create(@Body() createScheduleDto: CreateScheduleDto) {
    return this.schedulesService.create(createScheduleDto);
  }

  /**
   * Get all schedules with filters
   * Access: All roles
   */
  @Get()
  findAll(
    @Query('contractId') contractId?: string,
    @Query('siteId') siteId?: string,
    @Query('zoneId') zoneId?: string,
    @Query('status') status?: ScheduleStatus,
  ) {
    return this.schedulesService.findAll(contractId, siteId, zoneId, status);
  }

  /**
   * Get daily schedules for a specific date
   * Access: All roles
   */
  @Get('daily/:date')
  getDailySchedules(@Param('date') date: string) {
    return this.schedulesService.getDailySchedules(new Date(date));
  }

  /**
   * Get schedules for a specific zone
   * Access: All roles
   */
  @Get('zone/:zoneId')
  getZoneSchedules(@Param('zoneId') zoneId: string) {
    return this.schedulesService.getZoneSchedules(zoneId);
  }

  /**
   * Generate interventions from all active schedules
   * Access: SUPER_ADMIN, DIRECTOR, SECTOR_CHIEF
   */
  @Post('generate-all')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SUPERVISOR)
  generateAllInterventions(@Body() dto: GenerateInterventionsDto) {
    return this.schedulesService.generateAllInterventions(dto);
  }

  /**
   * Get a single schedule by ID
   * Access: All roles
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.schedulesService.findOne(id);
  }

  /**
   * Update a schedule
   * Access: SUPER_ADMIN, DIRECTOR, SECTOR_CHIEF
   */
  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SUPERVISOR)
  update(@Param('id') id: string, @Body() updateScheduleDto: UpdateScheduleDto) {
    return this.schedulesService.update(id, updateScheduleDto);
  }

  /**
   * Delete a schedule (soft delete)
   * Access: SUPER_ADMIN, DIRECTOR, SECTOR_CHIEF
   */
  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SUPERVISOR)
  remove(@Param('id') id: string) {
    return this.schedulesService.remove(id);
  }

  /**
   * Generate interventions from a specific schedule
   * Access: SUPER_ADMIN, DIRECTOR, SECTOR_CHIEF
   */
  @Post(':id/generate')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SUPERVISOR)
  generateInterventions(
    @Param('id') id: string,
    @Body() dto: GenerateInterventionsDto,
  ) {
    return this.schedulesService.generateInterventions(id, dto);
  }

  /**
   * Pause a schedule
   * Access: SUPER_ADMIN, DIRECTOR, SECTOR_CHIEF
   */
  @Post(':id/pause')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SUPERVISOR)
  pause(@Param('id') id: string) {
    return this.schedulesService.pause(id);
  }

  /**
   * Resume a schedule
   * Access: SUPER_ADMIN, DIRECTOR, SECTOR_CHIEF
   */
  @Post(':id/resume')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SUPERVISOR)
  resume(@Param('id') id: string) {
    return this.schedulesService.resume(id);
  }
}
