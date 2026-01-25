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
import { ChecklistsService } from './checklists.service';
import {
  CreateTemplateDto,
  UpdateTemplateDto,
  CreateInstanceDto,
  CompleteItemDto,
  ReviewInstanceDto,
} from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../shared/types/user.types';
import { ChecklistFrequency, ChecklistStatus } from '../../shared/types/checklist.types';

@Controller('checklists')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ChecklistsController {
  constructor(private readonly checklistsService: ChecklistsService) {}

  // ========== TEMPLATE MANAGEMENT ==========

  /**
   * Create a new checklist template
   * Access: SUPER_ADMIN, DIRECTOR, SECTOR_CHIEF, QUALITY_CONTROLLER
   */
  @Post('templates')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SUPERVISOR,
  )
  createTemplate(@Body() dto: CreateTemplateDto) {
    return this.checklistsService.createTemplate(dto);
  }

  /**
   * Get all checklist templates
   * Access: All roles
   */
  @Get('templates')
  findAllTemplates(
    @Query('frequency') frequency?: ChecklistFrequency,
    @Query('isActive') isActive?: string,
  ) {
    return this.checklistsService.findAllTemplates(
      frequency,
      isActive ? isActive === 'true' : undefined,
    );
  }

  /**
   * Get a single template by ID
   * Access: All roles
   */
  @Get('templates/:id')
  findOneTemplate(@Param('id') id: string) {
    return this.checklistsService.findOneTemplate(id);
  }

  /**
   * Update a template
   * Access: SUPER_ADMIN, DIRECTOR, SECTOR_CHIEF, QUALITY_CONTROLLER
   */
  @Patch('templates/:id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SUPERVISOR,
  )
  updateTemplate(@Param('id') id: string, @Body() dto: UpdateTemplateDto) {
    return this.checklistsService.updateTemplate(id, dto);
  }

  /**
   * Delete a template (soft delete)
   * Access: SUPER_ADMIN, DIRECTOR, SECTOR_CHIEF
   */
  @Delete('templates/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SUPERVISOR)
  removeTemplate(@Param('id') id: string) {
    return this.checklistsService.removeTemplate(id);
  }

  // ========== INSTANCE MANAGEMENT ==========

  /**
   * Create a checklist instance from a template
   * Access: SUPER_ADMIN, DIRECTOR, SECTOR_CHIEF, ZONE_CHIEF, TEAM_CHIEF
   */
  @Post('instances')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SUPERVISOR,
  )
  createInstance(@Body() dto: CreateInstanceDto) {
    return this.checklistsService.createInstance(dto);
  }

  /**
   * Get all checklist instances
   * Access: All roles
   */
  @Get('instances')
  findAllInstances(
    @Query('interventionId') interventionId?: string,
    @Query('status') status?: ChecklistStatus,
  ) {
    return this.checklistsService.findAllInstances(interventionId, status);
  }

  /**
   * Get instance by intervention ID
   * Access: All roles
   */
  @Get('instances/intervention/:interventionId')
  getInstanceByIntervention(@Param('interventionId') interventionId: string) {
    return this.checklistsService.getInstanceByIntervention(interventionId);
  }

  /**
   * Get a single instance by ID
   * Access: All roles
   */
  @Get('instances/:id')
  findOneInstance(@Param('id') id: string) {
    return this.checklistsService.findOneInstance(id);
  }

  /**
   * Get completion statistics for an instance
   * Access: All roles
   */
  @Get('instances/:id/stats')
  getCompletionStats(@Param('id') id: string) {
    return this.checklistsService.getCompletionStats(id);
  }

  /**
   * Review a checklist instance (quality check)
   * Access: ZONE_CHIEF, QUALITY_CONTROLLER, SECTOR_CHIEF, DIRECTOR, SUPER_ADMIN
   */
  @Post('instances/:id/review')
  @Roles(
    UserRole.SUPERVISOR,
    UserRole.SUPER_ADMIN,
  )
  reviewInstance(@Param('id') id: string, @Body() dto: ReviewInstanceDto) {
    return this.checklistsService.reviewInstance(id, dto);
  }

  // ========== ITEM MANAGEMENT ==========

  /**
   * Complete a checklist item
   * Access: ZONE_CHIEF, TEAM_CHIEF, AGENT
   */
  @Post('items/:id/complete')
  @Roles(UserRole.SUPERVISOR, UserRole.AGENT)
  completeItem(@Param('id') id: string, @Body() dto: CompleteItemDto) {
    return this.checklistsService.completeItem(id, dto);
  }

  /**
   * Uncomplete a checklist item (for corrections)
   * Access: ZONE_CHIEF, TEAM_CHIEF
   */
  @Post('items/:id/uncomplete')
  @Roles(UserRole.SUPERVISOR)
  uncompleteItem(@Param('id') id: string) {
    return this.checklistsService.uncompleteItem(id);
  }

  /**
   * Add photo to a checklist item
   * Access: ZONE_CHIEF, TEAM_CHIEF, AGENT
   */
  @Post('items/:id/photos')
  @Roles(UserRole.SUPERVISOR, UserRole.AGENT)
  addPhotoToItem(@Param('id') id: string, @Body('photoUrl') photoUrl: string) {
    return this.checklistsService.addPhotoToItem(id, photoUrl);
  }
}
