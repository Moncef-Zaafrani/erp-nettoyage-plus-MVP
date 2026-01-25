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
import { Contract } from '../../contracts/entities/contract.entity';
import { Site } from '../../sites/entities/site.entity';
import { User } from '../../users/entities/user.entity';
import { InterventionStatus } from '../../../shared/types/intervention.types';

@Entity('interventions')
@Index(['interventionCode'], { unique: true })
@Index(['contractId'])
@Index(['siteId'])
@Index(['status'])
@Index(['scheduledDate'])
export class Intervention {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  interventionCode: string;

  @Column({ type: 'uuid' })
  contractId: string;

  @Column({ type: 'uuid' })
  siteId: string;

  @Column({ type: 'date' })
  scheduledDate: Date;

  @Column({ type: 'time' })
  scheduledStartTime: string;

  @Column({ type: 'time' })
  scheduledEndTime: string;

  @Column({ type: 'timestamp', nullable: true })
  actualStartTime: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  actualEndTime: Date | null;

  @Column({
    type: 'varchar',
    default: InterventionStatus.SCHEDULED,
  })
  status: InterventionStatus;

  @Column({ type: 'uuid', nullable: true })
  assignedZoneChiefId: string | null;

  @Column({ type: 'uuid', nullable: true })
  assignedTeamChiefId: string | null;

  @Column({ type: 'simple-array', nullable: true })
  assignedAgentIds: string[] | null;

  @Column({ type: 'uuid', nullable: true })
  checklistTemplateId: string | null;

  @Column({ type: 'boolean', default: false })
  checklistCompleted: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  gpsCheckInLat: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  gpsCheckInLng: number | null;


  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  gpsCheckOutLat: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  gpsCheckOutLng: number | null;

  @Column({ type: 'timestamp', nullable: true })
  gpsCheckInTime: Date | null;
  @Column({ type: 'timestamp', nullable: true })
  gpsCheckOutTime: Date | null;

  @Column({ type: 'simple-array', nullable: true })
  photoUrls: string[] | null;

  @Column({ type: 'integer', nullable: true })
  qualityScore: number | null; // 1-5 rating

  @Column({ type: 'integer', nullable: true })
  clientRating: number | null; // 1-5 rating

  @Column({ type: 'text', nullable: true })
  clientFeedback: string | null;

  @Column({ type: 'text', nullable: true })
  incidents: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;

  // Relations
  @ManyToOne(() => Contract, { eager: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'contractId' })
  contract: Contract;

  @ManyToOne(() => Site, { eager: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'siteId' })
  site: Site;

  @ManyToOne(() => User, { eager: false, nullable: true })
  @JoinColumn({ name: 'assignedZoneChiefId' })
  zoneChief: User | null;

  @ManyToOne(() => User, { eager: false, nullable: true })
  @JoinColumn({ name: 'assignedTeamChiefId' })
  teamChief: User | null;
}
