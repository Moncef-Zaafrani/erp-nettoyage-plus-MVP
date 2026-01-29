import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export type ReportCategory = 
  | 'equipment_issue'
  | 'safety_concern'
  | 'schedule_problem'
  | 'site_access'
  | 'client_complaint'
  | 'other';

export type ReportPriority = 'low' | 'medium' | 'high' | 'urgent';

export type ReportStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'reporter_id' })
  reporterId: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'reporter_id' })
  reporter: User;

  @Column({ name: 'assigned_to_id', nullable: true })
  assignedToId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assigned_to_id' })
  assignedTo?: User;

  @Column({ length: 200 })
  title: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: 'other',
  })
  category: ReportCategory;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'medium',
  })
  priority: ReportPriority;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'open',
  })
  status: ReportStatus;

  @Column({ name: 'screenshot_url', nullable: true })
  screenshotUrl?: string;

  @Column({ type: 'text', nullable: true })
  resolution?: string;

  @Column({ name: 'resolved_at', type: 'timestamptz', nullable: true })
  resolvedAt?: Date;

  @Column({ name: 'resolved_by_id', nullable: true })
  resolvedById?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'resolved_by_id' })
  resolvedBy?: User;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
