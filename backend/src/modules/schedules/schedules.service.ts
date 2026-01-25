import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Schedule } from './entities/schedule.entity';
import { Contract } from '../contracts/entities/contract.entity';
import { Site } from '../sites/entities/site.entity';
import { Intervention } from '../interventions/entities/intervention.entity';
import { CreateScheduleDto, UpdateScheduleDto, GenerateInterventionsDto } from './dto';
import {
  RecurrencePattern,
  ScheduleStatus,
  GenerationResult,
} from '../../shared/types/schedule.types';
import { ContractStatus } from '../../shared/types/contract.types';
import { InterventionStatus } from '../../shared/types/intervention.types';

@Injectable()
export class SchedulesService {
  constructor(
    @InjectRepository(Schedule)
    private readonly scheduleRepository: Repository<Schedule>,
    @InjectRepository(Contract)
    private readonly contractRepository: Repository<Contract>,
    @InjectRepository(Site)
    private readonly siteRepository: Repository<Site>,
    @InjectRepository(Intervention)
    private readonly interventionRepository: Repository<Intervention>,
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
   * Validate schedule against contract
   */
  private async validateSchedule(dto: CreateScheduleDto): Promise<void> {
    const contract = await this.contractRepository.findOne({
      where: { id: dto.contractId },
    });

    if (!contract) {
      throw new NotFoundException(`Contract with ID ${dto.contractId} not found`);
    }

    if (contract.status !== ContractStatus.ACTIVE) {
      throw new BadRequestException('Cannot create schedule for non-active contract');
    }

    const site = await this.siteRepository.findOne({
      where: { id: dto.siteId },
    });

    if (!site) {
      throw new NotFoundException(`Site with ID ${dto.siteId} not found`);
    }

    if (site.clientId !== contract.clientId) {
      throw new BadRequestException('Site does not belong to contract client');
    }

    // Validate date range
    const validFrom = new Date(dto.validFrom);
    const contractStart = new Date(contract.startDate);

    if (validFrom < contractStart) {
      throw new BadRequestException(
        'Schedule cannot start before contract start date',
      );
    }

    if (contract.endDate && dto.validUntil) {
      const validUntil = new Date(dto.validUntil);
      const contractEnd = new Date(contract.endDate);
      if (validUntil > contractEnd) {
        throw new BadRequestException(
          'Schedule cannot end after contract end date',
        );
      }
    }

    // Validate times
    const start = dto.startTime.split(':').map(Number);
    const end = dto.endTime.split(':').map(Number);
    const startMinutes = start[0] * 60 + start[1];
    const endMinutes = end[0] * 60 + end[1];

    if (endMinutes <= startMinutes) {
      throw new BadRequestException('End time must be after start time');
    }

    // Validate pattern-specific fields
    if (dto.recurrencePattern === RecurrencePattern.WEEKLY) {
      if (!dto.daysOfWeek || dto.daysOfWeek.length === 0) {
        throw new BadRequestException('WEEKLY pattern requires daysOfWeek');
      }
    }

    if (dto.recurrencePattern === RecurrencePattern.MONTHLY) {
      if (!dto.dayOfMonth) {
        throw new BadRequestException('MONTHLY pattern requires dayOfMonth');
      }
    }
  }

  /**
   * Create a new schedule
   */
  async create(createScheduleDto: CreateScheduleDto): Promise<Schedule> {
    await this.validateSchedule(createScheduleDto);

    const schedule = this.scheduleRepository.create({
      ...createScheduleDto,
      status: ScheduleStatus.ACTIVE,
    });

    return await this.scheduleRepository.save(schedule);
  }

  /**
   * Find all schedules with filters
   */
  async findAll(
    contractId?: string,
    siteId?: string,
    zoneId?: string,
    status?: ScheduleStatus,
  ): Promise<Schedule[]> {
    const where: any = {};

    if (contractId) where.contractId = contractId;
    if (siteId) where.siteId = siteId;
    if (zoneId) where.zoneId = zoneId;
    if (status) where.status = status;

    return await this.scheduleRepository.find({
      where,
      relations: ['contract', 'site', 'zone'],
      order: { validFrom: 'ASC' },
    });
  }

  /**
   * Find a single schedule by ID
   */
  async findOne(id: string): Promise<Schedule> {
    const schedule = await this.scheduleRepository.findOne({
      where: { id },
      relations: ['contract', 'site', 'zone'],
    });

    if (!schedule) {
      throw new NotFoundException(`Schedule with ID ${id} not found`);
    }

    return schedule;
  }

  /**
   * Update a schedule
   */
  async update(id: string, updateScheduleDto: UpdateScheduleDto): Promise<Schedule> {
    const schedule = await this.findOne(id);

    if (updateScheduleDto.contractId || updateScheduleDto.siteId) {
      await this.validateSchedule({
        ...schedule,
        ...updateScheduleDto,
      } as CreateScheduleDto);
    }

    Object.assign(schedule, updateScheduleDto);
    return await this.scheduleRepository.save(schedule);
  }

  /**
   * Delete a schedule (soft delete)
   */
  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.scheduleRepository.softDelete(id);
  }

  /**
   * Calculate dates for a given schedule and date range
   */
  private calculateScheduleDates(
    schedule: Schedule,
    startDate: Date,
    endDate: Date,
  ): Date[] {
    const dates: Date[] = [];
    const current = new Date(startDate);
    current.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const validFrom = new Date(schedule.validFrom);
    validFrom.setHours(0, 0, 0, 0);

    const validUntil = schedule.validUntil
      ? new Date(schedule.validUntil)
      : new Date('2099-12-31');
    validUntil.setHours(23, 59, 59, 999);

    while (current <= end) {
      // Check if date is within schedule validity
      if (current >= validFrom && current <= validUntil) {
        // Check if date is in exception list
        const dateStr = current.toISOString().split('T')[0];
        if (
          !schedule.exceptionDates ||
          !schedule.exceptionDates.includes(dateStr)
        ) {
          let shouldInclude = false;

          switch (schedule.recurrencePattern) {
            case RecurrencePattern.DAILY:
              shouldInclude = true;
              break;

            case RecurrencePattern.WEEKLY:
              const dayOfWeek = current.getDay();
              shouldInclude =
                schedule.daysOfWeek && schedule.daysOfWeek.includes(dayOfWeek);
              break;

            case RecurrencePattern.BIWEEKLY:
              const weeksDiff = Math.floor(
                (current.getTime() - validFrom.getTime()) /
                  (7 * 24 * 60 * 60 * 1000),
              );
              if (schedule.daysOfWeek) {
                const dayOfWeek2 = current.getDay();
                shouldInclude =
                  weeksDiff % 2 === 0 &&
                  schedule.daysOfWeek.includes(dayOfWeek2);
              }
              break;

            case RecurrencePattern.MONTHLY:
              if (schedule.dayOfMonth) {
                shouldInclude = current.getDate() === schedule.dayOfMonth;
              }
              break;

            case RecurrencePattern.QUARTERLY:
              if (schedule.dayOfMonth) {
                const monthsSinceStart =
                  (current.getFullYear() - validFrom.getFullYear()) * 12 +
                  (current.getMonth() - validFrom.getMonth());
                shouldInclude =
                  monthsSinceStart % 3 === 0 &&
                  current.getDate() === schedule.dayOfMonth;
              }
              break;

            case RecurrencePattern.CUSTOM:
              // Custom logic can be extended
              shouldInclude = false;
              break;
          }

          if (shouldInclude) {
            dates.push(new Date(current));
          }
        }
      }

      // Move to next day
      current.setDate(current.getDate() + 1);
    }

    return dates;
  }

  /**
   * Generate interventions from a schedule for a date range
   */
  async generateInterventions(
    scheduleId: string,
    dto: GenerateInterventionsDto,
  ): Promise<GenerationResult> {
    const schedule = await this.findOne(scheduleId);

    if (schedule.status !== ScheduleStatus.ACTIVE) {
      throw new BadRequestException('Cannot generate from inactive schedule');
    }

    const startDate = new Date(dto.startDate);
    const endDate = dto.daysAhead
      ? new Date(startDate.getTime() + dto.daysAhead * 24 * 60 * 60 * 1000)
      : new Date(dto.endDate);

    const dates = this.calculateScheduleDates(schedule, startDate, endDate);

    const result: GenerationResult = {
      generated: 0,
      skipped: 0,
      errors: [],
      interventionIds: [],
    };

    for (const date of dates) {
      try {
        // Check if intervention already exists for this date
        const existing = await this.interventionRepository.findOne({
          where: {
            contractId: schedule.contractId,
            siteId: schedule.siteId,
            scheduledDate: date,
          },
        });

        if (existing) {
          result.skipped++;
          continue;
        }

        // Generate intervention code
        const interventionCode = await this.generateInterventionCode();

        // Create intervention
        const intervention = this.interventionRepository.create({
          interventionCode,
          contractId: schedule.contractId,
          siteId: schedule.siteId,
          scheduledDate: date,
          scheduledStartTime: schedule.startTime,
          scheduledEndTime: schedule.endTime,
          status: InterventionStatus.SCHEDULED,
          assignedZoneChiefId: schedule.defaultZoneChiefId,
          assignedTeamChiefId: schedule.defaultTeamChiefId,
          assignedAgentIds: schedule.defaultAgentIds || [],
        });

        const saved = await this.interventionRepository.save(intervention);

        // Track generated intervention
        if (!schedule.generatedInterventionIds) {
          schedule.generatedInterventionIds = [];
        }
        schedule.generatedInterventionIds.push(saved.id);

        result.generated++;
        result.interventionIds.push(saved.id);
      } catch (error) {
        result.errors.push(`Failed to generate for ${date.toISOString()}: ${error.message}`);
      }
    }

    // Update schedule with generated intervention IDs
    await this.scheduleRepository.save(schedule);

    return result;
  }

  /**
   * Generate interventions from all active schedules
   */
  async generateAllInterventions(
    dto: GenerateInterventionsDto,
  ): Promise<{ [scheduleId: string]: GenerationResult }> {
    const schedules = await this.scheduleRepository.find({
      where: { status: ScheduleStatus.ACTIVE },
    });

    const results: { [scheduleId: string]: GenerationResult } = {};

    for (const schedule of schedules) {
      results[schedule.id] = await this.generateInterventions(schedule.id, dto);
    }

    return results;
  }

  /**
   * Get daily schedules for a specific date
   */
  async getDailySchedules(date: Date): Promise<Schedule[]> {
    const dateObj = new Date(date);
    dateObj.setHours(0, 0, 0, 0);

    return await this.scheduleRepository
      .createQueryBuilder('schedule')
      .where('schedule.status = :status', { status: ScheduleStatus.ACTIVE })
      .andWhere('schedule.valid_from <= :date', { date: dateObj })
      .andWhere(
        '(schedule.valid_until IS NULL OR schedule.valid_until >= :date)',
        { date: dateObj },
      )
      .leftJoinAndSelect('schedule.contract', 'contract')
      .leftJoinAndSelect('schedule.site', 'site')
      .leftJoinAndSelect('schedule.zone', 'zone')
      .getMany();
  }

  /**
   * Get schedules for a specific zone
   */
  async getZoneSchedules(zoneId: string): Promise<Schedule[]> {
    return await this.scheduleRepository.find({
      where: { zoneId, status: ScheduleStatus.ACTIVE },
      relations: ['contract', 'site', 'zone'],
      order: { validFrom: 'ASC' },
    });
  }

  /**
   * Pause a schedule
   */
  async pause(id: string): Promise<Schedule> {
    const schedule = await this.findOne(id);
    schedule.status = ScheduleStatus.PAUSED;
    return await this.scheduleRepository.save(schedule);
  }

  /**
   * Resume a schedule
   */
  async resume(id: string): Promise<Schedule> {
    const schedule = await this.findOne(id);
    schedule.status = ScheduleStatus.ACTIVE;
    return await this.scheduleRepository.save(schedule);
  }
}
