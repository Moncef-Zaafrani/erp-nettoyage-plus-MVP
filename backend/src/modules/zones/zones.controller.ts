import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  Query,
  DefaultValuePipe,
  ParseBoolPipe,
} from '@nestjs/common';
import { ZonesService } from './zones.service';
import {
  CreateZoneDto,
  UpdateZoneDto,
  AssignSiteDto,
  AssignAgentDto,
} from './dto';
import { Roles } from '../../common/decorators';
import { UserRole } from '../../shared/types/user.types';

@Controller('zones')
export class ZonesController {
  constructor(private readonly zonesService: ZonesService) {}

  /**
   * Create a new zone
   * POST /api/zones
   */
  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.SUPERVISOR)
  create(@Body() createZoneDto: CreateZoneDto) {
    return this.zonesService.create(createZoneDto);
  }

  /**
   * Get all zones
   * GET /api/zones?includeDeleted=false
   */
  @Get()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SUPERVISOR,
  )
  findAll(
    @Query('includeDeleted', new DefaultValuePipe(false), ParseBoolPipe)
    includeDeleted?: boolean,
  ) {
    return this.zonesService.findAll(includeDeleted);
  }

  /**
   * Get a single zone by ID
   * GET /api/zones/:id
   */
  @Get(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SUPERVISOR,
  )
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.zonesService.findOne(id);
  }

  /**
   * Update a zone
   * PATCH /api/zones/:id
   */
  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SUPERVISOR)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateZoneDto: UpdateZoneDto,
  ) {
    return this.zonesService.update(id, updateZoneDto);
  }

  /**
   * Soft delete a zone
   * DELETE /api/zones/:id
   */
  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SUPERVISOR)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.zonesService.remove(id);
  }

  /**
   * Assign a site to a zone
   * POST /api/zones/:id/assign-site
   */
  @Post(':id/assign-site')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SUPERVISOR)
  assignSite(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() assignDto: AssignSiteDto,
  ) {
    return this.zonesService.assignSite(id, assignDto);
  }

  /**
   * Assign an agent to a zone
   * POST /api/zones/:id/assign-agent
   */
  @Post(':id/assign-agent')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SUPERVISOR,
  )
  assignAgent(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() assignDto: AssignAgentDto,
  ) {
    return this.zonesService.assignAgent(id, assignDto);
  }

  /**
   * Get all sites assigned to a zone
   * GET /api/zones/:id/sites
   */
  @Get(':id/sites')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SUPERVISOR,
  )
  getZoneSites(@Param('id', ParseUUIDPipe) id: string) {
    return this.zonesService.getZoneSites(id);
  }

  /**
   * Get all agents assigned to a zone
   * GET /api/zones/:id/agents
   */
  @Get(':id/agents')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SUPERVISOR,
  )
  getZoneAgents(@Param('id', ParseUUIDPipe) id: string) {
    return this.zonesService.getZoneAgents(id);
  }

  /**
   * Get zone performance metrics
   * GET /api/zones/:id/performance
   */
  @Get(':id/performance')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SUPERVISOR,
  )
  getZonePerformance(@Param('id', ParseUUIDPipe) id: string) {
    return this.zonesService.getZonePerformance(id);
  }

  /**
   * Unassign a site from zone
   * DELETE /api/zones/assignments/site/:assignmentId
   */
  @Delete('assignments/site/:assignmentId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SUPERVISOR)
  unassignSite(@Param('assignmentId', ParseUUIDPipe) assignmentId: string) {
    return this.zonesService.unassignSite(assignmentId);
  }

  /**
   * Unassign an agent from zone
   * DELETE /api/zones/assignments/agent/:assignmentId
   */
  @Delete('assignments/agent/:assignmentId')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SUPERVISOR,
  )
  unassignAgent(@Param('assignmentId', ParseUUIDPipe) assignmentId: string) {
    return this.zonesService.unassignAgent(assignmentId);
  }
}
