import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { User } from './user.entity';

/**
 * Performance notes for users (primarily for agents)
 * - Superviseurs can add/edit notes for their agents
 * - Admins/Super Admin can add/edit/remove any notes
 */
@Entity('user_notes')
@Index(['userId'])
@Index(['authorId'])
export class UserNote {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    /**
     * The user this note is about
     */
    @Column({ type: 'uuid' })
    userId: string;

    /**
     * The user who created the note
     */
    @Column({ type: 'uuid' })
    authorId: string;

    /**
     * Note content (performance notes, feedback, etc.)
     */
    @Column({ type: 'text' })
    content: string;

    /**
     * Optional category for organizing notes
     * e.g., 'performance', 'incident', 'commendation', 'general'
     */
    @Column({ type: 'varchar', length: 50, default: 'general' })
    category: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    // Relations
    @ManyToOne(() => User, { eager: false })
    @JoinColumn({ name: 'userId' })
    user: User;

    @ManyToOne(() => User, { eager: false })
    @JoinColumn({ name: 'authorId' })
    author: User;
}
