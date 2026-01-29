import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto, ResolveReportDto } from './dto/update-report.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../shared/types/user.types';

// This matches what JWT strategy returns after validation
interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
}

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  /**
   * Create a new report
   * All authenticated users can create reports
   */
  @Post()
  async create(
    @CurrentUser() user: AuthUser,
    @Body() createReportDto: CreateReportDto,
  ) {
    return this.reportsService.create(user.id, createReportDto);
  }

  /**
   * Get all reports (filtered by role)
   */
  @Get()
  async findAll(@CurrentUser() user: AuthUser) {
    return this.reportsService.findAll(user.id, user.role);
  }

  /**
   * Get reports created by the current user
   */
  @Get('my-reports')
  async findMyReports(@CurrentUser() user: AuthUser) {
    return this.reportsService.findMyReports(user.id);
  }

  /**
   * Get reports assigned to the current user
   */
  @Get('assigned-to-me')
  async findAssignedToMe(@CurrentUser() user: AuthUser) {
    return this.reportsService.findAssignedToMe(user.id);
  }

  /**
   * Get report statistics
   */
  @Get('stats')
  async getStats(@CurrentUser() user: AuthUser) {
    return this.reportsService.getStats(user.id, user.role);
  }

  /**
   * Get a single report by ID
   */
  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.reportsService.findOne(id, user.id, user.role);
  }

  /**
   * Update a report
   */
  @Patch(':id')
  @Roles(UserRole.SUPERVISOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
    @Body() updateReportDto: UpdateReportDto,
  ) {
    return this.reportsService.update(id, user.id, user.role, updateReportDto);
  }

  /**
   * Resolve a report
   */
  @Patch(':id/resolve')
  @Roles(UserRole.SUPERVISOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async resolve(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
    @Body() resolveDto: ResolveReportDto,
  ) {
    return this.reportsService.resolve(id, user.id, user.role, resolveDto);
  }
}
