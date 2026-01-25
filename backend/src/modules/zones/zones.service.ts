import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Zone } from './entities/zone.entity';
import { SiteAssignment } from './entities/site-assignment.entity';
import { AgentZoneAssignment } from './entities/agent-zone-assignment.entity';
import { Site } from '../sites/entities/site.entity';
import { User } from '../users/entities/user.entity';
import {
  CreateZoneDto,
  UpdateZoneDto,
  AssignSiteDto,
  AssignAgentDto,
} from './dto';
import { UserRole } from '../../shared/types/user.types';

@Injectable()
export class ZonesService {
  constructor(
    @InjectRepository(Zone)
    private readonly zoneRepository: Repository<Zone>,
    @InjectRepository(SiteAssignment)
    private readonly siteAssignmentRepository: Repository<SiteAssignment>,
    @InjectRepository(AgentZoneAssignment)
    private readonly agentAssignmentRepository: Repository<AgentZoneAssignment>,
    @InjectRepository(Site)
    private readonly siteRepository: Repository<Site>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Validate zone chief user
   */
  private async validateZoneChief(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (user.role !== UserRole.SUPERVISOR) {
      throw new BadRequestException(
        `User ${userId} must have SUPERVISOR role`,
      );
    }
  }

  /**
   * Validate team chief user
   */
  private async validateTeamChief(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (user.role !== UserRole.SUPERVISOR) {
      throw new BadRequestException(
        `User ${userId} must have SUPERVISOR role`,
      );
    }
  }

  /**
   * Validate agent user
   */
  private async validateAgent(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (user.role !== UserRole.AGENT) {
      throw new BadRequestException(`User ${userId} must have AGENT role`);
    }
  }

  /**
   * Create a new zone
   */
  async create(createZoneDto: CreateZoneDto): Promise<Zone> {
    // Check if zone code already exists
    const existingZone = await this.zoneRepository.findOne({
      where: { zoneCode: createZoneDto.zoneCode },
    });

    if (existingZone) {
      throw new ConflictException(
        `Zone with code ${createZoneDto.zoneCode} already exists`,
      );
    }

    // Validate zone chief if provided
    if (createZoneDto.zoneChiefId) {
      await this.validateZoneChief(createZoneDto.zoneChiefId);
    }

    const zone = this.zoneRepository.create(createZoneDto);
    return await this.zoneRepository.save(zone);
  }

  /**
   * Get all zones with optional filters
   */
  async findAll(includeDeleted: boolean = false): Promise<Zone[]> {
    return await this.zoneRepository.find({
      relations: ['zoneChief'],
      withDeleted: includeDeleted,
      order: { zoneName: 'ASC' },
    });
  }

  /**
   * Get a single zone by ID
   */
  async findOne(id: string): Promise<Zone> {
    const zone = await this.zoneRepository.findOne({
      where: { id },
      relations: ['zoneChief'],
    });

    if (!zone) {
      throw new NotFoundException(`Zone with ID ${id} not found`);
    }

    return zone;
  }

  /**
   * Update a zone
   */
  async update(id: string, updateZoneDto: UpdateZoneDto): Promise<Zone> {
    const zone = await this.findOne(id);

    // Check zone code uniqueness if being updated
    if (
      updateZoneDto.zoneCode &&
      updateZoneDto.zoneCode !== zone.zoneCode
    ) {
      const existingZone = await this.zoneRepository.findOne({
        where: { zoneCode: updateZoneDto.zoneCode },
      });

      if (existingZone) {
        throw new ConflictException(
          `Zone with code ${updateZoneDto.zoneCode} already exists`,
        );
      }
    }

    // Validate zone chief if being updated
    if (updateZoneDto.zoneChiefId) {
      await this.validateZoneChief(updateZoneDto.zoneChiefId);
    }

    Object.assign(zone, updateZoneDto);
    return await this.zoneRepository.save(zone);
  }

  /**
   * Soft delete a zone
   */
  async remove(id: string): Promise<void> {
    await this.findOne(id); // Validate zone exists

    // Check if zone has active assignments
    const activeSiteAssignments = await this.siteAssignmentRepository.count({
      where: { zoneId: id, isActive: true },
    });

    const activeAgentAssignments = await this.agentAssignmentRepository.count({
      where: { zoneId: id, isActive: true },
    });

    if (activeSiteAssignments > 0 || activeAgentAssignments > 0) {
      throw new BadRequestException(
        'Cannot delete zone with active assignments. Please reassign sites and agents first.',
      );
    }

    await this.zoneRepository.softDelete(id);
  }

  /**
   * Assign a site to a zone
   */
  async assignSite(zoneId: string, assignDto: AssignSiteDto): Promise<SiteAssignment> {
    await this.findOne(zoneId); // Validate zone exists

    // Validate site exists
    const site = await this.siteRepository.findOne({
      where: { id: assignDto.siteId },
    });

    if (!site) {
      throw new NotFoundException(`Site with ID ${assignDto.siteId} not found`);
    }

    // Validate team chief if provided
    if (assignDto.teamChiefId) {
      await this.validateTeamChief(assignDto.teamChiefId);
    }

    // Check if site is already actively assigned to another zone
    const existingAssignment = await this.siteAssignmentRepository.findOne({
      where: {
        siteId: assignDto.siteId,
        isActive: true,
      },
    });

    if (existingAssignment) {
      // Deactivate old assignment
      existingAssignment.isActive = false;
      existingAssignment.endDate = new Date();
      await this.siteAssignmentRepository.save(existingAssignment);
    }

    // Create new assignment
    const assignment = this.siteAssignmentRepository.create({
      zoneId,
      ...assignDto,
      isActive: true,
    });

    return await this.siteAssignmentRepository.save(assignment);
  }

  /**
   * Assign an agent to a zone
   */
  async assignAgent(
    zoneId: string,
    assignDto: AssignAgentDto,
  ): Promise<AgentZoneAssignment> {
    await this.findOne(zoneId); // Validate zone exists

    // Validate agent
    await this.validateAgent(assignDto.agentId);

    // Validate team chief if provided
    if (assignDto.teamChiefId) {
      await this.validateTeamChief(assignDto.teamChiefId);
    }

    // Check if agent is already actively assigned to another zone
    const existingAssignment = await this.agentAssignmentRepository.findOne({
      where: {
        agentId: assignDto.agentId,
        isActive: true,
      },
    });

    if (existingAssignment) {
      // Deactivate old assignment
      existingAssignment.isActive = false;
      existingAssignment.endDate = new Date();
      await this.agentAssignmentRepository.save(existingAssignment);
    }

    // Create new assignment
    const assignment = this.agentAssignmentRepository.create({
      zoneId,
      ...assignDto,
      isActive: true,
    });

    return await this.agentAssignmentRepository.save(assignment);
  }

  /**
   * Assign a team chief to a zone
   */
  async assignTeamChief(
    zoneId: string,
    teamChiefId: string,
  ): Promise<Zone> {
    await this.findOne(zoneId); // Validate zone exists

    // Validate team chief
    await this.validateTeamChief(teamChiefId);

    // Note: We don't track team chief at zone level, only through assignments
    // This method could be used to assign team chief to specific sites in the zone
    throw new BadRequestException(
      'Team chiefs are assigned to specific sites within zones. Use assignSite endpoint.',
    );
  }

  /**
   * Get all sites assigned to a zone
   */
  async getZoneSites(zoneId: string): Promise<SiteAssignment[]> {
    await this.findOne(zoneId); // Validate zone exists

    return await this.siteAssignmentRepository.find({
      where: { zoneId, isActive: true },
      relations: ['site', 'teamChief'],
      order: { startDate: 'DESC' },
    });
  }

  /**
   * Get all agents assigned to a zone
   */
  async getZoneAgents(zoneId: string): Promise<AgentZoneAssignment[]> {
    await this.findOne(zoneId); // Validate zone exists

    return await this.agentAssignmentRepository.find({
      where: { zoneId, isActive: true },
      relations: ['agent', 'teamChief'],
      order: { startDate: 'DESC' },
    });
  }

  /**
   * Get zone performance metrics (placeholder for future implementation)
   */
  async getZonePerformance(zoneId: string): Promise<any> {
    await this.findOne(zoneId); // Validate zone exists

    const sitesCount = await this.siteAssignmentRepository.count({
      where: { zoneId, isActive: true },
    });

    const agentsCount = await this.agentAssignmentRepository.count({
      where: { zoneId, isActive: true },
    });

    return {
      zoneId,
      totalSites: sitesCount,
      totalAgents: agentsCount,
      // Future: Add intervention completion rate, quality scores, etc.
    };
  }

  /**
   * Unassign a site from zone (deactivate assignment)
   */
  async unassignSite(assignmentId: string): Promise<void> {
    const assignment = await this.siteAssignmentRepository.findOne({
      where: { id: assignmentId },
    });

    if (!assignment) {
      throw new NotFoundException(`Assignment with ID ${assignmentId} not found`);
    }

    assignment.isActive = false;
    assignment.endDate = new Date();
    await this.siteAssignmentRepository.save(assignment);
  }

  /**
   * Unassign an agent from zone (deactivate assignment)
   */
  async unassignAgent(assignmentId: string): Promise<void> {
    const assignment = await this.agentAssignmentRepository.findOne({
      where: { id: assignmentId },
    });

    if (!assignment) {
      throw new NotFoundException(`Assignment with ID ${assignmentId} not found`);
    }

    assignment.isActive = false;
    assignment.endDate = new Date();
    await this.agentAssignmentRepository.save(assignment);
  }
}
