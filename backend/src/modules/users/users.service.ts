import {
  Injectable,
  NotFoundException,
  ConflictException,
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
    const { email } = createUserDto;

    // Check for duplicate email
    const existingUser = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
      withDeleted: true, // Check even soft-deleted users
    });

    if (existingUser) {
      throw new ConflictException(`User with email ${email} already exists`);
    }

    const user = this.userRepository.create({
      ...createUserDto,
      email: email.toLowerCase(),
    });

    await this.userRepository.save(user);
    this.logger.log(`User created: ${user.email} (ID: ${user.id})`);

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
   */
  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    actorId?: string,
    ipAddress?: string,
  ): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Capture old state for audit
    const oldStatus = user.status;
    const oldRole = user.role;

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
