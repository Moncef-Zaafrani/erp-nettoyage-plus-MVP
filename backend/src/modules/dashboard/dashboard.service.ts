import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Client } from '../clients/entities/client.entity';
import { Site } from '../sites/entities/site.entity';
import { Contract } from '../contracts/entities/contract.entity';
import { Zone } from '../zones/entities/zone.entity';
import { Intervention } from '../interventions/entities/intervention.entity';
import { ChecklistInstance } from '../checklists/entities/checklist-instance.entity';
import { Absence } from '../absences/entities/absence.entity';
import {
  DashboardSummary,
  InterventionSummary,
  ZonePerformance,
  RecentActivity,
  DailyReport,
  WeeklyReport,
  MonthlyReport,
  KPIMetrics,
  SiteVisit,
} from '../../shared/types/dashboard.types';
import { UserRole, UserStatus } from '../../shared/types/user.types';
import { ClientStatus } from '../../shared/types/client.types';
import { SiteStatus } from '../../shared/types/site.types';
import { ContractStatus } from '../../shared/types/contract.types';
import { InterventionStatus } from '../../shared/types/intervention.types';
import { AbsenceStatus } from '../../shared/types/absence.types';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
    @InjectRepository(Site)
    private readonly siteRepository: Repository<Site>,
    @InjectRepository(Contract)
    private readonly contractRepository: Repository<Contract>,
    @InjectRepository(Zone)
    private readonly zoneRepository: Repository<Zone>,
    @InjectRepository(Intervention)
    private readonly interventionRepository: Repository<Intervention>,
    @InjectRepository(ChecklistInstance)
    private readonly checklistRepository: Repository<ChecklistInstance>,
    @InjectRepository(Absence)
    private readonly absenceRepository: Repository<Absence>,
  ) {}

  /**
   * Get dashboard summary statistics
   */
  async getSummary(): Promise<DashboardSummary> {
    const [
      totalClients,
      activeClients,
      totalSites,
      activeSites,
      totalContracts,
      activeContracts,
      totalInterventions,
      completedInterventions,
      totalAgents,
      activeAgents,
      pendingAbsences,
    ] = await Promise.all([
      this.clientRepository.count(),
      this.clientRepository.count({
        where: { status: ClientStatus.ACTIVE },
      }),
      this.siteRepository.count(),
      this.siteRepository.count({
        where: { status: SiteStatus.ACTIVE },
      }),
      this.contractRepository.count(),
      this.contractRepository.count({
        where: { status: ContractStatus.ACTIVE },
      }),
      this.interventionRepository.count(),
      this.interventionRepository.count({
        where: { status: InterventionStatus.COMPLETED },
      }),
      this.userRepository.count({
        where: { role: UserRole.AGENT },
      }),
      this.userRepository.count({
        where: { role: UserRole.AGENT, status: UserStatus.ACTIVE },
      }),
      this.absenceRepository.count({
        where: { status: AbsenceStatus.PENDING },
      }),
    ]);

    return {
      totalClients,
      activeClients,
      totalSites,
      activeSites,
      totalContracts,
      activeContracts,
      totalInterventions,
      completedInterventions,
      totalAgents,
      activeAgents,
      pendingAbsences,
    };
  }

  /**
   * Get today's interventions
   */
  async getInterventionsToday(): Promise<InterventionSummary[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const interventions = await this.interventionRepository.find({
      where: {
        scheduledDate: Between(today, tomorrow),
      },
      relations: ['site', 'contract', 'contract.client'],
      order: { scheduledStartTime: 'ASC' },
    });

    return interventions.map((intervention) => ({
      id: intervention.id,
      interventionCode: intervention.interventionCode,
      siteName: intervention.site?.name || 'Unknown',
      clientName: intervention.contract?.client?.name || 'Unknown',
      scheduledDate: intervention.scheduledDate,
      scheduledStartTime: intervention.scheduledStartTime,
      scheduledEndTime: intervention.scheduledEndTime,
      status: intervention.status,
      assignedAgents: intervention.assignedAgentIds?.length || 0,
      checklistCompleted: intervention.checklistCompleted,
    }));
  }

  /**
   * Get this week's interventions
   */
  async getInterventionsWeek(): Promise<InterventionSummary[]> {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    const interventions = await this.interventionRepository.find({
      where: {
        scheduledDate: Between(startOfWeek, endOfWeek),
      },
      relations: ['site', 'contract', 'contract.client'],
      order: { scheduledDate: 'ASC', scheduledStartTime: 'ASC' },
    });

    return interventions.map((intervention) => ({
      id: intervention.id,
      interventionCode: intervention.interventionCode,
      siteName: intervention.site?.name || 'Unknown',
      clientName: intervention.contract?.client?.name || 'Unknown',
      scheduledDate: intervention.scheduledDate,
      scheduledStartTime: intervention.scheduledStartTime,
      scheduledEndTime: intervention.scheduledEndTime,
      status: intervention.status,
      assignedAgents: intervention.assignedAgentIds?.length || 0,
      checklistCompleted: intervention.checklistCompleted,
    }));
  }

  /**
   * Get zone performance metrics
   */
  async getZonePerformance(zoneId: string): Promise<ZonePerformance> {
    const zone = await this.zoneRepository.findOne({
      where: { id: zoneId },
    });

    if (!zone) {
      throw new NotFoundException(`Zone with ID ${zoneId} not found`);
    }

    // Get current month date range
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Count sites in this zone (would need site-zone assignment query)
    const totalSites = 0; // TODO: Query SiteAssignment entity when needed

    // Count agents in this zone (would need agent-zone assignment query)
    const totalAgents = 0; // TODO: Query AgentZoneAssignment entity when needed

    // Get interventions for this month (would need zone-linked interventions)
    const interventionsThisMonth = await this.interventionRepository.count({
      where: {
        scheduledDate: Between(startOfMonth, endOfMonth),
      },
    });

    const completedInterventions = await this.interventionRepository.count({
      where: {
        scheduledDate: Between(startOfMonth, endOfMonth),
        status: InterventionStatus.COMPLETED,
      },
    });

    const completionRate =
      interventionsThisMonth > 0
        ? (completedInterventions / interventionsThisMonth) * 100
        : 0;

    // Calculate average quality score
    const completedWithScores = await this.interventionRepository.find({
      where: {
        scheduledDate: Between(startOfMonth, endOfMonth),
        status: InterventionStatus.COMPLETED,
      },
      select: ['qualityScore'],
    });

    const scoresWithValues = completedWithScores.filter(
      (i) => i.qualityScore !== null,
    );
    const averageQualityScore =
      scoresWithValues.length > 0
        ? scoresWithValues.reduce((sum, i) => sum + i.qualityScore!, 0) /
          scoresWithValues.length
        : 0;

    // Calculate checklist completion rate
    const checklists = await this.checklistRepository.find({
      where: {
        intervention: {
          scheduledDate: Between(startOfMonth, endOfMonth),
        },
      },
    });

    const completedChecklists = checklists.filter(
      (c) => c.completionPercentage === 100,
    );
    const checklistCompletionRate =
      checklists.length > 0
        ? (completedChecklists.length / checklists.length) * 100
        : 0;

    // Incidents count (would need incidents tracking)
    const incidentsCount = 0;

    return {
      zoneId: zone.id,
      zoneName: zone.zoneName,
      zoneCode: zone.zoneCode,
      totalSites,
      totalAgents,
      interventionsThisMonth,
      completedInterventions,
      completionRate: Math.round(completionRate * 100) / 100,
      averageQualityScore: Math.round(averageQualityScore * 100) / 100,
      checklistCompletionRate: Math.round(checklistCompletionRate * 100) / 100,
      incidentsCount,
    };
  }

  /**
   * Get recent activity feed
   */
  async getRecentActivity(limit: number = 20): Promise<RecentActivity[]> {
    const activities: RecentActivity[] = [];

    // Get recent interventions (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentInterventions = await this.interventionRepository.find({
      where: {
        createdAt: MoreThanOrEqual(sevenDaysAgo),
      },
      relations: ['site', 'contract', 'contract.client'],
      order: { createdAt: 'DESC' },
      take: limit / 2,
    });

    recentInterventions.forEach((intervention) => {
      if (intervention.status === InterventionStatus.COMPLETED) {
        activities.push({
          id: intervention.id,
          type: 'INTERVENTION_COMPLETED',
          title: 'Intervention Completed',
          description: `${intervention.interventionCode} at ${intervention.site?.name}`,
          timestamp: intervention.actualEndTime || intervention.updatedAt,
        });
      } else {
        activities.push({
          id: intervention.id,
          type: 'INTERVENTION_CREATED',
          title: 'Intervention Scheduled',
          description: `${intervention.interventionCode} at ${intervention.site?.name}`,
          timestamp: intervention.createdAt,
        });
      }
    });

    // Get recent absence requests
    const recentAbsences = await this.absenceRepository.find({
      where: {
        requestedAt: MoreThanOrEqual(sevenDaysAgo),
      },
      relations: ['agent'],
      order: { requestedAt: 'DESC' },
      take: limit / 4,
    });

    recentAbsences.forEach((absence) => {
      activities.push({
        id: absence.id,
        type: 'ABSENCE_REQUESTED',
        title: 'Absence Request',
        description: `${absence.agent?.firstName} ${absence.agent?.lastName} - ${absence.absenceType}`,
        timestamp: absence.requestedAt,
        userId: absence.agentId,
        userName: `${absence.agent?.firstName} ${absence.agent?.lastName}`,
      });
    });

    // Get recent clients
    const recentClients = await this.clientRepository.find({
      where: {
        createdAt: MoreThanOrEqual(sevenDaysAgo),
      },
      order: { createdAt: 'DESC' },
      take: limit / 4,
    });

    recentClients.forEach((client) => {
      activities.push({
        id: client.id,
        type: 'CLIENT_ADDED',
        title: 'New Client',
        description: `${client.name} - ${client.clientCode}`,
        timestamp: client.createdAt,
      });
    });

    // Sort all activities by timestamp descending
    activities.sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
    );

    return activities.slice(0, limit);
  }

  /**
   * Get daily report for a specific date and zone
   */
  async getDailyReport(date: Date, zoneId?: string): Promise<DailyReport[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const whereClause: any = {
      scheduledDate: Between(startOfDay, endOfDay),
      status: InterventionStatus.COMPLETED,
    };

    const interventions = await this.interventionRepository.find({
      where: whereClause,
      relations: ['site', 'zoneChief'],
    });

    // Group by zone
    const zoneGroups = new Map<string, any[]>();
    interventions.forEach((intervention) => {
      const zId = intervention.assignedZoneChiefId || 'unassigned';
      if (!zoneGroups.has(zId)) {
        zoneGroups.set(zId, []);
      }
      zoneGroups.get(zId)!.push(intervention);
    });

    const reports: DailyReport[] = [];

    for (const [zId, zoneInterventions] of zoneGroups) {
      const zone =
        zId !== 'unassigned'
          ? await this.zoneRepository.findOne({ where: { id: zId } })
          : null;

      const sitesVisited: SiteVisit[] = zoneInterventions.map(
        (intervention) => ({
          siteId: intervention.siteId,
          siteName: intervention.site?.name || 'Unknown',
          interventionId: intervention.id,
          checkInTime: intervention.actualStartTime!,
          checkOutTime: intervention.actualEndTime!,
          agentsPresent: intervention.assignedAgentIds || [],
          checklistCompleted: intervention.checklistCompleted,
          qualityScore: intervention.qualityScore || 0,
          issues: intervention.incidents ? [intervention.incidents] : [],
        }),
      );

      const completedChecklists = zoneInterventions.filter(
        (i) => i.checklistCompleted,
      ).length;
      const checklistCompletionRate =
        zoneInterventions.length > 0
          ? (completedChecklists / zoneInterventions.length) * 100
          : 0;

      reports.push({
        date: startOfDay,
        zoneId: zone?.id || 'unassigned',
        zoneName: zone?.zoneName || 'Unassigned',
        zoneChief:
          zoneInterventions[0]?.zoneChief?.firstName || 'Not Assigned',
        sitesVisited,
        issuesFound: [],
        checklistCompletionRate: Math.round(checklistCompletionRate),
        uniformCompliance: true,
        stockAvailability: 'Adequate',
        incidentsCount: zoneInterventions.filter((i) => i.incidents).length,
        summary: `Completed ${zoneInterventions.length} interventions`,
      });
    }

    return zoneId
      ? reports.filter((r) => r.zoneId === zoneId)
      : reports;
  }

  /**
   * Get weekly report
   */
  async getWeeklyReport(
    startDate: Date,
    zoneId?: string,
  ): Promise<WeeklyReport> {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);

    const interventions = await this.interventionRepository.find({
      where: {
        scheduledDate: Between(startDate, endDate),
      },
      relations: ['site'],
    });

    const filteredInterventions = zoneId
      ? interventions // TODO: filter by zone when zone relation added
      : interventions;

    const totalInterventions = filteredInterventions.length;
    const completedInterventions = filteredInterventions.filter(
      (i) => i.status === InterventionStatus.COMPLETED,
    ).length;
    const completionRate =
      totalInterventions > 0
        ? (completedInterventions / totalInterventions) * 100
        : 0;

    const qualityScores = filteredInterventions
      .filter((i) => i.qualityScore !== null)
      .map((i) => i.qualityScore!);
    const averageQualityScore =
      qualityScores.length > 0
        ? qualityScores.reduce((sum, score) => sum + score, 0) /
          qualityScores.length
        : 0;

    const totalIncidents = filteredInterventions.filter(
      (i) => i.incidents,
    ).length;
    const sitesCovered = new Set(filteredInterventions.map((i) => i.siteId))
      .size;

    return {
      weekStart: startDate,
      weekEnd: endDate,
      zoneId: zoneId || 'all',
      zoneName: zoneId ? 'Zone' : 'All Zones',
      totalInterventions,
      completedInterventions,
      completionRate: Math.round(completionRate * 100) / 100,
      averageQualityScore: Math.round(averageQualityScore * 100) / 100,
      totalIncidents,
      sitesCovered,
      agentUtilization: [],
      topPerformers: [],
      areasForImprovement: [],
    };
  }

  /**
   * Get monthly report
   */
  async getMonthlyReport(year: number, month: number): Promise<MonthlyReport> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const [
      totalClients,
      totalContracts,
      interventions,
    ] = await Promise.all([
      this.clientRepository.count({ where: { status: ClientStatus.ACTIVE } }),
      this.contractRepository.count({
        where: { status: ContractStatus.ACTIVE },
      }),
      this.interventionRepository.find({
        where: {
          scheduledDate: Between(startDate, endDate),
        },
      }),
    ]);

    const totalInterventions = interventions.length;
    const completed = interventions.filter(
      (i) => i.status === InterventionStatus.COMPLETED,
    );
    const completionRate =
      totalInterventions > 0 ? (completed.length / totalInterventions) * 100 : 0;

    const qualityScores = completed
      .filter((i) => i.qualityScore !== null)
      .map((i) => i.qualityScore!);
    const averageQualityScore =
      qualityScores.length > 0
        ? qualityScores.reduce((sum, score) => sum + score, 0) /
          qualityScores.length
        : 0;

    const clientRatings = completed
      .filter((i) => i.clientRating !== null)
      .map((i) => i.clientRating!);
    const clientSatisfaction =
      clientRatings.length > 0
        ? clientRatings.reduce((sum, rating) => sum + rating, 0) /
          clientRatings.length
        : 0;

    return {
      month,
      year,
      totalClients,
      totalContracts,
      totalInterventions,
      completionRate: Math.round(completionRate * 100) / 100,
      averageQualityScore: Math.round(averageQualityScore * 100) / 100,
      clientSatisfaction: Math.round(clientSatisfaction * 100) / 100,
      totalRevenue: 0, // TODO: Calculate from contracts/pricing
      zonePerformance: [],
      kpis: await this.getKPIMetrics('OVERALL', startDate, endDate),
    };
  }

  /**
   * Get KPI metrics by role type
   */
  async getKPIMetrics(
    roleType: 'SUPERVISOR' | 'AGENT' | 'OVERALL',
    startDate?: Date,
    endDate?: Date,
  ): Promise<KPIMetrics> {
    const start = startDate || new Date(new Date().setDate(1)); // Start of current month
    const end = endDate || new Date(); // Today

    const interventions = await this.interventionRepository.find({
      where: {
        scheduledDate: Between(start, end),
      },
    });

    const totalInterventions = interventions.length;
    const completed = interventions.filter(
      (i) => i.status === InterventionStatus.COMPLETED,
    );

    const interventionCompletionRate =
      totalInterventions > 0 ? (completed.length / totalInterventions) * 100 : 0;

    const withChecklists = completed.filter((i) => i.checklistCompleted);
    const checklistCompletionRate =
      completed.length > 0 ? (withChecklists.length / completed.length) * 100 : 0;

    const qualityScores = completed
      .filter((i) => i.qualityScore !== null)
      .map((i) => i.qualityScore!);
    const averageQualityScore =
      qualityScores.length > 0
        ? qualityScores.reduce((sum, score) => sum + score, 0) /
          qualityScores.length
        : 0;

    const clientRatings = completed
      .filter((i) => i.clientRating !== null)
      .map((i) => i.clientRating!);
    const clientSatisfactionRate =
      clientRatings.length > 0
        ? (clientRatings.reduce((sum, rating) => sum + rating, 0) /
            clientRatings.length /
            5) *
          100
        : 0;

    const incidentRate =
      totalInterventions > 0
        ? (interventions.filter((i) => i.incidents).length /
            totalInterventions) *
          100
        : 0;

    const absences = await this.absenceRepository.count({
      where: {
        startDate: Between(start, end),
        status: AbsenceStatus.APPROVED,
      },
    });

    const totalAgents = await this.userRepository.count({
      where: { role: UserRole.AGENT },
    });

    const workingDays = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
    );
    const absenceRate =
      totalAgents > 0 && workingDays > 0
        ? (absences / (totalAgents * workingDays)) * 100
        : 0;

    return {
      roleType,
      interventionCompletionRate:
        Math.round(interventionCompletionRate * 100) / 100,
      checklistCompletionRate:
        Math.round(checklistCompletionRate * 100) / 100,
      averageQualityScore: Math.round(averageQualityScore * 100) / 100,
      clientSatisfactionRate:
        Math.round(clientSatisfactionRate * 100) / 100,
      incidentRate: Math.round(incidentRate * 100) / 100,
      absenceRate: Math.round(absenceRate * 100) / 100,
      responseTime: 0, // TODO: Calculate from intervention creation to completion
    };
  }
}
