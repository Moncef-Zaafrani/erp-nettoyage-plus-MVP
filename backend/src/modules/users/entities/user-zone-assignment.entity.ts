import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
    Unique,
} from 'typeorm';
import { User } from './user.entity';
import { Zone } from '../../zones/entities/zone.entity';

/**
 * Many-to-many relationship between users and zones
 * - Superviseurs can be assigned to multiple zones
 * - Used for filtering which agents a Superviseur can see
 */
@Entity('user_zone_assignments')
@Unique(['userId', 'zoneId'])
@Index(['userId'])
@Index(['zoneId'])
export class UserZoneAssignment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    userId: string;

    @Column({ type: 'uuid' })
    zoneId: string;

    /**
     * Optional: who assigned this user to this zone
     */
    @Column({ type: 'uuid', nullable: true })
    assignedById: string | null;

    @CreateDateColumn()
    createdAt: Date;

    // Relations
    @ManyToOne(() => User, { eager: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;

    @ManyToOne(() => Zone, { eager: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'zoneId' })
    zone: Zone;

    @ManyToOne(() => User, { eager: false, nullable: true })
    @JoinColumn({ name: 'assignedById' })
    assignedBy: User | null;
}
