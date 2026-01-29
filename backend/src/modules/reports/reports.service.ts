import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report, ReportStatus } from './entities/report.entity';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto, ResolveReportDto } from './dto/update-report.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';
import { UsersService } from '../users/users.service';
import { UserRole } from '../../shared/types/user.types';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
    private readonly notificationsService: NotificationsService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Create a new report and notify the appropriate recipient
   */
  async create(reporterId: string, createReportDto: CreateReportDto): Promise<Report> {
    // Get reporter info to determine who to assign the report to
    const reporter = await this.usersService.findOne({ id: reporterId });
    
    // Determine recipient based on reporter's role
    const assignedToId = await this.getReportRecipient(reporter.role);

    const report = this.reportRepository.create({
      ...createReportDto,
      reporterId,
      assignedToId,
      priority: createReportDto.priority || 'medium',
      status: 'open',
    });

    const saved = await this.reportRepository.save(report);
    
    this.logger.log(`Report #${saved.id.slice(0, 8)} created by ${reporter.email}: ${saved.title}`);

    // Send notification to recipient
    if (assignedToId) {
      await this.notificationsService.create({
        userId: assignedToId,
        type: NotificationType.WARNING,
        title: `New Report: ${saved.title}`,
        message: `${reporter.firstName} ${reporter.lastName} reported a ${saved.category.replace('_', ' ')} issue (${saved.priority} priority)`,
        actionUrl: `/reports/${saved.id}`,
      });
    }

    return saved;
  }

  /**
   * Determine who should receive the report based on reporter's role
   */
  private async getReportRecipient(reporterRole: UserRole): Promise<string | undefined> {
    let targetRole: UserRole | undefined;

    switch (reporterRole) {
      case UserRole.AGENT:
        targetRole = UserRole.SUPERVISOR;
        break;
      case UserRole.SUPERVISOR:
        targetRole = UserRole.ADMIN;
        break;
      case UserRole.ADMIN:
        targetRole = UserRole.SUPER_ADMIN;
        break;
      default:
        return undefined; // SUPER_ADMIN reports don't go anywhere
    }

    // Find an active user with the target role
    const recipients = await this.usersService.findByRole(targetRole);
    if (recipients.length > 0) {
      // Return the first active supervisor/admin
      return recipients[0].id;
    }

    return undefined;
  }

  /**
   * Get all reports (for admins) or reports relevant to the user
   */
  async findAll(userId: string, role: UserRole): Promise<Report[]> {
    // Super admins and admins can see all reports
    if (role === UserRole.SUPER_ADMIN || role === UserRole.ADMIN) {
      return this.reportRepository.find({
        relations: ['reporter', 'assignedTo', 'resolvedBy'],
        order: { createdAt: 'DESC' },
      });
    }

    // Others see reports they created or are assigned to
    return this.reportRepository.find({
      where: [
        { reporterId: userId },
        { assignedToId: userId },
      ],
      relations: ['reporter', 'assignedTo', 'resolvedBy'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get reports assigned to the user
   */
  async findAssignedToMe(userId: string): Promise<Report[]> {
    return this.reportRepository.find({
      where: { assignedToId: userId },
      relations: ['reporter'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get reports created by the user
   */
  async findMyReports(userId: string): Promise<Report[]> {
    return this.reportRepository.find({
      where: { reporterId: userId },
      relations: ['assignedTo', 'resolvedBy'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get a single report by ID
   */
  async findOne(id: string, userId: string, role: UserRole): Promise<Report> {
    const report = await this.reportRepository.findOne({
      where: { id },
      relations: ['reporter', 'assignedTo', 'resolvedBy'],
    });

    if (!report) {
      throw new NotFoundException(`Report #${id} not found`);
    }

    // Check access: admins, reporter, or assignee can view
    if (
      role !== UserRole.SUPER_ADMIN &&
      role !== UserRole.ADMIN &&
      report.reporterId !== userId &&
      report.assignedToId !== userId
    ) {
      throw new ForbiddenException('You do not have access to this report');
    }

    return report;
  }

  /**
   * Update a report (status, assignment, etc.)
   */
  async update(
    id: string,
    userId: string,
    role: UserRole,
    updateReportDto: UpdateReportDto,
  ): Promise<Report> {
    const report = await this.findOne(id, userId, role);

    // Only assigned user or admins can update
    if (
      role !== UserRole.SUPER_ADMIN &&
      role !== UserRole.ADMIN &&
      report.assignedToId !== userId
    ) {
      throw new ForbiddenException('You cannot update this report');
    }

    Object.assign(report, updateReportDto);
    
    const updated = await this.reportRepository.save(report);
    
    this.logger.log(`Report #${id.slice(0, 8)} updated: status=${updated.status}`);

    // Notify reporter of status change
    if (updateReportDto.status && report.reporterId !== userId) {
      await this.notificationsService.create({
        userId: report.reporterId,
        type: NotificationType.INFO,
        title: `Report Update: ${report.title}`,
        message: `Your report status changed to: ${updateReportDto.status.replace('_', ' ')}`,
        actionUrl: `/reports/${report.id}`,
      });
    }

    return updated;
  }

  /**
   * Resolve a report
   */
  async resolve(
    id: string,
    userId: string,
    role: UserRole,
    resolveDto: ResolveReportDto,
  ): Promise<Report> {
    const report = await this.findOne(id, userId, role);

    // Only assigned user or admins can resolve
    if (
      role !== UserRole.SUPER_ADMIN &&
      role !== UserRole.ADMIN &&
      report.assignedToId !== userId
    ) {
      throw new ForbiddenException('You cannot resolve this report');
    }

    report.status = 'resolved';
    report.resolution = resolveDto.resolution;
    report.resolvedAt = new Date();
    report.resolvedById = userId;

    const resolved = await this.reportRepository.save(report);
    
    this.logger.log(`Report #${id.slice(0, 8)} resolved by ${userId}`);

    // Notify reporter
    await this.notificationsService.create({
      userId: report.reporterId,
      type: NotificationType.SUCCESS,
      title: `Report Resolved: ${report.title}`,
      message: resolveDto.resolution.slice(0, 100) + (resolveDto.resolution.length > 100 ? '...' : ''),
      actionUrl: `/reports/${report.id}`,
    });

    return resolved;
  }

  /**
   * Get report statistics
   */
  async getStats(userId: string, role: UserRole): Promise<{
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    myReports: number;
    assignedToMe: number;
  }> {
    const isAdmin = role === UserRole.SUPER_ADMIN || role === UserRole.ADMIN;

    const [total, open, inProgress, resolved, myReports, assignedToMe] = await Promise.all([
      isAdmin
        ? this.reportRepository.count()
        : this.reportRepository.count({
            where: [{ reporterId: userId }, { assignedToId: userId }],
          }),
      this.reportRepository.count({ where: { status: 'open' } }),
      this.reportRepository.count({ where: { status: 'in_progress' } }),
      this.reportRepository.count({ where: { status: 'resolved' } }),
      this.reportRepository.count({ where: { reporterId: userId } }),
      this.reportRepository.count({ where: { assignedToId: userId, status: 'open' } }),
    ]);

    return { total, open, inProgress, resolved, myReports, assignedToMe };
  }
}
