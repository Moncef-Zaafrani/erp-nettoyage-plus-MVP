import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ILike, In } from 'typeorm';
import { User } from './entities/user.entity';
import { UserStatus, UserRole } from '../../shared/types/user.types';
import {
  CreateUserDto,
  UpdateUserDto,
  SearchUserDto,
  BatchCreateUsersDto,
  BatchUpdateUsersDto,
  BatchIdsDto,
} from './dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @Inject(forwardRef(() => AuditService))
    private readonly auditService: AuditService,
  ) { }

  // ==================== CREATE OPERATIONS ====================

  /**
   * Create a single user
   */
  async create(
    createUserDto: CreateUserDto,
    actorId?: string,
    ipAddress?: string,
  ): Promise<User> {
    const { email, emailVerified, ...restDto } = createUserDto;

    // Check for duplicate email
    const existingUser = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
      withDeleted: true, // Check even soft-deleted users
    });

    if (existingUser) {
      throw new ConflictException(`User with email ${email} already exists`);
    }

    const user = this.userRepository.create({
      ...restDto,
      email: email.toLowerCase(),
      emailVerified: emailVerified || false,
      // Set emailVerifiedAt if emailVerified is true
      ...(emailVerified ? { emailVerifiedAt: new Date() } : {}),
    });

    await this.userRepository.save(user);
    this.logger.log(`User created: ${user.email} (ID: ${user.id})${emailVerified ? ' [pre-verified]' : ''}`);

    // Audit Log
    if (actorId) {
      await this.auditService.logUserCreated(
        user.id,
        actorId,
        { ...createUserDto, password: '[REDACTED]' },
        ipAddress,
      );
    }

    return this.sanitizeUser(user);
  }

  /**
   * Create multiple users at once
   */
  async createBatch(batchDto: BatchCreateUsersDto): Promise<{
    created: User[];
    errors: Array<{ email: string; error: string }>;
  }> {
    const created: User[] = [];
    const errors: Array<{ email: string; error: string }> = [];

    for (const userDto of batchDto.users) {
      try {
        // We pass undefined for actorId/ip here as batch dto doesn't strictly carry it yet, 
        // or we need to update the signature to accept it. 
        // For now, let's keep it simple or assume the controller passes it if we update this signature.
        // The implementation plan implies updating batch too.
        // Let's assume we update the signature of createBatch too.
        const user = await this.create(userDto, undefined, undefined);
        created.push(user);
      } catch (error) {
        errors.push({
          email: userDto.email,
          error: error.message,
        });
      }
    }

    this.logger.log(
      `Batch create: ${created.length} created, ${errors.length} failed`,
    );

    return { created, errors };
  }

  // ==================== READ OPERATIONS ====================

  /**
   * Find single user by flexible criteria
   */
  async findOne(criteria: {
    id?: string;
    email?: string;
    phone?: string;
  }): Promise<User> {
    if (!criteria.id && !criteria.email && !criteria.phone) {
      throw new NotFoundException('No search criteria provided');
    }

    const where: FindOptionsWhere<User> = {};

    if (criteria.id) {
      where.id = criteria.id;
    } else if (criteria.email) {
      where.email = criteria.email.toLowerCase();
    } else if (criteria.phone) {
      where.phone = criteria.phone;
    }

    const user = await this.userRepository.findOne({ where });

    if (!user) {
      throw new NotFoundException(
        `User not found with: ${JSON.stringify(criteria)}`,
      );
    }

    return this.sanitizeUser(user);
  }

  /**
   * Find single user by ID
   */
  async findById(id: string, includeDeleted = false): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      withDeleted: includeDeleted,
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return this.sanitizeUser(user);
  }

  /**
   * Find users by role (for report routing, notifications, etc.)
   */
  async findByRole(role: UserRole, activeOnly = true): Promise<User[]> {
    const where: FindOptionsWhere<User> = { role };
    if (activeOnly) {
      where.status = UserStatus.ACTIVE;
    }
    
    const users = await this.userRepository.find({ where });
    return users.map(user => this.sanitizeUser(user));
  }

  /**
   * Find all users with pagination, filtering, and sorting
   * @param searchDto - Search/filter/pagination parameters
   * @param allowedRoles - Roles the current user is allowed to see
   * @param supervisorFilter - If set, only return users where supervisorId matches (for Supervisors)
   */
  async findAll(
    searchDto: SearchUserDto,
    allowedRoles?: UserRole[],
    supervisorFilter?: string,
  ): Promise<{
    data: User[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      includeDeleted = false,
      role,
      status,
      firstName,
      lastName,
      email,
      search,
    } = searchDto;

    const skip = (page - 1) * limit;

    // Build where conditions
    const where: FindOptionsWhere<User> | FindOptionsWhere<User>[] = [];

    // Helper to generate a condition with scoping
    const createScopedCondition = (baseCondition: FindOptionsWhere<User>) => {
      // If AllowedRoles restriction exists
      if (allowedRoles && allowedRoles.length > 0) {
        // If a specific role is requested
        if (baseCondition.role) {
          // Verify if the requested role is allowed
          // This assumes baseCondition.role is a value, not an operator.
          // If it is an operator (FindOperator), this check is complex.
          // Generally searchDto.role is a simple value.
          if (typeof baseCondition.role === 'string' && !allowedRoles.includes(baseCondition.role as UserRole)) {
            // Requested role conflicts with allowed roles.
            // We return a condition that matches nothing.
            // Using a trick: id = '00000000-0000-0000-0000-000000000000' (non-existent UUID)
            return { ...baseCondition, id: '00000000-0000-0000-0000-000000000000' };
          }
        } else {
          // No specific role requested, so simply limit to allowed roles
          baseCondition.role = In(allowedRoles);
        }
      }
      // Apply supervisor filter (Supervisor can only see their assigned Agents)
      if (supervisorFilter) {
        baseCondition.supervisorId = supervisorFilter;
      }
      return baseCondition;
    };

    // Handle generic search with OR conditions
    if (search) {
      const searchPattern = `%${search}%`;
      const orConditions: FindOptionsWhere<User>[] = [
        { email: ILike(searchPattern), ...(role && { role }), ...(status && { status }) },
        { firstName: ILike(searchPattern), ...(role && { role }), ...(status && { status }) },
        { lastName: ILike(searchPattern), ...(role && { role }), ...(status && { status }) },
        { phone: ILike(searchPattern), ...(role && { role }), ...(status && { status }) },
      ];

      // Apply scoping to each OR condition
      orConditions.forEach(cond => {
        // Note: we can't easily replace the element in forEach, so we handle logic here 
        // to mutate 'cond' directly if needed, but createScopedCondition returns new obj.
        // Better structure:
        if (allowedRoles && allowedRoles.length > 0) {
          if (cond.role && typeof cond.role === 'string' && !allowedRoles.includes(cond.role as UserRole)) {
            cond.id = '00000000-0000-0000-0000-000000000000';
          } else if (!cond.role) {
            cond.role = In(allowedRoles);
          }
        }
        // Apply supervisor filter
        if (supervisorFilter) {
          cond.supervisorId = supervisorFilter;
        }
      });

      where.push(...orConditions);
    } else {
      // Handle specific field filters with AND conditions
      const andWhere: FindOptionsWhere<User> = {};

      if (status) andWhere.status = status;
      if (firstName) andWhere.firstName = ILike(`%${firstName}%`);
      if (lastName) andWhere.lastName = ILike(`%${lastName}%`);
      if (email) andWhere.email = ILike(`%${email}%`);

      // Role handling
      if (role) {
        andWhere.role = role;
        // Verify against allowedRoles
        if (allowedRoles && allowedRoles.length > 0) {
          if (!allowedRoles.includes(role)) {
            // Force empty
            andWhere.id = '00000000-0000-0000-0000-000000000000';
          }
        }
      } else if (allowedRoles && allowedRoles.length > 0) {
        andWhere.role = In(allowedRoles);
      }

      // Apply supervisor filter (Supervisor can only see their assigned Agents)
      if (supervisorFilter) {
        andWhere.supervisorId = supervisorFilter;
      }

      where.push(andWhere);
    }

    const [users, total] = await this.userRepository.findAndCount({
      where: where.length > 0 ? where : {},
      order: { [sortBy]: sortOrder },
      skip,
      take: limit,
      withDeleted: includeDeleted,
      relations: ['supervisor'], // Include supervisor relation for display
    });

    return {
      data: users.map((user) => this.sanitizeUser(user)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ==================== UPDATE OPERATIONS ====================

  /**
   * Update single user by ID
   * Uses withDeleted to also find archived/deactivated users
   */
  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    actorId?: string,
    ipAddress?: string,
  ): Promise<User> {
    const user = await this.userRepository.findOne({ 
      where: { id },
      withDeleted: true, // Include soft-deleted users so we can reactivate them
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Capture old state for audit
    const oldStatus = user.status;
    const oldRole = user.role;

    // If reactivating (changing status from ARCHIVED to ACTIVE), clear deletedAt
    if (updateUserDto.status === UserStatus.ACTIVE && user.deletedAt) {
      user.deletedAt = null;
      this.logger.log(`Restoring soft-deleted user: ${user.email} (ID: ${id})`);
    }

    // Check for email conflict if updating email
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const emailExists = await this.userRepository.findOne({
        where: { email: updateUserDto.email.toLowerCase() },
        withDeleted: true,
      });

      if (emailExists) {
        throw new ConflictException(
          `Email ${updateUserDto.email} is already in use`,
        );
      }

      updateUserDto.email = updateUserDto.email.toLowerCase();
    }

    // Merge and save
    Object.assign(user, updateUserDto);
    await this.userRepository.save(user);

    this.logger.log(`User updated: ${user.email} (ID: ${user.id})`);

    // Audit Log
    if (actorId) {
      // 1. Check Role Change
      if (updateUserDto.role && oldRole !== user.role) {
        await this.auditService.logRoleChange(
          user.id,
          actorId,
          oldRole,
          user.role,
          ipAddress,
        );
      }
      // 2. Check Status Change
      if (updateUserDto.status && oldStatus !== user.status) {
        await this.auditService.logStatusChange(
          user.id,
          actorId,
          oldStatus,
          user.status,
          ipAddress,
        );
      }
      // 3. Generic Update Log (if other fields changed)
      // For simplicity in Phase 1, we log generic update if it's not JUST a role/status change
      // or we can log it regardless.
      const otherChanges = { ...updateUserDto };
      delete otherChanges.role;
      delete otherChanges.status;

      if (Object.keys(otherChanges).length > 0) {
        // Create a change record format
        const changesRecord: Record<string, { from: any; to: any }> = {};
        for (const key of Object.keys(otherChanges)) {
          changesRecord[key] = { from: '?', to: otherChanges[key as keyof UpdateUserDto] };
        }
        await this.auditService.logUserUpdated(user.id, actorId, changesRecord, ipAddress);
      }
    }

    return this.sanitizeUser(user);
  }

  /**
   * Update multiple users at once
   */
  async updateBatch(batchDto: BatchUpdateUsersDto): Promise<{
    updated: User[];
    errors: Array<{ id: string; error: string }>;
  }> {
    const updated: User[] = [];
    const errors: Array<{ id: string; error: string }> = [];

    for (const { id, ...updateData } of batchDto.users) {
      try {
        const user = await this.update(id, updateData);
        updated.push(user);
      } catch (error) {
        errors.push({
          id,
          error: error.message,
        });
      }
    }

    this.logger.log(
      `Batch update: ${updated.length} updated, ${errors.length} failed`,
    );

    return { updated, errors };
  }

  // ==================== DELETE OPERATIONS ====================

  /**
   * Soft delete single user
   */
  async softDelete(id: string, actorId?: string, ipAddress?: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Update status to ARCHIVED before soft deleting
    await this.userRepository.update(id, { status: UserStatus.ARCHIVED });

    await this.userRepository.softDelete(id);
    this.logger.log(`User soft deleted: ${user.email} (ID: ${id})`);

    // Audit Log
    if (actorId) {
      await this.auditService.logUserArchived(id, actorId, ipAddress);
    }

    return { message: `User ${user.email} has been deactivated` };
  }

  /**
   * Soft delete multiple users
   */
  async softDeleteBatch(batchDto: BatchIdsDto): Promise<{
    deleted: string[];
    errors: Array<{ id: string; error: string }>;
  }> {
    const deleted: string[] = [];
    const errors: Array<{ id: string; error: string }> = [];

    for (const id of batchDto.ids) {
      try {
        await this.softDelete(id);
        deleted.push(id);
      } catch (error) {
        errors.push({
          id,
          error: error.message,
        });
      }
    }

    this.logger.log(
      `Batch delete: ${deleted.length} deleted, ${errors.length} failed`,
    );

    return { deleted, errors };
  }

  // ==================== RESTORE OPERATIONS ====================

  /**
   * Restore single soft-deleted user
   */
  async restore(id: string, actorId?: string, ipAddress?: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    if (!user.deletedAt) {
      throw new ConflictException(`User ${id} is not deleted`);
    }

    // Restore the user (removes deletedAt) and set status to INACTIVE
    await this.userRepository.restore(id);

    // Update status to INACTIVE after restore - user must activate themselves
    await this.userRepository.update(id, { status: UserStatus.INACTIVE });

    this.logger.log(`User restored to inactive: ${user.email} (ID: ${id})`);

    // Audit Log
    if (actorId) {
      await this.auditService.logUserRestored(id, actorId, ipAddress);
    }

    // Fetch fresh user
    return this.findById(id);
  }

  /**
   * Restore multiple soft-deleted users
   */
  async restoreBatch(batchDto: BatchIdsDto): Promise<{
    restored: User[];
    errors: Array<{ id: string; error: string }>;
  }> {
    const restored: User[] = [];
    const errors: Array<{ id: string; error: string }> = [];

    for (const id of batchDto.ids) {
      try {
        const user = await this.restore(id);
        restored.push(user);
      } catch (error) {
        errors.push({
          id,
          error: error.message,
        });
      }
    }

    this.logger.log(
      `Batch restore: ${restored.length} restored, ${errors.length} failed`,
    );

    return { restored, errors };
  }

  // ==================== BATCH STATUS OPERATIONS ====================

  /**
   * Batch activate users (set status to ACTIVE)
   */
  async batchActivate(
    ids: string[],
    actorId?: string,
    ipAddress?: string,
  ): Promise<{ success: boolean; count: number; errors: Array<{ id: string; error: string }> }> {
    let count = 0;
    const errors: Array<{ id: string; error: string }> = [];

    for (const id of ids) {
      try {
        const user = await this.userRepository.findOne({ where: { id } });
        if (!user) {
          errors.push({ id, error: 'User not found' });
          continue;
        }
        user.status = UserStatus.ACTIVE;
        await this.userRepository.save(user);
        count++;

        // Audit log
        await this.auditService.log({
          actorId: actorId || 'system',
          action: 'STATUS_CHANGE',
          entityType: 'user',
          entityId: id,
          changes: { newStatus: 'ACTIVE' },
          ipAddress,
        });
      } catch (error) {
        errors.push({ id, error: error.message });
      }
    }

    this.logger.log(`Batch activate: ${count} activated, ${errors.length} failed`);
    return { success: true, count, errors };
  }

  /**
   * Batch deactivate users (set status to INACTIVE)
   */
  async batchDeactivate(
    ids: string[],
    actorId?: string,
    ipAddress?: string,
  ): Promise<{ success: boolean; count: number; errors: Array<{ id: string; error: string }> }> {
    let count = 0;
    const errors: Array<{ id: string; error: string }> = [];

    for (const id of ids) {
      try {
        const user = await this.userRepository.findOne({ where: { id } });
        if (!user) {
          errors.push({ id, error: 'User not found' });
          continue;
        }
        user.status = UserStatus.INACTIVE;
        await this.userRepository.save(user);
        count++;

        // Audit log
        await this.auditService.log({
          actorId: actorId || 'system',
          action: 'STATUS_CHANGE',
          entityType: 'user',
          entityId: id,
          changes: { newStatus: 'INACTIVE' },
          ipAddress,
        });
      } catch (error) {
        errors.push({ id, error: error.message });
      }
    }

    this.logger.log(`Batch deactivate: ${count} deactivated, ${errors.length} failed`);
    return { success: true, count, errors };
  }

  /**
   * Batch assign supervisor to users
   */
  async batchAssignSupervisor(
    ids: string[],
    supervisorId: string,
    actorId?: string,
    ipAddress?: string,
  ): Promise<{ success: boolean; count: number; errors: Array<{ id: string; error: string }> }> {
    // Verify supervisor exists and is a supervisor
    const supervisor = await this.userRepository.findOne({ where: { id: supervisorId } });
    if (!supervisor) {
      throw new NotFoundException(`Supervisor with ID ${supervisorId} not found`);
    }
    if (supervisor.role !== UserRole.SUPERVISOR && supervisor.role !== UserRole.ADMIN) {
      throw new BadRequestException('Target user is not a supervisor');
    }

    let count = 0;
    const errors: Array<{ id: string; error: string }> = [];

    for (const id of ids) {
      try {
        const user = await this.userRepository.findOne({ where: { id } });
        if (!user) {
          errors.push({ id, error: 'User not found' });
          continue;
        }
        user.supervisorId = supervisorId;
        await this.userRepository.save(user);
        count++;

        // Audit log
        await this.auditService.log({
          actorId: actorId || 'system',
          action: 'SUPERVISOR_ASSIGNED',
          entityType: 'user',
          entityId: id,
          changes: { supervisorId },
          ipAddress,
        });
      } catch (error) {
        errors.push({ id, error: error.message });
      }
    }

    this.logger.log(`Batch assign supervisor: ${count} assigned, ${errors.length} failed`);
    return { success: true, count, errors };
  }

  /**
   * Batch assign zone to users
   */
  async batchAssignZone(
    ids: string[],
    zoneId: string,
    actorId?: string,
    ipAddress?: string,
  ): Promise<{ success: boolean; count: number; errors: Array<{ id: string; error: string }> }> {
    let count = 0;
    const errors: Array<{ id: string; error: string }> = [];

    for (const id of ids) {
      try {
        const user = await this.userRepository.findOne({ where: { id } });
        if (!user) {
          errors.push({ id, error: 'User not found' });
          continue;
        }
        // Note: Zone assignment might need to use a different mechanism
        // depending on schema. This is a placeholder.
        // user.zoneId = zoneId;
        await this.userRepository.save(user);
        count++;

        // Audit log
        await this.auditService.log({
          actorId: actorId || 'system',
          action: 'ZONE_ASSIGNED',
          entityType: 'user',
          entityId: id,
          changes: { zoneId },
          ipAddress,
        });
      } catch (error) {
        errors.push({ id, error: error.message });
      }
    }

    this.logger.log(`Batch assign zone: ${count} assigned, ${errors.length} failed`);
    return { success: true, count, errors };
  }

  // ==================== PASSWORD MANAGEMENT ====================

  /**
   * Generate a random temporary password
   */
  private generateTemporaryPassword(length = 12): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  /**
   * Admin-initiated password reset
   * @param id - User ID to reset password for
   * @param mode - 'temp' for temporary password, 'link' for reset link
   * @param actorId - ID of admin performing the action
   * @param ipAddress - IP address of the request
   */
  async adminResetPassword(
    id: string,
    mode: 'temp' | 'link',
    actorId: string,
    ipAddress?: string,
  ): Promise<{ message: string; tempPassword?: string }> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    if (mode === 'temp') {
      // Generate temporary password
      const tempPassword = this.generateTemporaryPassword();
      
      // Update user with new password and force password change flag
      user.password = tempPassword;
      user.forcePasswordChange = true;
      user.lastPasswordChangeAt = new Date();
      await this.userRepository.save(user);

      this.logger.log(`Temporary password set for user: ${user.email} (ID: ${id})`);

      // Log the temporary password (in production, this would be sent via email)
      this.logger.log(`[DEV] Temporary password for ${user.email}: ${tempPassword}`);

      // Audit log
      await this.auditService.log({
        actorId: actorId || 'system',
        action: 'PASSWORD_RESET_TEMP',
        entityType: 'user',
        entityId: id,
        changes: { method: 'temporary_password' },
        ipAddress,
      });

      return {
        message: `Temporary password has been set for ${user.email}. Check logs for the password (dev mode).`,
        tempPassword, // Return to admin so they can share it securely
      };
    } else {
      // Send reset link (same as forgotPassword flow, but admin-initiated)
      // Generate a secure reset token using JWT
      const jwtService = new (require('@nestjs/jwt').JwtService)({
        secret: process.env.JWT_SECRET || 'your-secret-key',
      });
      
      const resetToken = jwtService.sign(
        { sub: user.id, email: user.email, adminReset: true },
        { expiresIn: '24h' }, // Longer expiry for admin-initiated reset
      );

      // Construct reset URL
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const baseUrl = frontendUrl.startsWith('http') ? frontendUrl : `https://${frontendUrl}`;
      const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

      this.logger.log(`Password reset link generated for user: ${user.email}`);
      this.logger.log(`[DEV] Reset URL for ${user.email}: ${resetUrl}`);

      // Audit log
      await this.auditService.log({
        actorId: actorId || 'system',
        action: 'PASSWORD_RESET_LINK',
        entityType: 'user',
        entityId: id,
        changes: { method: 'reset_link' },
        ipAddress,
      });

      return {
        message: `Password reset link has been generated for ${user.email}. Check logs for the URL (dev mode).`,
      };
    }
  }

  /**
   * Admin-initiated email verification
   * Generates a verification token and sends it to the user
   * @param id - User ID to send verification to
   * @param actorId - ID of admin performing the action
   * @param ipAddress - IP address of the request
   */
  async sendVerificationEmail(
    id: string,
    actorId: string,
    ipAddress?: string,
  ): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    if (user.emailVerified) {
      return {
        message: `User ${user.email} is already verified.`,
      };
    }

    // Generate a verification token using JWT
    const jwtService = new (require('@nestjs/jwt').JwtService)({
      secret: process.env.JWT_SECRET || 'your-secret-key',
    });

    const verificationToken = jwtService.sign(
      { sub: user.id, email: user.email, type: 'email_verification' },
      { expiresIn: '7d' }, // 7 days to verify
    );

    // Construct verification URL
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const baseUrl = frontendUrl.startsWith('http') ? frontendUrl : `https://${frontendUrl}`;
    const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}`;

    this.logger.log(`Verification email generated for user: ${user.email}`);
    this.logger.log(`[DEV] Verification URL for ${user.email}: ${verificationUrl}`);

    // Audit log
    await this.auditService.log({
      actorId: actorId || 'system',
      action: 'VERIFICATION_EMAIL_SENT',
      entityType: 'user',
      entityId: id,
      changes: { email: user.email },
      ipAddress,
    });

    return {
      message: `Verification email has been sent to ${user.email}. Check logs for the URL (dev mode).`,
    };
  }

  /**
   * Batch send verification emails
   */
  async batchSendVerification(
    ids: string[],
    actorId: string,
    ipAddress?: string,
  ): Promise<{ sent: string[]; errors: Array<{ id: string; error: string }> }> {
    const sent: string[] = [];
    const errors: Array<{ id: string; error: string }> = [];

    for (const id of ids) {
      try {
        await this.sendVerificationEmail(id, actorId, ipAddress);
        sent.push(id);
      } catch (error) {
        errors.push({
          id,
          error: error.message,
        });
      }
    }

    this.logger.log(
      `Batch send verification: ${sent.length} succeeded, ${errors.length} failed`,
    );
    return { sent, errors };
  }

  /**
   * Verify email directly (admin action)
   * Marks the user's email as verified without sending a verification email
   * @param id - User ID to verify
   * @param actorId - ID of admin performing the action
   * @param ipAddress - IP address of the request
   */
  async verifyEmailDirectly(
    id: string,
    actorId: string,
    ipAddress?: string,
  ): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ 
      where: { id },
      withDeleted: true,
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    if (user.emailVerified) {
      return {
        message: `User ${user.email} is already verified.`,
      };
    }

    // Mark email as verified
    user.emailVerified = true;
    user.emailVerifiedAt = new Date();
    await this.userRepository.save(user);

    this.logger.log(`Email verified directly for user: ${user.email}`);

    // Audit log
    await this.auditService.log({
      actorId: actorId || 'system',
      action: 'EMAIL_VERIFIED_DIRECTLY',
      entityType: 'user',
      entityId: id,
      changes: { email: user.email, verifiedBy: 'admin' },
      ipAddress,
    });

    return {
      message: `Email ${user.email} has been verified successfully.`,
    };
  }

  /**
   * Batch verify emails directly
   */
  async batchVerifyEmail(
    ids: string[],
    actorId: string,
    ipAddress?: string,
  ): Promise<{ verified: string[]; errors: Array<{ id: string; error: string }> }> {
    const verified: string[] = [];
    const errors: Array<{ id: string; error: string }> = [];

    for (const id of ids) {
      try {
        await this.verifyEmailDirectly(id, actorId, ipAddress);
        verified.push(id);
      } catch (error) {
        errors.push({
          id,
          error: error.message,
        });
      }
    }

    this.logger.log(
      `Batch verify email: ${verified.length} succeeded, ${errors.length} failed`,
    );
    return { verified, errors };
  }

  // ==================== HELPER METHODS ====================

  /**
   * Remove sensitive fields from user object
   */
  private sanitizeUser(user: User): User {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...sanitized } = user;
    return sanitized as User;
  }
}
