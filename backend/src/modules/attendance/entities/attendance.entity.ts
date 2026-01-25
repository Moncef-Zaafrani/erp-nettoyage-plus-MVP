import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('attendances')
export class Attendance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'timestamp' })
  clockIn: Date;

  @Column({ type: 'timestamp', nullable: true })
  clockOut: Date;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  hoursWorked: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  notes: string;

  @Column({ type: 'point', nullable: true })
  clockInLocation: string;

  @Column({ type: 'point', nullable: true })
  clockOutLocation: string;

  @CreateDateColumn()
  createdAt: Date;
}
