import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Intervention } from './entities/intervention.entity';
import { Contract } from '../contracts/entities/contract.entity';
import { Site } from '../sites/entities/site.entity';
import { User } from '../users/entities/user.entity';
import {
  CreateInterventionDto,
  UpdateInterventionDto,
  GpsCheckInDto,
  GpsCheckOutDto,
  RescheduleInterventionDto,
} from './dto';
import { InterventionStatus } from '../../shared/types/intervention.types';
import { ContractStatus } from '../../shared/types/contract.types';
import { UserRole } from '../../shared/types/user.types';

@Injectable()
export class InterventionsService {
  constructor(
    @InjectRepository(Intervention)
    private readonly interventionRepository: Repository<Intervention>,
    @InjectRepository(Contract)
    private readonly contractRepository: Repository<Contract>,
    @InjectRepository(Site)
    private readonly siteRepository: Repository<Site>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Generate unique intervention code (INT-0001, INT-0002, etc.)
   */
  private async generateInterventionCode(): Promise<string> {
    const lastIntervention = await this.interventionRepository.findOne({
      where: {},
      order: { createdAt: 'DESC' },
      withDeleted: true,
    });

    let nextNumber = 1;
    if (lastIntervention && lastIntervention.interventionCode) {
      const match = lastIntervention.interventionCode.match(/INT-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    return `INT-${nextNumber.toString().padStart(4, '0')}`;
  }

  /**
   * Validate contract and site
   */
  private async validateContractAndSite(
    contractId: string,
    siteId: string,
    scheduledDate: Date,
  ): Promise<void> {
    const contract = await this.contractRepository.findOne({
      where: { id: contractId },
    });

    if (!contract) {
      throw new NotFoundException(`Contract with ID ${contractId} not found`);
    }

    if (contract.status !== ContractStatus.ACTIVE) {
      throw new BadRequestException(
        `Cannot schedule intervention for non-active contract`,
      );
    }

    // Validate intervention date is within contract period
    const schedDate = new Date(scheduledDate);
    const contractStart = new Date(contract.startDate);

    if (schedDate < contractStart) {
      throw new BadRequestException(
        'Intervention date cannot be before contract start date',
      );
    }

    if (contract.endDate) {
      const contractEnd = new Date(contract.endDate);
      if (schedDate > contractEnd) {
        throw new BadRequestException(
          'Intervention date cannot be after contract end date',
        );
      }
    }

    // Validate site
    const site = await this.siteRepository.findOne({
      where: { id: siteId },
    });

    if (!site) {
      throw new NotFoundException(`Site with ID ${siteId} not found`);
    }

    // Validate site belongs to contract's client
    if (site.clientId !== contract.clientId) {
      throw new BadRequestException(
        'Site does not belong to the contract client',
      );
    }
  }

  /**
   * Validate assigned personnel
   */
  private async validatePersonnel(
    agentIds: string[],
    zoneChiefId?: string,
    teamChiefId?: string,
  ): Promise<void> {
    // Validate agents
    for (const agentId of agentIds) {
      const agent = await this.userRepository.findOne({
        where: { id: agentId },
      });

      if (!agent) {
        throw new NotFoundException(`Agent with ID ${agentId} not found`);
      }

      if (agent.role !== UserRole.AGENT) {
        throw new BadRequestException(
          `User ${agentId} must have AGENT role`,
        );
      }
    }

    // Validate zone chief if provided
    if (zoneChiefId) {
      const zoneChief = await this.userRepository.findOne({
        where: { id: zoneChiefId },
      });

      if (!zoneChief) {
        throw new NotFoundException(
          `Zone Chief with ID ${zoneChiefId} not found`,
        );
      }

      if (zoneChief.role !== UserRole.SUPERVISOR) {
        throw new BadRequestException(
          `User ${zoneChiefId} must have SUPERVISOR role`,
        );
      }
    }

    // Validate team chief if provided
    if (teamChiefId) {
      const teamChief = await this.userRepository.findOne({
        where: { id: teamChiefId },
      });

      if (!teamChief) {
        throw new NotFoundException(
          `Team Chief with ID ${teamChiefId} not found`,
        );
      }

      if (teamChief.role !== UserRole.SUPERVISOR) {
        throw new BadRequestException(
          `User ${teamChiefId} must have SUPERVISOR role`,
        );
      }
    }
  }

  /**
   * Validate time format and logic
   */
  private validateTimes(startTime: string, endTime: string): void {
    // Parse times in HH:MM format
    const startMatch = startTime.match(/^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/);
    const endMatch = endTime.match(/^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/);

    if (!startMatch || !endMatch) {
      throw new BadRequestException(
        'Times must be in HH:MM format (e.g., 08:00)',
      );
    }

    const [, startHour, startMin] = startMatch;
    const [, endHour, endMin] = endMatch;

    const startDate = new Date();
    startDate.setHours(parseInt(startHour), parseInt(startMin), 0);

    const endDate = new Date();
    endDate.setHours(parseInt(endHour), parseInt(endMin), 0);

    if (startDate >= endDate) {
      throw new BadRequestException(
        'Start time must be before end time',
      );
    }
  }

  /**
   * Create a new intervention
   */
  async create(
    createInterventionDto: CreateInterventionDto,
  ): Promise<Intervention> {
    // Validate contract and site
    await this.validateContractAndSite(
      createInterventionDto.contractId,
      createInterventionDto.siteId,
      new Date(createInterventionDto.scheduledDate),
    );

    // Validate times
    this.validateTimes(
      createInterventionDto.scheduledStartTime,
      createInterventionDto.scheduledEndTime,
    );

    // Validate personnel
    await this.validatePersonnel(
      createInterventionDto.assignedAgentIds,
      createInterventionDto.assignedZoneChiefId,
      createInterventionDto.assignedTeamChiefId,
    );

    // Generate intervention code
    const interventionCode = await this.generateInterventionCode();

    // Create intervention
    const intervention = this.interventionRepository.create({
      ...createInterventionDto,
      interventionCode,
      status: InterventionStatus.SCHEDULED,
    });

    return await this.interventionRepository.save(intervention);
  }

  /**
   * Find all interventions with filters
   */
  async findAll(
    page: number = 1,
    limit: number = 10,
    contractId?: string,
    siteId?: string,
    status?: InterventionStatus,
    startDate?: string,
    endDate?: string,
    clientId?: string,
  ): Promise<{ data: Intervention[]; total: number; page: number; limit: number }> {
    const queryBuilder = this.interventionRepository.createQueryBuilder('intervention');
    queryBuilder
      .leftJoinAndSelect('intervention.contract', 'contract')
      .leftJoinAndSelect('intervention.site', 'site')
      .leftJoinAndSelect('intervention.zoneChief', 'zoneChief')
      .leftJoinAndSelect('intervention.teamChief', 'teamChief');

    if (clientId) {
      queryBuilder.where('contract.clientId = :clientId', { clientId });
    }
    if (contractId) {
      queryBuilder.andWhere('intervention.contractId = :contractId', { contractId });
    }
    if (siteId) {
      queryBuilder.andWhere('intervention.siteId = :siteId', { siteId });
    }
    if (status) {
      queryBuilder.andWhere('intervention.status = :status', { status });
    }
    if (startDate && endDate) {
      queryBuilder.andWhere('intervention.scheduledDate BETWEEN :startDate AND :endDate', { startDate, endDate });
    } else if (startDate) {
      queryBuilder.andWhere('intervention.scheduledDate >= :startDate', { startDate });
    } else if (endDate) {
      queryBuilder.andWhere('intervention.scheduledDate <= :endDate', { endDate });
    }
    
    queryBuilder
      .orderBy('intervention.scheduledDate', 'DESC')
      .addOrderBy('intervention.scheduledStartTime', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return { data, total, page, limit };
  }

  /**
   * Get calendar view data for a date range
   */
  async getCalendar(startDate: string, endDate: string): Promise<Intervention[]> {
    return await this.interventionRepository.find({
      where: {
        scheduledDate: Between(new Date(startDate), new Date(endDate)),
      },
      relations: ['contract', 'site', 'zoneChief', 'teamChief'],
      order: { scheduledDate: 'ASC', scheduledStartTime: 'ASC' },
    });
  }

  /**
   * Find a single intervention by ID
   */
  async findOne(id: string): Promise<Intervention> {
    const intervention = await this.interventionRepository.findOne({
      where: { id },
      relations: ['contract', 'site', 'zoneChief', 'teamChief'],
    });

    if (!intervention) {
      throw new NotFoundException(`Intervention with ID ${id} not found`);
    }

    return intervention;
  }

  /**
   * Update an intervention
   */
  async update(
    id: string,
    updateInterventionDto: UpdateInterventionDto,
  ): Promise<Intervention> {
    const intervention = await this.findOne(id);

    // Cannot update completed or cancelled interventions
    if (
      intervention.status === InterventionStatus.COMPLETED ||
      intervention.status === InterventionStatus.CANCELLED
    ) {
      throw new BadRequestException(
        `Cannot update ${intervention.status.toLowerCase()} intervention`,
      );
    }

    // Validate times if being updated
    if (
      updateInterventionDto.scheduledStartTime ||
      updateInterventionDto.scheduledEndTime
    ) {
      const startTime =
        updateInterventionDto.scheduledStartTime ||
        intervention.scheduledStartTime;
      const endTime =
        updateInterventionDto.scheduledEndTime ||
        intervention.scheduledEndTime;
      this.validateTimes(startTime, endTime);
    }

    // Validate personnel if being updated
    if (updateInterventionDto.assignedAgentIds) {
      await this.validatePersonnel(
        updateInterventionDto.assignedAgentIds,
        updateInterventionDto.assignedZoneChiefId,
        updateInterventionDto.assignedTeamChiefId,
      );
    }

    Object.assign(intervention, updateInterventionDto);
    return await this.interventionRepository.save(intervention);
  }

  /**
   * Soft delete an intervention
   */
  async remove(id: string): Promise<void> {
    const intervention = await this.findOne(id);

    if (intervention.status === InterventionStatus.IN_PROGRESS) {
      throw new BadRequestException(
        'Cannot delete intervention that is in progress',
      );
    }

    await this.interventionRepository.softDelete(id);
  }

  /**
   * Start an intervention (change status to IN_PROGRESS)
   */
  async start(id: string): Promise<Intervention> {
    const intervention = await this.findOne(id);

    if (intervention.status !== InterventionStatus.SCHEDULED) {
      throw new BadRequestException(
        'Only scheduled interventions can be started',
      );
    }

    intervention.status = InterventionStatus.IN_PROGRESS;
    intervention.actualStartTime = new Date();

    return await this.interventionRepository.save(intervention);
  }

  /**
   * Complete an intervention (change status to COMPLETED)
   */
  async complete(id: string): Promise<Intervention> {
    const intervention = await this.findOne(id);

    if (intervention.status !== InterventionStatus.IN_PROGRESS) {
      throw new BadRequestException(
        'Only in-progress interventions can be completed',
      );
    }

    // Validate GPS checkout
    if (!intervention.gpsCheckOutLat || !intervention.gpsCheckOutLng) {
      throw new BadRequestException(
        'GPS checkout is required to complete intervention',
      );
    }

    intervention.status = InterventionStatus.COMPLETED;
    intervention.actualEndTime = new Date();

    return await this.interventionRepository.save(intervention);
  }

  /**
   * Cancel an intervention
   */
  async cancel(id: string): Promise<Intervention> {
    const intervention = await this.findOne(id);

    if (
      intervention.status === InterventionStatus.COMPLETED ||
      intervention.status === InterventionStatus.CANCELLED
    ) {
      throw new BadRequestException(
        `Cannot cancel ${intervention.status.toLowerCase()} intervention`,
      );
    }

    intervention.status = InterventionStatus.CANCELLED;
    return await this.interventionRepository.save(intervention);
  }

  /**
   * Reschedule an intervention
   */
  async reschedule(
    id: string,
    rescheduleDto: RescheduleInterventionDto,
  ): Promise<Intervention> {
    const intervention = await this.findOne(id);

    if (intervention.status !== InterventionStatus.SCHEDULED) {
      throw new BadRequestException('Only scheduled interventions can be rescheduled');
    }

    // Validate new times
    this.validateTimes(rescheduleDto.newStartTime, rescheduleDto.newEndTime);

    // Validate against contract dates
    await this.validateContractAndSite(
      intervention.contractId,
      intervention.siteId,
      new Date(rescheduleDto.newDate),
    );

    intervention.scheduledDate = new Date(rescheduleDto.newDate);
    intervention.scheduledStartTime = rescheduleDto.newStartTime;
    intervention.scheduledEndTime = rescheduleDto.newEndTime;
    intervention.status = InterventionStatus.RESCHEDULED;

    return await this.interventionRepository.save(intervention);
  }

  /**
   * GPS Check-in
   */
  async checkIn(id: string, gpsDto: GpsCheckInDto): Promise<Intervention> {
    const intervention = await this.findOne(id);

    if (intervention.status !== InterventionStatus.SCHEDULED && 
        intervention.status !== InterventionStatus.RESCHEDULED) {
      throw new BadRequestException(
        'Can only check in to scheduled interventions',
      );
    }

    intervention.gpsCheckInLat = gpsDto.latitude;
    intervention.gpsCheckInLng = gpsDto.longitude;
    intervention.gpsCheckInTime = new Date();
    intervention.status = InterventionStatus.IN_PROGRESS;
    intervention.actualStartTime = new Date();

    return await this.interventionRepository.save(intervention);
  }

  /**
   * GPS Check-out
   */
  async checkOut(id: string, gpsDto: GpsCheckOutDto): Promise<Intervention> {
    const intervention = await this.findOne(id);

    if (intervention.status !== InterventionStatus.IN_PROGRESS) {
      throw new BadRequestException(
        'Can only check out from in-progress interventions',
      );
    }

    if (!intervention.gpsCheckInLat || !intervention.gpsCheckInLng) {
      throw new BadRequestException('Must check in before checking out');
    }

    intervention.gpsCheckOutLat = gpsDto.latitude;
    intervention.gpsCheckOutLng = gpsDto.longitude;
    intervention.gpsCheckOutTime = new Date();

    return await this.interventionRepository.save(intervention);
  }

  /**
   * Add photo URL to intervention
   */
  async addPhoto(id: string, photoUrl: string): Promise<Intervention> {
    const intervention = await this.findOne(id);

    if (!intervention.photoUrls) {
      intervention.photoUrls = [];
    }

    intervention.photoUrls.push(photoUrl);
    return await this.interventionRepository.save(intervention);
  }
}
