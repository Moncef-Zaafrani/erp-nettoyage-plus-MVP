import { IsEnum, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import { NotificationType } from '../entities/notification.entity';

export class CreateNotificationDto {
  @IsEnum(NotificationType)
  type: NotificationType;

  @IsString()
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  actionUrl?: string;

  @IsString()
  userId: string;
}

export class UpdateNotificationDto {
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  actionUrl?: string;
}

export class MarkReadDto {
  @IsOptional()
  ids?: string[];
}
