import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ZoneStatus } from '../../../shared/types/zone.types';

@Entity('zones')
@Index(['zoneCode'], { unique: true })
@Index(['status'])
export class Zone {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  zoneName: string;

  @Column({ type: 'varchar', length: 10, unique: true })
  zoneCode: string;

  @Column({ type: 'uuid', nullable: true })
  zoneChiefId: string | null;

  @Column({
    type: 'varchar',
    default: ZoneStatus.ACTIVE,
  })
  status: ZoneStatus;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;

  // Relations
  @ManyToOne(() => User, { eager: false, nullable: true })
  @JoinColumn({ name: 'zoneChiefId' })
  zoneChief: User | null;
}
