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
import { AbsencesService } from './absences.service';
import { CreateAbsenceDto, UpdateAbsenceDto, ReviewAbsenceDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../shared/types/user.types';
import { AbsenceType, AbsenceStatus } from '../../shared/types/absence.types';

@Controller('absences')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AbsencesController {
  constructor(private readonly absencesService: AbsencesService) {}

  /**
   * Create absence request
   * Access: AGENT, TEAM_CHIEF (for themselves)
   */
  @Post()
  @Roles(UserRole.AGENT, UserRole.SUPERVISOR)
  create(@Body() createAbsenceDto: CreateAbsenceDto) {
    return this.absencesService.create(createAbsenceDto);
  }

  /**
   * Get all absences with filters
   * Access: All authenticated users
   */
  @Get()
  findAll(
    @Query('agentId') agentId?: string,
    @Query('zoneId') zoneId?: string,
    @Query('type') type?: AbsenceType,
    @Query('status') status?: AbsenceStatus,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.absencesService.findAll(
      agentId,
      zoneId,
      type,
      status,
      dateFrom,
      dateTo,
    );
  }

  /**
   * Get pending absences (for approval)
   * Access: ZONE_CHIEF and above
   */
  @Get('pending')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SUPERVISOR,
  )
  findPending() {
    return this.absencesService.findPending();
  }

  /**
   * Get absence calendar view
   * Access: All authenticated users
   */
  @Get('calendar')
  getCalendar(
    @Query('zoneId') zoneId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    if (!dateFrom || !dateTo) {
      // Default to current month
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      dateFrom = firstDay.toISOString().split('T')[0];
      dateTo = lastDay.toISOString().split('T')[0];
    }

    return this.absencesService.getCalendar(zoneId, dateFrom, dateTo);
  }

  /**
   * Get absence balance for an agent
   * Access: All authenticated users (agents see their own, supervisors see their team)
   */
  @Get('balance/:agentId')
  getBalance(
    @Param('agentId') agentId: string,
    @Query('year') year?: string,
  ) {
    const targetYear = year ? parseInt(year, 10) : new Date().getFullYear();
    return this.absencesService.getBalance(agentId, targetYear);
  }

  /**
   * Get single absence by ID
   * Access: All authenticated users
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.absencesService.findOne(id);
  }

  /**
   * Update absence (only if PENDING)
   * Access: Agent who requested it
   */
  @Patch(':id')
  @Roles(UserRole.AGENT, UserRole.SUPERVISOR)
  update(
    @Param('id') id: string,
    @Body() updateAbsenceDto: UpdateAbsenceDto,
    @CurrentUser() user: any,
  ) {
    return this.absencesService.update(id, updateAbsenceDto, user.id);
  }

  /**
   * Review absence (approve/reject)
   * Access: ZONE_CHIEF and above
   */
  @Post(':id/review')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SUPERVISOR,
  )
  review(
    @Param('id') id: string,
    @Body() reviewAbsenceDto: ReviewAbsenceDto,
    @CurrentUser() user: any,
  ) {
    return this.absencesService.review(id, reviewAbsenceDto, user.id);
  }

  /**
   * Cancel absence (agent self-cancellation)
   * Access: Agent who requested it
   */
  @Post(':id/cancel')
  @Roles(UserRole.AGENT, UserRole.SUPERVISOR)
  cancel(@Param('id') id: string, @CurrentUser() user: any) {
    return this.absencesService.cancel(id, user.id);
  }

  /**
   * Delete absence (soft delete)
   * Access: SUPER_ADMIN, DIRECTOR only
   */
  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SUPERVISOR)
  remove(@Param('id') id: string) {
    return this.absencesService.remove(id);
  }
}
