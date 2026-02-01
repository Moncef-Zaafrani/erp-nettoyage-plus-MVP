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
  UseGuards,
  ForbiddenException,
  Ip,
} from '@nestjs/common';
import { UsersService } from './users.service';
import {
  CreateUserDto,
  UpdateUserDto,
  SearchUserDto,
  BatchCreateUsersDto,
  BatchUpdateUsersDto,
  BatchIdsDto,
  AdminResetPasswordDto,
} from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from './entities/user.entity';
import { UserRole } from '../../shared/types/user.types';
import { AuditService } from '../audit/audit.service';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly auditService: AuditService,
  ) { }

  // ==================== CREATE ====================

  /**
   * POST /api/users
   * Create a single user
   */
  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SUPERVISOR)
  async create(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser() user: User,
    @Ip() ip: string,
  ) {
    // RESTRICTION: Check if user has permission to create this specific role
    if (user.role === UserRole.SUPERVISOR) {
      // Supervisors do not have permission to create users (Agents or Clients).
      // They only manage assigned agents.
      throw new ForbiddenException(
        'Supervisors do not have permission to create users',
      );
    }

    if (user.role === UserRole.ADMIN) {
      if (
        createUserDto.role === UserRole.ADMIN ||
        createUserDto.role === UserRole.SUPER_ADMIN
      ) {
        throw new ForbiddenException(
          'Admins cannot create Admins or Super Admins',
        );
      }
    }

    return this.usersService.create(createUserDto, user.id, ip);
  }

  /**
   * POST /api/users/batch
   * Create multiple users at once
   */
  @Post('batch')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async createBatch(
    @Body() batchDto: BatchCreateUsersDto,
    // Note: Batch creation does not strictly check roles per item in this MVP implementation
    // relying on the fact that only Admin/SuperAdmin can call this endpoint.
    // Ideally we should iterate and check permissions.
  ) {
    return this.usersService.createBatch(batchDto);
  }

  // ==================== READ ====================

  /**
   * GET /api/users
   * Get all users with pagination, filtering, and sorting
   */
  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SUPERVISOR)
  async findAll(@Query() searchDto: SearchUserDto, @CurrentUser() user: User) {
    // SCOPING: Determine allowed roles based on current user's role
    let allowedRoles: UserRole[] | undefined;
    let supervisorFilter: string | undefined;

    if (user.role === UserRole.ADMIN) {
      // Admins cannot see other Admins or Super Admins per Plan.md Step 2
      allowedRoles = [UserRole.SUPERVISOR, UserRole.AGENT, UserRole.CLIENT];
    } else if (user.role === UserRole.SUPERVISOR) {
      // Supervisors can only see Agents assigned to them per Plan.md Step 2
      allowedRoles = [UserRole.AGENT];
      supervisorFilter = user.id; // Only show agents where supervisorId matches this user
    }
    // Super Admin sees everything (allowedRoles = undefined)

    return this.usersService.findAll(searchDto, allowedRoles, supervisorFilter);
  }

  /**
   * GET /api/users/search
   * Search for a single user by flexible criteria (id, email, or phone)
   */
  @Get('search')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SUPERVISOR)
  async findOne(
    @Query('id') id?: string,
    @Query('email') email?: string,
    @Query('phone') phone?: string,
  ) {
    // TODO: Add strict scoping here too for high security.
    return this.usersService.findOne({ id, email, phone });
  }

  /**
   * GET /api/users/:id
   * Get a single user by ID
   */
  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SUPERVISOR)
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: User,
    @Query('includeDeleted') includeDeleted?: string,
  ) {
    const targetUser = await this.usersService.findById(
      id,
      includeDeleted === 'true',
    );

    // RESTRICTION: Prevent viewing higher privilege users
    if (currentUser.role !== UserRole.SUPER_ADMIN) {
      if (
        targetUser.role === UserRole.SUPER_ADMIN ||
        (currentUser.role === UserRole.ADMIN &&
          targetUser.role === UserRole.ADMIN) ||
        (currentUser.role === UserRole.SUPERVISOR &&
          targetUser.role !== UserRole.AGENT &&
          targetUser.role !== UserRole.CLIENT)
      ) {
        // Obfuscate existence for security or just throw forbidden
        throw new ForbiddenException('You do not have access to this user');
      }
    }

    return targetUser;
  }

  // ==================== UPDATE ====================

  /**
   * PATCH /api/users/:id
   * Update a single user
   */
  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SUPERVISOR)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() user: User,
    @Ip() ip: string,
  ) {
    // Fetch target first to check permission
    const targetUser = await this.usersService.findById(id);

    // RESTRICTION: Prevent updating higher privilege users
    if (user.role !== UserRole.SUPER_ADMIN) {
      // Admin cannot update Admin or Super Admin
      if (
        user.role === UserRole.ADMIN &&
        (targetUser.role === UserRole.ADMIN ||
          targetUser.role === UserRole.SUPER_ADMIN)
      ) {
        throw new ForbiddenException('You cannot update this user');
      }
      // Supervisor can only update Agents/Clients (and specifically assigned ones in future)
      if (
        user.role === UserRole.SUPERVISOR &&
        targetUser.role !== UserRole.AGENT &&
        targetUser.role !== UserRole.CLIENT
      ) {
        throw new ForbiddenException('You cannot update this user');
      }
    }

    // Prevent Role Escalation via Update
    if (updateUserDto.role) {
      if (user.role === UserRole.SUPERVISOR) {
        if (
          updateUserDto.role === UserRole.ADMIN ||
          updateUserDto.role === UserRole.SUPER_ADMIN ||
          updateUserDto.role === UserRole.SUPERVISOR // Can't promote someone to supervisor?
        ) {
          throw new ForbiddenException('Insufficient permissions to assign this role');
        }
      }
      if (user.role === UserRole.ADMIN) {
        if (updateUserDto.role === UserRole.SUPER_ADMIN || updateUserDto.role === UserRole.ADMIN) {
          throw new ForbiddenException('Insufficient permissions to assign this role');
        }
      }
    }

    return this.usersService.update(id, updateUserDto, user.id, ip);
  }

  /**
   * PATCH /api/users/batch
   * Update multiple users at once
   */
  @Patch('batch/update')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async updateBatch(@Body() batchDto: BatchUpdateUsersDto) {
    // TODO: Add auditing and strict checks per item
    return this.usersService.updateBatch(batchDto);
  }

  // ==================== DELETE ====================

  /**
   * DELETE /api/users/:id
   * Soft delete a single user
   */
  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
    @Ip() ip: string,
  ) {
    const targetUser = await this.usersService.findById(id);

    if (user.role !== UserRole.SUPER_ADMIN) {
      if (
        targetUser.role === UserRole.ADMIN ||
        targetUser.role === UserRole.SUPER_ADMIN
      ) {
        throw new ForbiddenException('You cannot delete this user');
      }
    }

    return this.usersService.softDelete(id, user.id, ip);
  }

  /**
   * DELETE /api/users/batch
   * Soft delete multiple users
   */
  @Post('batch/delete')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async deleteBatch(@Body() batchDto: BatchIdsDto) {
    return this.usersService.softDeleteBatch(batchDto);
  }

  // ==================== RESTORE ====================

  /**
   * POST /api/users/:id/restore
   * Restore a soft-deleted user
   */
  @Post(':id/restore')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async restore(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
    @Ip() ip: string,
  ) {
    return this.usersService.restore(id, user.id, ip);
  }

  /**
   * POST /api/users/batch/restore
   * Restore multiple soft-deleted users
   */
  @Post('batch/restore')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async restoreBatch(@Body() batchDto: BatchIdsDto) {
    return this.usersService.restoreBatch(batchDto);
  }

  // ==================== BATCH STATUS OPERATIONS ====================

  /**
   * POST /api/users/batch/activate
   * Activate multiple users (set status to ACTIVE)
   */
  @Post('batch/activate')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async batchActivate(
    @Body() batchDto: BatchIdsDto,
    @CurrentUser() user: User,
    @Ip() ip: string,
  ) {
    return this.usersService.batchActivate(batchDto.ids, user.id, ip);
  }

  /**
   * POST /api/users/batch/deactivate
   * Deactivate multiple users (set status to INACTIVE)
   */
  @Post('batch/deactivate')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async batchDeactivate(
    @Body() batchDto: BatchIdsDto,
    @CurrentUser() user: User,
    @Ip() ip: string,
  ) {
    return this.usersService.batchDeactivate(batchDto.ids, user.id, ip);
  }

  /**
   * POST /api/users/batch/assign-supervisor
   * Assign a supervisor to multiple users
   */
  @Post('batch/assign-supervisor')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async batchAssignSupervisor(
    @Body() body: { ids: string[]; supervisorId: string },
    @CurrentUser() user: User,
    @Ip() ip: string,
  ) {
    return this.usersService.batchAssignSupervisor(body.ids, body.supervisorId, user.id, ip);
  }

  /**
   * POST /api/users/batch/assign-zone
   * Assign a zone to multiple users
   */
  @Post('batch/assign-zone')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async batchAssignZone(
    @Body() body: { ids: string[]; zoneId: string },
    @CurrentUser() user: User,
    @Ip() ip: string,
  ) {
    return this.usersService.batchAssignZone(body.ids, body.zoneId, user.id, ip);
  }

  // ==================== PASSWORD MANAGEMENT ====================

  /**
   * POST /api/users/:id/reset-password
   * Admin-initiated password reset (temp password or reset link)
   */
  @Post(':id/reset-password')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async resetPassword(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() resetDto: AdminResetPasswordDto,
    @CurrentUser() user: User,
    @Ip() ip: string,
  ) {
    // Fetch target user to check permission
    const targetUser = await this.usersService.findById(id);

    // RESTRICTION: Prevent resetting password for higher privilege users
    if (user.role !== UserRole.SUPER_ADMIN) {
      if (
        targetUser.role === UserRole.ADMIN ||
        targetUser.role === UserRole.SUPER_ADMIN
      ) {
        throw new ForbiddenException('You cannot reset password for this user');
      }
    }

    return this.usersService.adminResetPassword(id, resetDto.mode, user.id, ip);
  }

  // ==================== VERIFICATION MANAGEMENT ====================

  /**
   * POST /api/users/:id/send-verification
   * Admin-initiated verification email
   */
  @Post(':id/send-verification')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async sendVerification(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
    @Ip() ip: string,
  ) {
    return this.usersService.sendVerificationEmail(id, user.id, ip);
  }

  /**
   * POST /api/users/batch/send-verification
   * Batch send verification emails
   */
  @Post('batch/send-verification')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async batchSendVerification(
    @Body() batchDto: { ids: string[] },
    @CurrentUser() user: User,
    @Ip() ip: string,
  ) {
    return this.usersService.batchSendVerification(batchDto.ids, user.id, ip);
  }

  /**
   * POST /api/users/:id/verify-email
   * Admin-initiated direct email verification (mark as verified without sending email)
   */
  @Post(':id/verify-email')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async verifyEmail(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
    @Ip() ip: string,
  ) {
    return this.usersService.verifyEmailDirectly(id, user.id, ip);
  }

  /**
   * POST /api/users/batch/verify-email
   * Batch verify emails directly
   */
  @Post('batch/verify-email')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async batchVerifyEmail(
    @Body() batchDto: { ids: string[] },
    @CurrentUser() user: User,
    @Ip() ip: string,
  ) {
    return this.usersService.batchVerifyEmail(batchDto.ids, user.id, ip);
  }
}
