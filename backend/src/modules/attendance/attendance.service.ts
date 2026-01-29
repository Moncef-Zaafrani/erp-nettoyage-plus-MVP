import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Between } from 'typeorm';
import { Attendance } from './entities/attendance.entity';
import { ClockInDto, ClockOutDto } from './dto/attendance.dto';

export interface DailySummary {
  date: string;
  firstClockIn: Date | null;
  lastClockOut: Date | null;
  totalHoursWorked: number;
  sessionsCount: number;
  isCurrentlyOnShift: boolean;
  currentShiftElapsed?: number; // seconds
}

@Injectable()
export class AttendanceService {
  private readonly logger = new Logger(AttendanceService.name);

  // Rate limiting map: userId -> { count, resetTime }
  private rateLimitMap = new Map<string, { count: number; resetTime: number }>();
  private readonly RATE_LIMIT = 50; // max attempts per hour (increased for dev/testing)
  private readonly RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in ms

  constructor(
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,
  ) {}

  private checkRateLimit(userId: string): void {
    const now = Date.now();
    const userLimit = this.rateLimitMap.get(userId);
    
    if (!userLimit || now > userLimit.resetTime) {
      this.rateLimitMap.set(userId, { count: 1, resetTime: now + this.RATE_LIMIT_WINDOW });
      return;
    }
    
    if (userLimit.count >= this.RATE_LIMIT) {
      throw new BadRequestException('Too many clock-in/out attempts. Please try again later.');
    }
    
    userLimit.count++;
  }

  async clockIn(userId: string, dto: ClockInDto): Promise<Attendance> {
    this.checkRateLimit(userId);
    
    // Check if user already has an active shift
    const activeShift = await this.getActiveShift(userId);
    if (activeShift) {
      throw new BadRequestException('You already have an active shift. Please clock out first.');
    }

    const attendance = this.attendanceRepository.create({
      userId,
      clockIn: new Date(),
      notes: dto.notes,
      clockInLocation: dto.latitude && dto.longitude ? `(${dto.latitude},${dto.longitude})` : null,
    });

    const saved = await this.attendanceRepository.save(attendance);
    this.logger.log(`User ${userId} clocked in at ${saved.clockIn}`);
    return saved;
  }

  async clockOut(userId: string, dto: ClockOutDto): Promise<Attendance> {
    this.checkRateLimit(userId);
    
    const activeShift = await this.getActiveShift(userId);
    if (!activeShift) {
      throw new BadRequestException('No active shift found. Please clock in first.');
    }

    const clockOutTime = new Date();
    const totalMinutes = (clockOutTime.getTime() - activeShift.clockIn.getTime()) / (1000 * 60);
    const hoursWorked = Math.max(0, totalMinutes / 60);

    activeShift.clockOut = clockOutTime;
    activeShift.hoursWorked = parseFloat(hoursWorked.toFixed(2));
    activeShift.clockOutLocation = dto.latitude && dto.longitude ? `(${dto.latitude},${dto.longitude})` : null;
    
    if (dto.notes) {
      activeShift.notes = activeShift.notes ? `${activeShift.notes}\n${dto.notes}` : dto.notes;
    }

    const saved = await this.attendanceRepository.save(activeShift);
    this.logger.log(`User ${userId} clocked out at ${saved.clockOut}. Hours worked: ${saved.hoursWorked}`);
    return saved;
  }

  async getActiveShift(userId: string): Promise<Attendance | null> {
    return this.attendanceRepository.findOne({
      where: { 
        userId, 
        clockOut: IsNull(),
      },
      order: { clockIn: 'DESC' },
    });
  }

  async getShiftStatus(userId: string): Promise<{ isOnShift: boolean; currentShift: Attendance | null }> {
    const currentShift = await this.getActiveShift(userId);
    return {
      isOnShift: !!currentShift,
      currentShift,
    };
  }

  async getDailySummary(userId: string, date?: Date): Promise<DailySummary> {
    const targetDate = date || new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const attendances = await this.attendanceRepository.find({
      where: {
        userId,
        clockIn: Between(startOfDay, endOfDay),
      },
      order: { clockIn: 'ASC' },
    });

    if (attendances.length === 0) {
      return {
        date: startOfDay.toISOString().split('T')[0],
        firstClockIn: null,
        lastClockOut: null,
        totalHoursWorked: 0,
        sessionsCount: 0,
        isCurrentlyOnShift: false,
      };
    }

    const firstClockIn = attendances[0].clockIn;
    const lastRecord = attendances[attendances.length - 1];
    const lastClockOut = lastRecord.clockOut || null;
    const isCurrentlyOnShift = !lastRecord.clockOut;

    let totalHoursWorked = 0;
    let currentShiftElapsed: number | undefined;

    for (const att of attendances) {
      if (att.hoursWorked) {
        totalHoursWorked += att.hoursWorked;
      } else if (!att.clockOut) {
        // Active shift - calculate elapsed
        const now = new Date();
        const elapsed = (now.getTime() - att.clockIn.getTime()) / (1000 * 60 * 60);
        currentShiftElapsed = Math.floor((now.getTime() - att.clockIn.getTime()) / 1000);
        totalHoursWorked += elapsed;
      }
    }

    return {
      date: startOfDay.toISOString().split('T')[0],
      firstClockIn,
      lastClockOut,
      totalHoursWorked: parseFloat(totalHoursWorked.toFixed(2)),
      sessionsCount: attendances.length,
      isCurrentlyOnShift,
      currentShiftElapsed,
    };
  }

  async getAttendanceHistory(userId: string, startDate?: Date, endDate?: Date): Promise<Attendance[]> {
    const where: any = { userId };
    
    if (startDate && endDate) {
      where.clockIn = Between(startDate, endDate);
    }

    return this.attendanceRepository.find({
      where,
      order: { clockIn: 'DESC' },
    });
  }

  async getTodayAttendance(userId: string): Promise<Attendance[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.attendanceRepository.find({
      where: {
        userId,
        clockIn: Between(today, tomorrow),
      },
      order: { clockIn: 'ASC' },
    });
  }

  async getWeeklyHours(userId: string): Promise<number> {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    const attendances = await this.attendanceRepository.find({
      where: {
        userId,
        clockIn: Between(startOfWeek, endOfWeek),
      },
    });

    // Ensure hoursWorked is parsed as number (may come as string from DB)
    let total = attendances.reduce((sum, att) => sum + (parseFloat(String(att.hoursWorked)) || 0), 0);
    
    // Add current active shift time if applicable
    const activeShift = await this.getActiveShift(userId);
    if (activeShift) {
      const elapsed = (Date.now() - activeShift.clockIn.getTime()) / (1000 * 60 * 60);
      total += elapsed;
    }

    return parseFloat(total.toFixed(2));
  }
}
