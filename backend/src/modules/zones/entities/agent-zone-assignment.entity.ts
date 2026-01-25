import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Zone } from './zone.entity';

@Entity('agent_zone_assignments')
@Index(['agentId', 'zoneId'])
@Index(['isActive'])
export class AgentZoneAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  agentId: string;

  @Column({ type: 'uuid' })
  zoneId: string;

  @Column({ type: 'uuid', nullable: true })
  teamChiefId: string | null;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date', nullable: true })
  endDate: Date | null;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'agentId' })
  agent: User;

  @ManyToOne(() => Zone, { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'zoneId' })
  zone: Zone;

  @ManyToOne(() => User, { eager: false, nullable: true })
  @JoinColumn({ name: 'teamChiefId' })
  teamChief: User | null;
}
