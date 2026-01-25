import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

/**
 * Audit log entry for tracking all user modifications
 * Used to display "Status History" tab in User detail page
 */
@Entity('audit_logs')
@Index(['entityType', 'entityId'])
@Index(['actorId'])
@Index(['createdAt'])
export class AuditLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    /**
     * Type of action performed
     * e.g., CREATE, UPDATE, DELETE, STATUS_CHANGE, ROLE_CHANGE, PASSWORD_RESET, LOGIN, ACCESS_DENIED
     */
    @Column({ type: 'varchar', length: 50 })
    action: string;

    /**
     * Type of entity affected
     * e.g., User, Zone, Site, Contract
     */
    @Column({ type: 'varchar', length: 50 })
    entityType: string;

    /**
     * ID of the entity affected
     */
    @Column({ type: 'uuid' })
    entityId: string;

    /**
     * ID of the user who performed the action
     */
    @Column({ type: 'uuid' })
    actorId: string;

    /**
     * JSON object containing the changes made
     * e.g., { field: "status", oldValue: "ACTIVE", newValue: "INACTIVE" }
     */
    @Column({ type: 'jsonb', nullable: true })
    changes: Record<string, any>;

    /**
     * Optional description or notes about the action
     */
    @Column({ type: 'text', nullable: true })
    description: string | null;

    /**
     * IP address of the request (for security auditing)
     */
    @Column({ type: 'varchar', length: 45, nullable: true })
    ipAddress: string | null;

    /**
     * User agent of the request (for security auditing)
     */
    @Column({ type: 'varchar', length: 255, nullable: true })
    userAgent: string | null;

    @CreateDateColumn()
    createdAt: Date;

    // Relations
    @ManyToOne(() => User, { eager: false, nullable: true })
    @JoinColumn({ name: 'actorId' })
    actor: User | null;
}
