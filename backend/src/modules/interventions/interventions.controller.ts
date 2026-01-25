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
import { InterventionsService } from './interventions.service';
import {
  CreateInterventionDto,
  UpdateInterventionDto,
  GpsCheckInDto,
  GpsCheckOutDto,
  RescheduleInterventionDto,
} from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../shared/types/user.types';

@Controller('interventions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InterventionsController {
  constructor(private readonly interventionsService: InterventionsService) {}

  /**
   * Create a new intervention
   * Access: SUPER_ADMIN, DIRECTOR, SECTOR_CHIEF, ZONE_CHIEF, TEAM_CHIEF
   */
  @Post()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SUPERVISOR,
  )
  create(@Body() createInterventionDto: CreateInterventionDto) {
    return this.interventionsService.create(createInterventionDto);
  }

  /**
   * Get all interventions with filters
   * Access: All roles
   */
  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('contractId') contractId?: string,
    @Query('siteId') siteId?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('clientId') clientId?: string,
  ) {
    return this.interventionsService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
      contractId,
      siteId,
      status as any,
      startDate,
      endDate,
      clientId,
    );
  }

  /**
   * Get calendar view for a date range
   * Access: All roles
   */
  @Get('calendar')
  getCalendar(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.interventionsService.getCalendar(startDate, endDate);
  }

  /**
   * Get a single intervention by ID
   * Access: All roles
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.interventionsService.findOne(id);
  }

  /**
   * Update an intervention
   * Access: SUPER_ADMIN, DIRECTOR, SECTOR_CHIEF, ZONE_CHIEF, TEAM_CHIEF
   */
  @Patch(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SUPERVISOR,
  )
  update(
    @Param('id') id: string,
    @Body() updateInterventionDto: UpdateInterventionDto,
  ) {
    return this.interventionsService.update(id, updateInterventionDto);
  }

  /**
   * Delete an intervention (soft delete)
   * Access: SUPER_ADMIN, DIRECTOR, SECTOR_CHIEF
   */
  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SUPERVISOR)
  remove(@Param('id') id: string) {
    return this.interventionsService.remove(id);
  }

  /**
   * Start an intervention
   * Access: ZONE_CHIEF, TEAM_CHIEF, AGENT
   */
  @Post(':id/start')
  @Roles(UserRole.SUPERVISOR, UserRole.AGENT)
  start(@Param('id') id: string) {
    return this.interventionsService.start(id);
  }

  /**
   * Complete an intervention
   * Access: ZONE_CHIEF, TEAM_CHIEF, AGENT
   */
  @Post(':id/complete')
  @Roles(UserRole.SUPERVISOR, UserRole.AGENT)
  complete(@Param('id') id: string) {
    return this.interventionsService.complete(id);
  }

  /**
   * Cancel an intervention
   * Access: SUPER_ADMIN, DIRECTOR, SECTOR_CHIEF, ZONE_CHIEF, TEAM_CHIEF
   */
  @Post(':id/cancel')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SUPERVISOR,
  )
  cancel(@Param('id') id: string) {
    return this.interventionsService.cancel(id);
  }

  /**
   * Reschedule an intervention
   * Access: SUPER_ADMIN, DIRECTOR, SECTOR_CHIEF, ZONE_CHIEF, TEAM_CHIEF
   */
  @Post(':id/reschedule')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SUPERVISOR,
  )
  reschedule(
    @Param('id') id: string,
    @Body() rescheduleDto: RescheduleInterventionDto,
  ) {
    return this.interventionsService.reschedule(id, rescheduleDto);
  }

  /**
   * GPS Check-in for an intervention
   * Access: ZONE_CHIEF, TEAM_CHIEF, AGENT
   */
  @Post(':id/checkin')
  @Roles(UserRole.SUPERVISOR, UserRole.AGENT)
  checkIn(@Param('id') id: string, @Body() gpsDto: GpsCheckInDto) {
    return this.interventionsService.checkIn(id, gpsDto);
  }

  /**
   * GPS Check-out for an intervention
   * Access: ZONE_CHIEF, TEAM_CHIEF, AGENT
   */
  @Post(':id/checkout')
  @Roles(UserRole.SUPERVISOR, UserRole.AGENT)
  checkOut(@Param('id') id: string, @Body() gpsDto: GpsCheckOutDto) {
    return this.interventionsService.checkOut(id, gpsDto);
  }

  /**
   * Add a photo to an intervention
   * Access: ZONE_CHIEF, TEAM_CHIEF, AGENT
   */
  @Post(':id/photos')
  @Roles(UserRole.SUPERVISOR, UserRole.AGENT)
  addPhoto(@Param('id') id: string, @Body('photoUrl') photoUrl: string) {
    return this.interventionsService.addPhoto(id, photoUrl);
  }
}
