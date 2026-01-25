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
import { Site } from '../../sites/entities/site.entity';
import { Zone } from './zone.entity';
import { User } from '../../users/entities/user.entity';

@Entity('site_assignments')
@Index(['siteId', 'zoneId'])
@Index(['isActive'])
export class SiteAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  siteId: string;

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
  @ManyToOne(() => Site, { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'siteId' })
  site: Site;

  @ManyToOne(() => Zone, { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'zoneId' })
  zone: Zone;

  @ManyToOne(() => User, { eager: false, nullable: true })
  @JoinColumn({ name: 'teamChiefId' })
  teamChief: User | null;
}
