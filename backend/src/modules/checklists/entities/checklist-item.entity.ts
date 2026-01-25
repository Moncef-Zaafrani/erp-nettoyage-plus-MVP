import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ChecklistInstance } from './checklist-instance.entity';
import { User } from '../../users/entities/user.entity';

@Entity('checklist_items')
export class ChecklistItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'checklist_instance_id' })
  checklistInstanceId: string;

  @ManyToOne(() => ChecklistInstance, (instance) => instance.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'checklist_instance_id' })
  checklistInstance: ChecklistInstance;

  @Column({ name: 'zone_name', length: 255 })
  zoneName: string; // e.g., "Bureau 1", "Sanitaire 2", "Hall"

  @Column({ type: 'text', name: 'task_description' })
  taskDescription: string;

  @Column({ name: 'is_completed', default: false })
  isCompleted: boolean;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date | null;

  @Column({ name: 'completed_by', nullable: true })
  completedBy: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'completed_by' })
  completedByUser: User;

  @Column({ type: 'simple-array', name: 'photo_urls', nullable: true })
  photoUrls: string[];

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'quality_rating', type: 'int', nullable: true })
  qualityRating: number; // 1-5

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
