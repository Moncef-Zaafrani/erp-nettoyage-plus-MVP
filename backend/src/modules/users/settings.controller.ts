import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Headers,
  ParseUUIDPipe,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UpdateSettingsDto, UpdateThemeDto } from './dto';

@Controller('me/settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  /**
   * GET /api/me/settings
   * Get current user's settings
   */
  @Get()
  async getSettings(@CurrentUser('id') userId: string) {
    return this.settingsService.getSettings(userId);
  }

  /**
   * PATCH /api/me/settings
   * Update current user's settings (deep merge)
   */
  @Patch()
  async updateSettings(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateSettingsDto,
  ) {
    return this.settingsService.updateSettings(userId, dto);
  }

  /**
   * PATCH /api/me/settings/theme
   * Quick update just the theme
   */
  @Patch('theme')
  async updateTheme(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateThemeDto,
  ) {
    return this.settingsService.updateTheme(userId, dto.theme);
  }

  /**
   * POST /api/me/settings/reset
   * Reset all settings to defaults
   */
  @Post('reset')
  @HttpCode(HttpStatus.OK)
  async resetSettings(@CurrentUser('id') userId: string) {
    return this.settingsService.resetSettings(userId);
  }

  // ============================================
  // Session Management
  // ============================================

  /**
   * GET /api/me/settings/sessions
   * Get all active sessions
   */
  @Get('sessions')
  async getSessions(
    @CurrentUser('id') userId: string,
    @Headers('authorization') authHeader: string,
  ) {
    // Extract token from header for marking current session
    const token = authHeader?.replace('Bearer ', '') || '';
    return this.settingsService.getSessions(userId, token);
  }

  /**
   * DELETE /api/me/settings/sessions/:id
   * Revoke a specific session
   */
  @Delete('sessions/:id')
  @HttpCode(HttpStatus.OK)
  async revokeSession(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) sessionId: string,
  ) {
    await this.settingsService.revokeSession(userId, sessionId);
    return { message: 'Session revoked successfully' };
  }

  /**
   * POST /api/me/settings/sessions/revoke-others
   * Revoke all sessions except current
   */
  @Post('sessions/revoke-others')
  @HttpCode(HttpStatus.OK)
  async revokeOtherSessions(
    @CurrentUser('id') userId: string,
    @Headers('authorization') authHeader: string,
  ) {
    const token = authHeader?.replace('Bearer ', '') || '';
    const count = await this.settingsService.revokeOtherSessions(userId, token);
    return { message: `${count} session(s) revoked` };
  }

  /**
   * POST /api/me/settings/sessions/revoke-all
   * Revoke all sessions (logout everywhere)
   */
  @Post('sessions/revoke-all')
  @HttpCode(HttpStatus.OK)
  async revokeAllSessions(@CurrentUser('id') userId: string) {
    const count = await this.settingsService.revokeAllSessions(userId);
    return { message: `${count} session(s) revoked` };
  }
}
