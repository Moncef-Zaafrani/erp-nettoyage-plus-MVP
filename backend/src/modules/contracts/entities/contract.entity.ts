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
import { Client } from '../../clients/entities/client.entity';
import { Site } from '../../sites/entities/site.entity';
import {
  ContractType,
  ContractFrequency,
  ContractStatus,
  ContractPricing,
  ServiceScope,
} from '../../../shared/types/contract.types';

@Entity('contracts')
@Index(['contractCode'], { unique: true })
@Index(['clientId'])
@Index(['siteId'])
@Index(['status'])
@Index(['type'])
export class Contract {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  contractCode: string;

  @Column({ type: 'uuid' })
  clientId: string;

  @Column({ type: 'uuid' })
  siteId: string;

  @Column({
    type: 'varchar',
    default: ContractType.PERMANENT,
  })
  type: ContractType;

  @Column({
    type: 'varchar',
    nullable: true,
  })
  frequency: ContractFrequency | null;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date', nullable: true })
  endDate: Date | null;

  @Column({
    type: 'varchar',
    default: ContractStatus.DRAFT,
  })
  status: ContractStatus;

  @Column({ type: 'simple-json', nullable: true })
  pricing: ContractPricing | null;

  @Column({ type: 'simple-json', nullable: true })
  serviceScope: ServiceScope | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;

  // Relations
  @ManyToOne(() => Client, { eager: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'clientId' })
  client: Client;

  @ManyToOne(() => Site, { eager: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'siteId' })
  site: Site;
}
