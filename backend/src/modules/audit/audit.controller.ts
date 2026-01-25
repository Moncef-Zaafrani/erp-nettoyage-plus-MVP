import { Controller, Get, Query, Param, ParseUUIDPipe } from '@nestjs/common';
import { AuditService } from './audit.service';

@Controller('audit')
export class AuditController {
    constructor(private readonly auditService: AuditService) { }

    /**
     * GET /api/audit
     * Get recent audit logs (Super Admin only - will add guard later)
     */
    @Get()
    async getRecentLogs(@Query('limit') limit?: string) {
        const parsedLimit = limit ? parseInt(limit, 10) : 100;
        return this.auditService.getRecentLogs(parsedLimit);
    }

    /**
     * GET /api/audit/entity/:entityType/:entityId
     * Get audit logs for a specific entity
     */
    @Get('entity/:entityType/:entityId')
    async getLogsForEntity(
        @Param('entityType') entityType: string,
        @Param('entityId', ParseUUIDPipe) entityId: string,
        @Query('limit') limit?: string,
    ) {
        const parsedLimit = limit ? parseInt(limit, 10) : 50;
        return this.auditService.getLogsForEntity(entityType, entityId, parsedLimit);
    }

    /**
     * GET /api/audit/actor/:actorId
     * Get audit logs by actor (user who performed actions)
     */
    @Get('actor/:actorId')
    async getLogsByActor(
        @Param('actorId', ParseUUIDPipe) actorId: string,
        @Query('limit') limit?: string,
    ) {
        const parsedLimit = limit ? parseInt(limit, 10) : 50;
        return this.auditService.getLogsByActor(actorId, parsedLimit);
    }

    /**
     * GET /api/audit/user/:userId
     * Shortcut to get audit logs for User entity
     */
    @Get('user/:userId')
    async getLogsForUser(
        @Param('userId', ParseUUIDPipe) userId: string,
        @Query('limit') limit?: string,
    ) {
        const parsedLimit = limit ? parseInt(limit, 10) : 50;
        return this.auditService.getLogsForEntity('User', userId, parsedLimit);
    }
}
