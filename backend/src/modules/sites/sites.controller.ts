import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SitesService } from './sites.service';
import {
  CreateSiteDto,
  UpdateSiteDto,
  SearchSiteDto,
  BatchCreateSitesDto,
  BatchUpdateSitesDto,
  BatchIdsDto,
} from './dto';

@Controller('sites')
export class SitesController {
  constructor(private readonly sitesService: SitesService) {}

  // ==================== CREATE ====================

  /**
   * POST /api/sites
   * Create a single site
   */
  @Post()
  async create(@Body() createSiteDto: CreateSiteDto) {
    return this.sitesService.create(createSiteDto);
  }

  /**
   * POST /api/sites/batch
   * Create multiple sites at once
   */
  @Post('batch')
  async createBatch(@Body() batchDto: BatchCreateSitesDto) {
    return this.sitesService.createBatch(batchDto);
  }

  // ==================== READ ====================

  /**
   * GET /api/sites
   * Get all sites with pagination, filtering, and sorting
   */
  @Get()
  async findAll(@Query() searchDto: SearchSiteDto) {
    return this.sitesService.findAll(searchDto);
  }

  /**
   * GET /api/sites/search
   * Search for a single site by flexible criteria (id or name)
   */
  @Get('search')
  async findOne(@Query('id') id?: string, @Query('name') name?: string) {
    return this.sitesService.findOne({ id, name });
  }

  /**
   * GET /api/sites/:id
   * Get a single site by ID
   */
  @Get(':id')
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('includeDeleted') includeDeleted?: string,
  ) {
    return this.sitesService.findById(id, includeDeleted === 'true');
  }

  // ==================== UPDATE ====================

  /**
   * PATCH /api/sites/:id
   * Update a single site
   */
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateSiteDto: UpdateSiteDto,
  ) {
    return this.sitesService.update(id, updateSiteDto);
  }

  /**
   * PATCH /api/sites/batch/update
   * Update multiple sites at once
   */
  @Patch('batch/update')
  async updateBatch(@Body() batchDto: BatchUpdateSitesDto) {
    return this.sitesService.updateBatch(batchDto);
  }

  // ==================== DELETE ====================

  /**
   * DELETE /api/sites/:id
   * Soft delete a single site
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.sitesService.remove(id);
  }

  /**
   * POST /api/sites/batch/delete
   * Soft delete multiple sites at once
   */
  @Post('batch/delete')
  @HttpCode(HttpStatus.OK)
  async removeBatch(@Body() batchDto: BatchIdsDto) {
    return this.sitesService.removeBatch(batchDto);
  }

  // ==================== RESTORE ====================

  /**
   * POST /api/sites/:id/restore
   * Restore a soft-deleted site
   */
  @Post(':id/restore')
  async restore(@Param('id', ParseUUIDPipe) id: string) {
    return this.sitesService.restore(id);
  }

  /**
   * POST /api/sites/batch/restore
   * Restore multiple soft-deleted sites at once
   */
  @Post('batch/restore')
  async restoreBatch(@Body() batchDto: BatchIdsDto) {
    return this.sitesService.restoreBatch(batchDto);
  }
}
