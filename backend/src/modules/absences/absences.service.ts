import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Absence } from './entities/absence.entity';
import { User } from '../users/entities/user.entity';
import { AgentZoneAssignment } from '../zones/entities/agent-zone-assignment.entity';
import { CreateAbsenceDto, UpdateAbsenceDto, ReviewAbsenceDto } from './dto';
import {
  AbsenceType,
  AbsenceStatus,
  AbsenceBalance,
} from '../../shared/types/absence.types';
import { UserRole } from '../../shared/types/user.types';

@Injectable()
export class AbsencesService {
  constructor(
    @InjectRepository(Absence)
    private readonly absenceRepository: Repository<Absence>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(AgentZoneAssignment)
    private readonly agentZoneAssignmentRepository: Repository<AgentZoneAssignment>,
  ) {}

  /**
   * Calculate working days between two dates (excluding weekends)
   */
  private calculateWorkingDays(startDate: Date, endDate: Date): number {
    let count = 0;
    const current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
      const dayOfWeek = current.getDay();
      // Exclude Sundays (0) and Saturdays (6)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    return count;
  }

  /**
   * Create a new absence request
   */
  async create(createAbsenceDto: CreateAbsenceDto): Promise<Absence> {
    // Verify agent exists
    const agent = await this.userRepository.findOne({
      where: { id: createAbsenceDto.agentId },
    });

    if (!agent) {
      throw new NotFoundException(
        `Agent with ID ${createAbsenceDto.agentId} not found`,
      );
    }

    // Verify agent role
    if (agent.role !== UserRole.AGENT && agent.role !== UserRole.SUPERVISOR) {
      throw new BadRequestException(
        'Only agents and supervisors can request absences',
      );
    }

    // Validate dates
    const startDate = new Date(createAbsenceDto.startDate);
    const endDate = new Date(createAbsenceDto.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDate > endDate) {
      throw new BadRequestException('End date must be after start date');
    }

    // Check for overlapping absences
    const overlappingAbsences = await this.absenceRepository.find({
      where: {
        agentId: createAbsenceDto.agentId,
        status: AbsenceStatus.APPROVED,
      },
    });

    for (const absence of overlappingAbsences) {
      const existingStart = new Date(absence.startDate);
      const existingEnd = new Date(absence.endDate);

      if (
        (startDate >= existingStart && startDate <= existingEnd) ||
        (endDate >= existingStart && endDate <= existingEnd) ||
        (startDate <= existingStart && endDate >= existingEnd)
      ) {
        throw new BadRequestException(
          `Absence overlaps with existing approved absence from ${existingStart.toDateString()} to ${existingEnd.toDateString()}`,
        );
      }
    }

    // Calculate total working days
    const totalDays = this.calculateWorkingDays(startDate, endDate);

    // Create absence
    const absence = this.absenceRepository.create({
      ...createAbsenceDto,
      totalDays,
      status: AbsenceStatus.PENDING,
      requestedAt: new Date(),
    });

    return this.absenceRepository.save(absence);
  }

  /**
   * Get all absences with filters
   */
  async findAll(
    agentId?: string,
    zoneId?: string,
    type?: AbsenceType,
    status?: AbsenceStatus,
    dateFrom?: string,
    dateTo?: string,
  ): Promise<Absence[]> {
    const queryBuilder = this.absenceRepository
      .createQueryBuilder('absence')
      .leftJoinAndSelect('absence.agent', 'agent')
      .leftJoinAndSelect('absence.reviewer', 'reviewer');

    if (agentId) {
      queryBuilder.andWhere('absence.agentId = :agentId', { agentId });
    }

    if (zoneId) {
      // Find agents in this zone
      const assignments = await this.agentZoneAssignmentRepository.find({
        where: { zoneId, isActive: true },
      });
      const agentIds = assignments.map((a) => a.agentId);

      if (agentIds.length > 0) {
        queryBuilder.andWhere('absence.agentId IN (:...agentIds)', { agentIds });
      } else {
        // No agents in zone, return empty
        return [];
      }
    }

    if (type) {
      queryBuilder.andWhere('absence.absenceType = :type', { type });
    }

    if (status) {
      queryBuilder.andWhere('absence.status = :status', { status });
    }

    if (dateFrom) {
      queryBuilder.andWhere('absence.endDate >= :dateFrom', {
        dateFrom: new Date(dateFrom),
      });
    }

    if (dateTo) {
      queryBuilder.andWhere('absence.startDate <= :dateTo', {
        dateTo: new Date(dateTo),
      });
    }

    queryBuilder.orderBy('absence.startDate', 'DESC');

    return queryBuilder.getMany();
  }

  /**
   * Get pending absences (for approval)
   */
  async findPending(): Promise<Absence[]> {
    return this.absenceRepository.find({
      where: { status: AbsenceStatus.PENDING },
      relations: ['agent', 'reviewer'],
      order: { requestedAt: 'ASC' },
    });
  }

  /**
   * Get single absence by ID
   */
  async findOne(id: string): Promise<Absence> {
    const absence = await this.absenceRepository.findOne({
      where: { id },
      relations: ['agent', 'reviewer'],
    });

    if (!absence) {
      throw new NotFoundException(`Absence with ID ${id} not found`);
    }

    return absence;
  }

  /**
   * Update absence (only if PENDING)
   */
  async update(
    id: string,
    updateAbsenceDto: UpdateAbsenceDto,
    userId: string,
  ): Promise<Absence> {
    const absence = await this.findOne(id);

    // Only agent can update their own absence
    if (absence.agentId !== userId) {
      throw new ForbiddenException(
        'You can only update your own absence requests',
      );
    }

    // Cannot update if already reviewed
    if (absence.status !== AbsenceStatus.PENDING) {
      throw new BadRequestException(
        `Cannot update absence with status ${absence.status}`,
      );
    }

    // If dates changed, recalculate working days
    if (updateAbsenceDto.startDate || updateAbsenceDto.endDate) {
      const startDate = new Date(
        updateAbsenceDto.startDate || absence.startDate,
      );
      const endDate = new Date(updateAbsenceDto.endDate || absence.endDate);

      if (startDate > endDate) {
        throw new BadRequestException('End date must be after start date');
      }

      updateAbsenceDto['totalDays'] = this.calculateWorkingDays(
        startDate,
        endDate,
      );
    }

    Object.assign(absence, updateAbsenceDto);
    return this.absenceRepository.save(absence);
  }

  /**
   * Review absence (approve/reject)
   */
  async review(
    id: string,
    reviewAbsenceDto: ReviewAbsenceDto,
    reviewerId: string,
  ): Promise<Absence> {
    const absence = await this.findOne(id);

    // Check reviewer role
    const reviewer = await this.userRepository.findOne({
      where: { id: reviewerId },
    });

    if (!reviewer) {
      throw new NotFoundException(`Reviewer with ID ${reviewerId} not found`);
    }

    // Only Supervisors and above can review
    const allowedRoles = [
      UserRole.SUPER_ADMIN,
      UserRole.SUPERVISOR,
    ];

    if (!allowedRoles.includes(reviewer.role)) {
      throw new ForbiddenException(
        'You do not have permission to review absences',
      );
    }

    // Cannot review if not PENDING
    if (absence.status !== AbsenceStatus.PENDING) {
      throw new BadRequestException(
        `Cannot review absence with status ${absence.status}`,
      );
    }

    // Validate new status
    if (
      reviewAbsenceDto.status !== AbsenceStatus.APPROVED &&
      reviewAbsenceDto.status !== AbsenceStatus.REJECTED
    ) {
      throw new BadRequestException(
        'Review status must be APPROVED or REJECTED',
      );
    }

    // Update absence
    absence.status = reviewAbsenceDto.status;
    absence.reviewedBy = reviewerId;
    absence.reviewedAt = new Date();
    absence.reviewNotes = reviewAbsenceDto.reviewNotes || null;

    return this.absenceRepository.save(absence);
  }

  /**
   * Cancel absence (agent self-cancellation)
   */
  async cancel(id: string, agentId: string): Promise<Absence> {
    const absence = await this.findOne(id);

    // Only agent can cancel their own absence
    if (absence.agentId !== agentId) {
      throw new ForbiddenException('You can only cancel your own absences');
    }

    // Cannot cancel if already started or rejected
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(absence.startDate);

    if (startDate < today) {
      throw new BadRequestException(
        'Cannot cancel absence that has already started',
      );
    }

    if (absence.status === AbsenceStatus.REJECTED) {
      throw new BadRequestException('Cannot cancel rejected absence');
    }

    absence.status = AbsenceStatus.CANCELLED;
    return this.absenceRepository.save(absence);
  }

  /**
   * Delete absence (soft delete)
   */
  async remove(id: string): Promise<void> {
    const absence = await this.findOne(id);
    await this.absenceRepository.softRemove(absence);
  }

  /**
   * Get absence balance for an agent
   */
  async getBalance(agentId: string, year: number): Promise<AbsenceBalance> {
    const agent = await this.userRepository.findOne({
      where: { id: agentId },
    });

    if (!agent) {
      throw new NotFoundException(`Agent with ID ${agentId} not found`);
    }

    // Get all approved absences for the year
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31);

    const absences = await this.absenceRepository.find({
      where: {
        agentId,
        status: AbsenceStatus.APPROVED,
      },
    });

    // Filter by year and calculate totals
    let vacationDaysUsed = 0;
    let sickDaysUsed = 0;
    let unpaidDaysUsed = 0;
    let authorizedDaysUsed = 0;

    for (const absence of absences) {
      const absenceStart = new Date(absence.startDate);
      const absenceEnd = new Date(absence.endDate);

      // Check if absence overlaps with the year
      if (absenceEnd >= yearStart && absenceStart <= yearEnd) {
        switch (absence.absenceType) {
          case AbsenceType.VACATION:
            vacationDaysUsed += absence.totalDays;
            break;
          case AbsenceType.SICK_LEAVE:
            sickDaysUsed += absence.totalDays;
            break;
          case AbsenceType.UNPAID:
            unpaidDaysUsed += absence.totalDays;
            break;
          case AbsenceType.AUTHORIZED:
            authorizedDaysUsed += absence.totalDays;
            break;
        }
      }
    }

    // Standard allocation: 25 vacation days per year (French law)
    const vacationDaysAllocated = 25;
    const vacationDaysRemaining = vacationDaysAllocated - vacationDaysUsed;

    return {
      year,
      vacationDaysAllocated,
      vacationDaysUsed,
      vacationDaysRemaining: Math.max(0, vacationDaysRemaining),
      sickDaysUsed,
      unpaidDaysUsed,
      authorizedDaysUsed,
    };
  }

  /**
   * Get calendar view of absences for a date range
   */
  async getCalendar(
    zoneId: string | undefined,
    dateFrom: string,
    dateTo: string,
  ): Promise<Absence[]> {
    return this.findAll(
      undefined,
      zoneId,
      undefined,
      AbsenceStatus.APPROVED,
      dateFrom,
      dateTo,
    );
  }
}
