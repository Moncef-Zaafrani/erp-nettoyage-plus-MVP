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
import { Contract } from '../../contracts/entities/contract.entity';
import { Site } from '../../sites/entities/site.entity';
import { Zone } from '../../zones/entities/zone.entity';
import { RecurrencePattern, ScheduleStatus } from '../../../shared/types/schedule.types';

@Entity('schedules')
export class Schedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'contract_id' })
  contractId: string;

  @ManyToOne(() => Contract, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'contract_id' })
  contract: Contract;

  @Column({ name: 'site_id' })
  siteId: string;

  @ManyToOne(() => Site, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'site_id' })
  site: Site;

  @Column({ name: 'zone_id', nullable: true })
  zoneId: string;

  @ManyToOne(() => Zone, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'zone_id' })
  zone: Zone;

  @Column({
    type: 'varchar',
    name: 'recurrence_pattern',
  })
  recurrencePattern: RecurrencePattern;

  // For weekly patterns: 0 = Sunday, 1 = Monday, etc.
  @Column({ type: 'simple-array', name: 'days_of_week', nullable: true })
  daysOfWeek: number[];

  // For monthly patterns: 1-31
  @Column({ name: 'day_of_month', nullable: true })
  dayOfMonth: number;

  @Column({ name: 'start_time', type: 'time' })
  startTime: string; // HH:MM format

  @Column({ name: 'end_time', type: 'time' })
  endTime: string; // HH:MM format

  @Column({
    type: 'varchar',
    default: ScheduleStatus.ACTIVE,
  })
  status: ScheduleStatus;

  @Column({ name: 'valid_from', type: 'date' })
  validFrom: Date;

  @Column({ name: 'valid_until', type: 'date', nullable: true })
  validUntil: Date;

  // Personnel assignments (can be overridden per generated intervention)
  @Column({ name: 'default_zone_chief_id', nullable: true })
  defaultZoneChiefId: string;

  @Column({ name: 'default_team_chief_id', nullable: true })
  defaultTeamChiefId: string;

  @Column({ type: 'simple-array', name: 'default_agent_ids', nullable: true })
  defaultAgentIds: string[];

  // Track generated interventions
  @Column({ type: 'simple-array', name: 'generated_intervention_ids', default: '' })
  generatedInterventionIds: string[];

  // Dates to skip (holidays, exceptions)
  @Column({ type: 'simple-json', name: 'exception_dates', nullable: true })
  exceptionDates: string[]; // Array of ISO date strings

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}
