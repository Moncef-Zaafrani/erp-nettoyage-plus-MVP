import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { UserSettings, ThemeType } from './entities/user-settings.entity';
import { UserSession } from './entities/user-session.entity';
import { UpdateSettingsDto } from './dto';

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(
    @InjectRepository(UserSettings)
    private readonly settingsRepository: Repository<UserSettings>,
    @InjectRepository(UserSession)
    private readonly sessionRepository: Repository<UserSession>,
  ) {}

  /**
   * Get user settings (create defaults if not exists)
   */
  async getSettings(userId: string): Promise<UserSettings> {
    let settings = await this.settingsRepository.findOne({
      where: { userId },
    });

    if (!settings) {
      // Create default settings
      settings = this.settingsRepository.create({
        userId,
        ...UserSettings.createDefaults(),
      });
      await this.settingsRepository.save(settings);
      this.logger.log(`Created default settings for user: ${userId}`);
    }

    return settings;
  }

  /**
   * Update user settings (deep merge)
   */
  async updateSettings(userId: string, dto: UpdateSettingsDto): Promise<UserSettings> {
    let settings = await this.settingsRepository.findOne({
      where: { userId },
    });

    if (!settings) {
      // Create with defaults and apply updates
      settings = this.settingsRepository.create({
        userId,
        ...UserSettings.createDefaults(),
      });
    }

    // Deep merge each section
    if (dto.appearance) {
      settings.appearance = { ...settings.appearance, ...dto.appearance };
    }
    if (dto.notifications) {
      settings.notifications = { ...settings.notifications, ...dto.notifications };
    }
    if (dto.tables) {
      settings.tables = { ...settings.tables, ...dto.tables };
    }
    if (dto.calendar) {
      settings.calendar = { ...settings.calendar, ...dto.calendar };
    }
    if (dto.map) {
      settings.map = { ...settings.map, ...dto.map };
    }
    if (dto.gps) {
      settings.gps = { ...settings.gps, ...dto.gps };
    }
    if (dto.photo) {
      settings.photo = { ...settings.photo, ...dto.photo };
    }
    if (dto.offline) {
      settings.offline = { ...settings.offline, ...dto.offline };
    }
    if (dto.mission) {
      settings.mission = { ...settings.mission, ...dto.mission };
    }
    if (dto.shift) {
      settings.shift = { ...settings.shift, ...dto.shift };
    }
    if (dto.help) {
      settings.help = { ...settings.help, ...dto.help };
    }

    await this.settingsRepository.save(settings);
    this.logger.log(`Settings updated for user: ${userId}`);

    return settings;
  }

  /**
   * Update just the theme
   */
  async updateTheme(userId: string, theme: ThemeType): Promise<UserSettings> {
    return this.updateSettings(userId, {
      appearance: { theme } as any,
    });
  }

  /**
   * Reset settings to defaults
   */
  async resetSettings(userId: string): Promise<UserSettings> {
    let settings = await this.settingsRepository.findOne({
      where: { userId },
    });

    if (!settings) {
      settings = this.settingsRepository.create({ userId });
    }

    // Apply all defaults
    Object.assign(settings, UserSettings.createDefaults());
    await this.settingsRepository.save(settings);

    this.logger.log(`Settings reset for user: ${userId}`);
    return settings;
  }

  // ============================================
  // Session Management
  // ============================================

  /**
   * Create a new session
   */
  async createSession(
    userId: string,
    token: string,
    deviceInfo: {
      deviceType?: 'desktop' | 'mobile' | 'tablet';
      browser?: string;
      os?: string;
      ipAddress?: string;
      city?: string;
      country?: string;
    },
    expiresAt: Date,
  ): Promise<UserSession> {
    const session = this.sessionRepository.create({
      userId,
      token,
      ...deviceInfo,
      expiresAt,
      lastActiveAt: new Date(),
    });

    await this.sessionRepository.save(session);
    this.logger.log(`Session created for user: ${userId}`);

    return session;
  }

  /**
   * Get all active sessions for a user
   */
  async getSessions(userId: string, currentToken?: string): Promise<UserSession[]> {
    const sessions = await this.sessionRepository.find({
      where: {
        userId,
        isActive: true,
      },
      order: { lastActiveAt: 'DESC' },
    });

    // Mark current session
    return sessions.map((session) => ({
      ...session,
      isCurrent: currentToken ? session.token === currentToken : false,
    }));
  }

  /**
   * Update session last active time
   */
  async touchSession(token: string): Promise<void> {
    await this.sessionRepository.update(
      { token },
      { lastActiveAt: new Date() },
    );
  }

  /**
   * Revoke a specific session
   */
  async revokeSession(userId: string, sessionId: string): Promise<void> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    session.isActive = false;
    session.revokedAt = new Date();
    await this.sessionRepository.save(session);

    this.logger.log(`Session ${sessionId} revoked for user: ${userId}`);
  }

  /**
   * Revoke all sessions except current
   */
  async revokeOtherSessions(userId: string, currentToken: string): Promise<number> {
    const result = await this.sessionRepository.update(
      {
        userId,
        isActive: true,
        token: currentToken ? undefined : undefined, // TypeORM doesn't have NOT condition easily
      },
      {
        isActive: false,
        revokedAt: new Date(),
      },
    );

    // Manual approach for "not equal" condition
    const sessions = await this.sessionRepository.find({
      where: { userId, isActive: true },
    });

    let revokedCount = 0;
    for (const session of sessions) {
      if (session.token !== currentToken) {
        session.isActive = false;
        session.revokedAt = new Date();
        await this.sessionRepository.save(session);
        revokedCount++;
      }
    }

    this.logger.log(`Revoked ${revokedCount} other sessions for user: ${userId}`);
    return revokedCount;
  }

  /**
   * Revoke all sessions (logout everywhere)
   */
  async revokeAllSessions(userId: string): Promise<number> {
    const result = await this.sessionRepository.update(
      { userId, isActive: true },
      { isActive: false, revokedAt: new Date() },
    );

    this.logger.log(`All sessions revoked for user: ${userId}`);
    return result.affected || 0;
  }

  /**
   * Clean up expired sessions (called by cron or on login)
   */
  async cleanupExpiredSessions(): Promise<number> {
    const result = await this.sessionRepository.delete({
      expiresAt: LessThan(new Date()),
    });

    if (result.affected > 0) {
      this.logger.log(`Cleaned up ${result.affected} expired sessions`);
    }

    return result.affected || 0;
  }
}
