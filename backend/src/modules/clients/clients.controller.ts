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
import { ClientsService } from './clients.service';
import {
  CreateClientDto,
  UpdateClientDto,
  SearchClientDto,
  BatchCreateClientsDto,
  BatchUpdateClientsDto,
  BatchIdsDto,
} from './dto';

@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  // ==================== CREATE ====================

  /**
   * POST /api/clients
   * Create a single client
   */
  @Post()
  async create(@Body() createClientDto: CreateClientDto) {
    return this.clientsService.create(createClientDto);
  }

  /**
   * POST /api/clients/batch
   * Create multiple clients at once
   */
  @Post('batch')
  async createBatch(@Body() batchDto: BatchCreateClientsDto) {
    return this.clientsService.createBatch(batchDto);
  }

  // ==================== READ ====================

  /**
   * GET /api/clients
   * Get all clients with pagination, filtering, and sorting
   */
  @Get()
  async findAll(@Query() searchDto: SearchClientDto) {
    return this.clientsService.findAll(searchDto);
  }

  /**
   * GET /api/clients/search
   * Search for a single client by flexible criteria (id, email, or name)
   */
  @Get('search')
  async findOne(
    @Query('id') id?: string,
    @Query('email') email?: string,
    @Query('name') name?: string,
  ) {
    return this.clientsService.findOne({ id, email, name });
  }

  /**
   * GET /api/clients/:id
   * Get a single client by ID
   */
  @Get(':id')
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('includeDeleted') includeDeleted?: string,
  ) {
    return this.clientsService.findById(id, includeDeleted === 'true');
  }

  // ==================== UPDATE ====================

  /**
   * PATCH /api/clients/:id
   * Update a single client
   */
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateClientDto: UpdateClientDto,
  ) {
    return this.clientsService.update(id, updateClientDto);
  }

  /**
   * PATCH /api/clients/batch/update
   * Update multiple clients at once
   */
  @Patch('batch/update')
  async updateBatch(@Body() batchDto: BatchUpdateClientsDto) {
    return this.clientsService.updateBatch(batchDto);
  }

  // ==================== DELETE ====================

  /**
   * DELETE /api/clients/:id
   * Soft delete a single client
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.clientsService.softDelete(id);
  }

  /**
   * POST /api/clients/batch/delete
   * Soft delete multiple clients
   */
  @Post('batch/delete')
  @HttpCode(HttpStatus.OK)
  async deleteBatch(@Body() batchDto: BatchIdsDto) {
    return this.clientsService.softDeleteBatch(batchDto);
  }

  // ==================== RESTORE ====================

  /**
   * POST /api/clients/:id/restore
   * Restore a soft-deleted client
   */
  @Post(':id/restore')
  async restore(@Param('id', ParseUUIDPipe) id: string) {
    return this.clientsService.restore(id);
  }

  /**
   * POST /api/clients/batch/restore
   * Restore multiple soft-deleted clients
   */
  @Post('batch/restore')
  async restoreBatch(@Body() batchDto: BatchIdsDto) {
    return this.clientsService.restoreBatch(batchDto);
  }
}
