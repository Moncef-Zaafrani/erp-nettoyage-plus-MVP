import { Controller, Get, Param, Query, ParseIntPipe } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../shared/types/user.types';
import {
  DashboardSummary,
  InterventionSummary,
  ZonePerformance,
  RecentActivity,
  DailyReport,
  WeeklyReport,
  MonthlyReport,
  KPIMetrics,
} from '../../shared/types/dashboard.types';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * GET /api/dashboard/summary
   * Get overall dashboard summary statistics
   * Accessible by: All authenticated users
   */
  @Get('summary')
  async getSummary(): Promise<DashboardSummary> {
    return this.dashboardService.getSummary();
  }

  /**
   * GET /api/dashboard/interventions-today
   * Get all interventions scheduled for today
   * Accessible by: All authenticated users
   */
  @Get('interventions-today')
  async getInterventionsToday(): Promise<InterventionSummary[]> {
    return this.dashboardService.getInterventionsToday();
  }

  /**
   * GET /api/dashboard/interventions-week
   * Get all interventions for current week
   * Accessible by: All authenticated users
   */
  @Get('interventions-week')
  async getInterventionsWeek(): Promise<InterventionSummary[]> {
    return this.dashboardService.getInterventionsWeek();
  }

  /**
   * GET /api/dashboard/zone-performance/:zoneId
   * Get performance metrics for a specific zone
   * Accessible by: Zone Chiefs and above
   */
  @Get('zone-performance/:zoneId')
  @Roles(
    UserRole.SUPERVISOR,
    UserRole.SUPER_ADMIN,
  )
  async getZonePerformance(
    @Param('zoneId') zoneId: string,
  ): Promise<ZonePerformance> {
    return this.dashboardService.getZonePerformance(zoneId);
  }

  /**
   * GET /api/dashboard/recent-activity
   * Get recent activity feed
   * Accessible by: All authenticated users
   * Query params: limit (default: 20)
   */
  @Get('recent-activity')
  async getRecentActivity(
    @Query('limit', ParseIntPipe) limit: number = 20,
  ): Promise<RecentActivity[]> {
    return this.dashboardService.getRecentActivity(limit);
  }

  /**
   * GET /api/reports/daily/:date
   * Get daily report for a specific date
   * Accessible by: Zone Chiefs and above
   * Query params: zoneId (optional)
   * Example: /api/reports/daily/2026-01-15?zoneId=abc123
   */
  @Get('reports/daily/:date')
  @Roles(
    UserRole.SUPERVISOR,
    UserRole.SUPER_ADMIN,
  )
  async getDailyReport(
    @Param('date') dateStr: string,
    @Query('zoneId') zoneId?: string,
  ): Promise<DailyReport[]> {
    const date = new Date(dateStr);
    return this.dashboardService.getDailyReport(date, zoneId);
  }

  /**
   * GET /api/reports/weekly/:startDate
   * Get weekly report starting from specified date
   * Accessible by: Zone Chiefs and above
   * Query params: zoneId (optional)
   * Example: /api/reports/weekly/2026-01-13?zoneId=abc123
   */
  @Get('reports/weekly/:startDate')
  @Roles(
    UserRole.SUPERVISOR,
    UserRole.SUPER_ADMIN,
  )
  async getWeeklyReport(
    @Param('startDate') dateStr: string,
    @Query('zoneId') zoneId?: string,
  ): Promise<WeeklyReport> {
    const startDate = new Date(dateStr);
    return this.dashboardService.getWeeklyReport(startDate, zoneId);
  }

  /**
   * GET /api/reports/monthly/:year/:month
   * Get monthly report for specified year and month
   * Accessible by: Directors and above
   * Example: /api/reports/monthly/2026/1
   */
  @Get('reports/monthly/:year/:month')
  @Roles(UserRole.SUPERVISOR, UserRole.SUPER_ADMIN)
  async getMonthlyReport(
    @Param('year', ParseIntPipe) year: number,
    @Param('month', ParseIntPipe) month: number,
  ): Promise<MonthlyReport> {
    return this.dashboardService.getMonthlyReport(year, month);
  }

  /**
   * GET /api/reports/kpi/:roleType
   * Get KPI metrics for specific role type
   * Accessible by: Zone Chiefs and above
   * Query params: startDate, endDate (optional, defaults to current month)
   * Example: /api/reports/kpi/ZONE_CHIEF?startDate=2026-01-01&endDate=2026-01-31
   */
  @Get('reports/kpi/:roleType')
  @Roles(
    UserRole.SUPERVISOR,
    UserRole.SUPER_ADMIN,
  )
  async getKPIMetrics(
    @Param('roleType') roleType: 'SUPERVISOR' | 'AGENT' | 'OVERALL',
    @Query('startDate') startDateStr?: string,
    @Query('endDate') endDateStr?: string,
  ): Promise<KPIMetrics> {
    const startDate = startDateStr ? new Date(startDateStr) : undefined;
    const endDate = endDateStr ? new Date(endDateStr) : undefined;
    return this.dashboardService.getKPIMetrics(roleType, startDate, endDate);
  }
}
