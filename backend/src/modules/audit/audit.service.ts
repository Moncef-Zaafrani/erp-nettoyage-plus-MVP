import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

export interface AuditLogEntry {
    action: string;
    entityType: string;
    entityId: string;
    actorId: string;
    changes?: Record<string, any>;
    description?: string;
    ipAddress?: string;
    userAgent?: string;
}

@Injectable()
export class AuditService {
    private readonly logger = new Logger(AuditService.name);

    constructor(
        @InjectRepository(AuditLog)
        private readonly auditLogRepository: Repository<AuditLog>,
    ) { }

    /**
     * Log an action to the audit trail
     */
    async log(entry: AuditLogEntry): Promise<AuditLog> {
        const auditLog = this.auditLogRepository.create(entry);
        await this.auditLogRepository.save(auditLog);

        this.logger.log(
            `Audit: ${entry.action} on ${entry.entityType}:${entry.entityId} by ${entry.actorId}`,
        );

        return auditLog;
    }

    /**
     * Log a user creation
     */
    async logUserCreated(
        userId: string,
        actorId: string,
        userData: Record<string, any>,
        ipAddress?: string,
    ): Promise<AuditLog> {
        return this.log({
            action: 'CREATE',
            entityType: 'User',
            entityId: userId,
            actorId,
            changes: { created: userData },
            description: `User created: ${userData.email}`,
            ipAddress,
        });
    }

    /**
     * Log a user update
     */
    async logUserUpdated(
        userId: string,
        actorId: string,
        changes: Record<string, { from: any; to: any }>,
        ipAddress?: string,
    ): Promise<AuditLog> {
        return this.log({
            action: 'UPDATE',
            entityType: 'User',
            entityId: userId,
            actorId,
            changes,
            description: `User updated: ${Object.keys(changes).join(', ')}`,
            ipAddress,
        });
    }

    /**
     * Log a status change (special tracking for status transitions)
     */
    async logStatusChange(
        userId: string,
        actorId: string,
        oldStatus: string,
        newStatus: string,
        ipAddress?: string,
    ): Promise<AuditLog> {
        return this.log({
            action: 'STATUS_CHANGE',
            entityType: 'User',
            entityId: userId,
            actorId,
            changes: { status: { from: oldStatus, to: newStatus } },
            description: `Status changed from ${oldStatus} to ${newStatus}`,
            ipAddress,
        });
    }

    /**
     * Log a role change
     */
    async logRoleChange(
        userId: string,
        actorId: string,
        oldRole: string,
        newRole: string,
        ipAddress?: string,
    ): Promise<AuditLog> {
        return this.log({
            action: 'ROLE_CHANGE',
            entityType: 'User',
            entityId: userId,
            actorId,
            changes: { role: { from: oldRole, to: newRole } },
            description: `Role changed from ${oldRole} to ${newRole}`,
            ipAddress,
        });
    }

    /**
     * Log user deletion/archival
     */
    async logUserArchived(
        userId: string,
        actorId: string,
        ipAddress?: string,
    ): Promise<AuditLog> {
        return this.log({
            action: 'ARCHIVE',
            entityType: 'User',
            entityId: userId,
            actorId,
            description: 'User archived',
            ipAddress,
        });
    }

    /**
     * Log user restore
     */
    async logUserRestored(
        userId: string,
        actorId: string,
        ipAddress?: string,
    ): Promise<AuditLog> {
        return this.log({
            action: 'RESTORE',
            entityType: 'User',
            entityId: userId,
            actorId,
            description: 'User restored',
            ipAddress,
        });
    }

    /**
     * Log unauthorized access attempt
     */
    async logAccessDenied(
        entityType: string,
        entityId: string,
        actorId: string,
        attemptedAction: string,
        ipAddress?: string,
        userAgent?: string,
    ): Promise<AuditLog> {
        this.logger.warn(
            `ACCESS DENIED: ${actorId} tried to ${attemptedAction} on ${entityType}:${entityId}`,
        );

        return this.log({
            action: 'ACCESS_DENIED',
            entityType,
            entityId,
            actorId,
            description: `Unauthorized attempt: ${attemptedAction}`,
            ipAddress,
            userAgent,
        });
    }

    /**
     * Get audit logs for a specific entity
     */
    async getLogsForEntity(
        entityType: string,
        entityId: string,
        limit = 50,
    ): Promise<AuditLog[]> {
        return this.auditLogRepository.find({
            where: { entityType, entityId },
            order: { createdAt: 'DESC' },
            take: limit,
            relations: ['actor'],
        });
    }

    /**
     * Get audit logs by actor
     */
    async getLogsByActor(actorId: string, limit = 50): Promise<AuditLog[]> {
        return this.auditLogRepository.find({
            where: { actorId },
            order: { createdAt: 'DESC' },
            take: limit,
        });
    }

    /**
     * Get recent audit logs (for admin dashboard)
     */
    async getRecentLogs(limit = 100): Promise<AuditLog[]> {
        return this.auditLogRepository.find({
            order: { createdAt: 'DESC' },
            take: limit,
            relations: ['actor'],
        });
    }
}
