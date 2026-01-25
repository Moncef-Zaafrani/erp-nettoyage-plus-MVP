import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { AbsenceType, AbsenceStatus } from '../../../shared/types/absence.types';

/**
 * Absence Entity
 * Tracks employee absences (vacation, sick leave, etc.)
 */
@Entity('absences')
export class Absence {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Agent requesting absence
  @Column({ type: 'uuid' })
  agentId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'agentId' })
  agent: User;

  // Absence details
  @Column({
    type: 'varchar',
  })
  absenceType: AbsenceType;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  endDate: Date;

  @Column({ type: 'int' })
  totalDays: number; // Calculated: working days between start and end

  @Column({ type: 'text', nullable: true })
  reason: string; // Agent's reason for absence

  // Request status
  @Column({
    type: 'varchar',
    default: AbsenceStatus.PENDING,
  })
  status: AbsenceStatus;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  requestedAt: Date;

  // Review details
  @Column({ type: 'uuid', nullable: true })
  reviewedBy: string; // Zone Chief or supervisor who approved/rejected

  @ManyToOne(() => User, { eager: false, nullable: true })
  @JoinColumn({ name: 'reviewedBy' })
  reviewer: User;

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt: Date;

  @Column({ type: 'text', nullable: true })
  reviewNotes: string | null; // Reason for approval/rejection

  // Supporting documents (medical certificate, etc.)
  @Column({ type: 'varchar', length: 500, nullable: true })
  attachmentUrl: string;

  // Metadata
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;
}
