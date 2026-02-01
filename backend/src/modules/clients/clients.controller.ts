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
  Ip,
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
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../shared/types/user.types';
import { User } from '../users/entities/user.entity';

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

  // ==================== PASSWORD MANAGEMENT ====================

  /**
   * POST /api/clients/:id/reset-password
   * Admin-initiated password reset for client's linked user account
   */
  @Post(':id/reset-password')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async resetPassword(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
    @Ip() ip: string,
  ) {
    return this.clientsService.resetClientPassword(id, user.id, ip);
  }

  /**
   * POST /api/clients/:id/send-verification
   * Admin-initiated verification email for client's linked user account
   */
  @Post(':id/send-verification')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async sendVerification(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
    @Ip() ip: string,
  ) {
    return this.clientsService.sendClientVerification(id, user.id, ip);
  }

  /**
   * POST /api/clients/batch/send-verification
   * Batch send verification emails for clients with linked user accounts
   */
  @Post('batch/send-verification')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async batchSendVerification(
    @Body() batchDto: BatchIdsDto,
    @CurrentUser() user: User,
    @Ip() ip: string,
  ) {
    return this.clientsService.batchSendVerification(batchDto, user.id, ip);
  }

  /**
   * POST /api/clients/:id/verify-email
   * Admin-initiated direct email verification for client's linked user account
   */
  @Post(':id/verify-email')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async verifyEmail(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
    @Ip() ip: string,
  ) {
    return this.clientsService.verifyClientEmail(id, user.id, ip);
  }

  /**
   * POST /api/clients/batch/verify-email
   * Batch verify emails directly for clients with linked user accounts
   */
  @Post('batch/verify-email')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async batchVerifyEmail(
    @Body() batchDto: BatchIdsDto,
    @CurrentUser() user: User,
    @Ip() ip: string,
  ) {
    return this.clientsService.batchVerifyEmail(batchDto, user.id, ip);
  }
}
