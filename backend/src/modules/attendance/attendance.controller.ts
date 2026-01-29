import {
  Controller,
  Get,
  Post,
  Body,
  Query,
} from '@nestjs/common';
import { AttendanceService, DailySummary } from './attendance.service';
import { ClockInDto, ClockOutDto } from './dto/attendance.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get('status')
  async getStatus(@CurrentUser('id') userId: string) {
    return this.attendanceService.getShiftStatus(userId);
  }

  @Post('clock-in')
  async clockIn(
    @CurrentUser('id') userId: string,
    @Body() dto: ClockInDto,
  ) {
    return this.attendanceService.clockIn(userId, dto);
  }

  @Post('clock-out')
  async clockOut(
    @CurrentUser('id') userId: string,
    @Body() dto: ClockOutDto,
  ) {
    return this.attendanceService.clockOut(userId, dto);
  }

  @Get('today')
  async getTodayAttendance(@CurrentUser('id') userId: string) {
    return this.attendanceService.getTodayAttendance(userId);
  }

  @Get('daily-summary')
  async getDailySummary(
    @CurrentUser('id') userId: string,
    @Query('date') date?: string,
  ) {
    const targetDate = date ? new Date(date) : undefined;
    return this.attendanceService.getDailySummary(userId, targetDate);
  }

  @Get('history')
  async getHistory(
    @CurrentUser('id') userId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.attendanceService.getAttendanceHistory(userId, start, end);
  }

  @Get('weekly-hours')
  async getWeeklyHours(@CurrentUser('id') userId: string) {
    const hours = await this.attendanceService.getWeeklyHours(userId);
    return { hours };
  }
}
