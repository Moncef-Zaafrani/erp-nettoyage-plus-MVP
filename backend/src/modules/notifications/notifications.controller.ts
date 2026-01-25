import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { MarkReadDto } from './dto/notification.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async findAll(@CurrentUser('id') userId: string) {
    return this.notificationsService.findAllForUser(userId);
  }

  @Get('recent')
  async findRecent(
    @CurrentUser('id') userId: string,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 20;
    return this.notificationsService.findRecentForUser(userId, parsedLimit);
  }

  @Get('unread-count')
  async getUnreadCount(@CurrentUser('id') userId: string) {
    const count = await this.notificationsService.findUnreadCountForUser(userId);
    return { count };
  }

  @Patch(':id/read')
  async markAsRead(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.notificationsService.markAsRead(userId, id);
  }

  @Post('mark-read')
  async markManyAsRead(
    @CurrentUser('id') userId: string,
    @Body() dto: MarkReadDto,
  ) {
    await this.notificationsService.markManyAsRead(userId, dto);
    return { success: true };
  }

  @Delete(':id')
  async delete(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    await this.notificationsService.delete(userId, id);
    return { success: true };
  }

  @Delete()
  async deleteAll(@CurrentUser('id') userId: string) {
    await this.notificationsService.deleteAllForUser(userId);
    return { success: true };
  }
}
