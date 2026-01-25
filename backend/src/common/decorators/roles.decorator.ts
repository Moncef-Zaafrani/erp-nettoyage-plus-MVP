import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../shared/types/user.types';

export const ROLES_KEY = 'roles';

/**
 * Restrict route to specific roles
 * Usage: @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
