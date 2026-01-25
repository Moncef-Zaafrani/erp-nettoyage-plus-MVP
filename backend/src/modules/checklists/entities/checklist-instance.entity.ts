import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ChecklistTemplate } from './checklist-template.entity';
import { Intervention } from '../../interventions/entities/intervention.entity';
import { User } from '../../users/entities/user.entity';
import { ChecklistItem } from './checklist-item.entity';
import { ChecklistStatus } from '../../../shared/types/checklist.types';

@Entity('checklist_instances')
export class ChecklistInstance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'intervention_id' })
  interventionId: string;

  @ManyToOne(() => Intervention, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'intervention_id' })
  intervention: Intervention;

  @Column({ name: 'template_id' })
  templateId: string;

  @ManyToOne(() => ChecklistTemplate, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'template_id' })
  template: ChecklistTemplate;

  @OneToMany(() => ChecklistItem, (item) => item.checklistInstance, { cascade: true })
  items: ChecklistItem[];

  @Column({
    type: 'varchar',
    default: ChecklistStatus.NOT_STARTED,
  })
  status: ChecklistStatus;

  @Column({ name: 'started_at', type: 'timestamp', nullable: true })
  startedAt: Date | null;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date | null;

  @Column({ name: 'completion_percentage', type: 'int', default: 0 })
  completionPercentage: number; // 0-100

  @Column({ name: 'quality_score', type: 'int', nullable: true })
  qualityScore: number; // 1-5, from Zone Chief review

  @Column({ name: 'reviewed_by', nullable: true })
  reviewedBy: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'reviewed_by' })
  reviewer: User;

  @Column({ type: 'text', name: 'review_notes', nullable: true })
  reviewNotes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
