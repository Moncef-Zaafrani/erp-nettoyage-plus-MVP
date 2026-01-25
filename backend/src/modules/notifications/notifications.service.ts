import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';
import { CreateNotificationDto, MarkReadDto } from './dto/notification.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  async create(createDto: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationRepository.create(createDto);
    const saved = await this.notificationRepository.save(notification);
    this.logger.log(`Created notification ${saved.id} for user ${createDto.userId}`);
    return saved;
  }

  async findAllForUser(userId: string): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findRecentForUser(userId: string, limit: number = 20): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async findUnreadCountForUser(userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: { userId, read: false },
    });
  }

  async markAsRead(userId: string, notificationId: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    notification.read = true;
    return this.notificationRepository.save(notification);
  }

  async markManyAsRead(userId: string, dto: MarkReadDto): Promise<void> {
    if (dto.ids && dto.ids.length > 0) {
      await this.notificationRepository.update(
        { id: In(dto.ids), userId },
        { read: true },
      );
    } else {
      // Mark all as read
      await this.notificationRepository.update(
        { userId, read: false },
        { read: true },
      );
    }
    this.logger.log(`Marked notifications as read for user ${userId}`);
  }

  async delete(userId: string, notificationId: string): Promise<void> {
    const result = await this.notificationRepository.delete({
      id: notificationId,
      userId,
    });

    if (result.affected === 0) {
      throw new NotFoundException('Notification not found');
    }

    this.logger.log(`Deleted notification ${notificationId} for user ${userId}`);
  }

  async deleteAllForUser(userId: string): Promise<void> {
    await this.notificationRepository.delete({ userId });
    this.logger.log(`Deleted all notifications for user ${userId}`);
  }

  // Helper method to send notifications from other services
  async notify(
    userId: string,
    type: NotificationType,
    title: string,
    message?: string,
    actionUrl?: string,
  ): Promise<Notification> {
    return this.create({
      userId,
      type,
      title,
      message,
      actionUrl,
    });
  }
}
