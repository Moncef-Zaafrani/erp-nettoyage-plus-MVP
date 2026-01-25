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
import { Site } from '../../sites/entities/site.entity';

/**
 * Many-to-many relationship between users (agents) and sites
 * - Agents can be assigned to one or more sites
 * - Required for agents at creation (per Plan.md)
 */
@Entity('user_site_assignments')
@Unique(['userId', 'siteId'])
@Index(['userId'])
@Index(['siteId'])
export class UserSiteAssignment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    userId: string;

    @Column({ type: 'uuid' })
    siteId: string;

    /**
     * Optional: who assigned this user to this site
     */
    @Column({ type: 'uuid', nullable: true })
    assignedById: string | null;

    /**
     * Whether this is the user's primary site
     */
    @Column({ type: 'boolean', default: false })
    isPrimary: boolean;

    @CreateDateColumn()
    createdAt: Date;

    // Relations
    @ManyToOne(() => User, { eager: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;

    @ManyToOne(() => Site, { eager: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'siteId' })
    site: Site;

    @ManyToOne(() => User, { eager: false, nullable: true })
    @JoinColumn({ name: 'assignedById' })
    assignedBy: User | null;
}
