import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Between } from 'typeorm';
import { Attendance } from './entities/attendance.entity';
import { ClockInDto, ClockOutDto } from './dto/attendance.dto';

@Injectable()
export class AttendanceService {
  private readonly logger = new Logger(AttendanceService.name);

  constructor(
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,
  ) {}

  async clockIn(userId: string, dto: ClockInDto): Promise<Attendance> {
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
    const activeShift = await this.getActiveShift(userId);
    if (!activeShift) {
      throw new BadRequestException('No active shift found. Please clock in first.');
    }

    const clockOutTime = new Date();
    const hoursWorked = (clockOutTime.getTime() - activeShift.clockIn.getTime()) / (1000 * 60 * 60);

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
      where: { userId, clockOut: IsNull() },
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

    return attendances.reduce((total, attendance) => {
      return total + (attendance.hoursWorked || 0);
    }, 0);
  }
}
