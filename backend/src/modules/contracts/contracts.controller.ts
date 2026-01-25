import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  ParseIntPipe,
  DefaultValuePipe,
  ParseBoolPipe,
} from '@nestjs/common';
import { ContractsService } from './contracts.service';
import {
  CreateContractDto,
  UpdateContractDto,
  SearchContractDto,
  BatchCreateContractsDto,
  BatchUpdateContractsDto,
  BatchDeleteContractsDto,
  BatchRestoreContractsDto,
} from './dto';
import { Roles } from '../../common/decorators';
import { UserRole } from '../../shared/types/user.types';
import {
  ContractType,
  ContractStatus,
} from '../../shared/types/contract.types';

@Controller('contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  /**
   * Create a single contract
   * POST /api/contracts
   */
  @Post()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SUPERVISOR,
  )
  create(@Body() createContractDto: CreateContractDto) {
    return this.contractsService.create(createContractDto);
  }

  /**
   * Create multiple contracts at once
   * POST /api/contracts/batch
   */
  @Post('batch')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SUPERVISOR,
  )
  createBatch(@Body() batchDto: BatchCreateContractsDto) {
    return this.contractsService.createBatch(batchDto);
  }

  /**
   * Get all contracts with optional filters and pagination
   * GET /api/contracts?page=1&limit=10&clientId=xxx&siteId=xxx&type=PERMANENT&status=ACTIVE
   */
  @Get()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SUPERVISOR,
  )
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('clientId') clientId?: string,
    @Query('siteId') siteId?: string,
    @Query('type') type?: ContractType,
    @Query('status') status?: ContractStatus,
    @Query('includeDeleted', new DefaultValuePipe(false), ParseBoolPipe)
    includeDeleted?: boolean,
  ) {
    return this.contractsService.findAll(
      page,
      limit,
      clientId,
      siteId,
      type,
      status,
      includeDeleted,
    );
  }

  /**
   * Search for contracts
   * GET /api/contracts/search?contractCode=CNT-0001&clientId=xxx
   */
  @Get('search')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SUPERVISOR,
  )
  search(@Query() searchDto: SearchContractDto) {
    return this.contractsService.search(searchDto);
  }

  /**
   * Get a single contract by ID
   * GET /api/contracts/:id
   */
  @Get(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SUPERVISOR,
  )
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.contractsService.findOne(id);
  }

  /**
   * Update a single contract
   * PATCH /api/contracts/:id
   */
  @Patch(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SUPERVISOR,
  )
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateContractDto: UpdateContractDto,
  ) {
    return this.contractsService.update(id, updateContractDto);
  }

  /**
   * Update multiple contracts at once
   * PATCH /api/contracts/batch/update
   */
  @Patch('batch/update')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SUPERVISOR,
  )
  updateBatch(@Body() batchDto: BatchUpdateContractsDto) {
    return this.contractsService.updateBatch(batchDto);
  }

  /**
   * Soft delete a single contract
   * DELETE /api/contracts/:id
   */
  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SUPERVISOR)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.contractsService.remove(id);
  }

  /**
   * Soft delete multiple contracts
   * POST /api/contracts/batch/delete
   */
  @Post('batch/delete')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SUPERVISOR)
  removeBatch(@Body() batchDto: BatchDeleteContractsDto) {
    return this.contractsService.removeBatch(batchDto);
  }

  /**
   * Restore a soft-deleted contract
   * POST /api/contracts/:id/restore
   */
  @Post(':id/restore')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SUPERVISOR)
  restore(@Param('id', ParseUUIDPipe) id: string) {
    return this.contractsService.restore(id);
  }

  /**
   * Restore multiple soft-deleted contracts
   * POST /api/contracts/batch/restore
   */
  @Post('batch/restore')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SUPERVISOR)
  restoreBatch(@Body() batchDto: BatchRestoreContractsDto) {
    return this.contractsService.restoreBatch(batchDto);
  }

  /**
   * Pause a contract (set to INACTIVE status)
   * POST /api/contracts/:id/pause
   */
  @Post(':id/pause')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SUPERVISOR)
  pause(@Param('id', ParseUUIDPipe) id: string) {
    return this.contractsService.pause(id);
  }

  /**
   * Archive a contract (soft delete)
   * POST /api/contracts/:id/archive
   */
  @Post(':id/archive')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SUPERVISOR)
  archive(@Param('id', ParseUUIDPipe) id: string) {
    return this.contractsService.archive(id);
  }

  /**
   * Renew a contract (creates new contract based on existing one)
   * POST /api/contracts/:id/renew
   * Body: { startDate: "2026-01-01", endDate: "2027-01-01" }
   */
  @Post(':id/renew')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SUPERVISOR)
  renew(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('startDate') startDate: string,
    @Body('endDate') endDate?: string,
  ) {
    return this.contractsService.renew(id, startDate, endDate);
  }
}
