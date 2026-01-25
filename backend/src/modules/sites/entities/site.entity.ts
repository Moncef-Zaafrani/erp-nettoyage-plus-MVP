import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SiteSize, SiteStatus } from '../../../shared/types/site.types';
import { Client } from '../../clients/entities/client.entity';

@Entity('sites')
export class Site {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Foreign key to client
  @ManyToOne(() => Client, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clientId' })
  client: Client;

  @Column()
  clientId: string;

  @Column({ length: 200 })
  name: string;

  @Column({
    type: 'varchar',
    default: SiteSize.MEDIUM,
  })
  size: SiteSize;

  // Location details
  @Column({ type: 'text', nullable: true })
  address: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  postalCode: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  country: string | null;

  // Access and working information
  @Column({ type: 'text', nullable: true })
  accessInstructions: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  workingHours: string | null; // e.g., "Mon-Fri 8:00-17:00"

  // Contact information
  @Column({ type: 'varchar', length: 200, nullable: true })
  contactPerson: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  contactPhone: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  contactEmail: string | null;

  // Additional information
  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({
    type: 'varchar',
    default: SiteStatus.ACTIVE,
  })
  status: SiteStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;
}
