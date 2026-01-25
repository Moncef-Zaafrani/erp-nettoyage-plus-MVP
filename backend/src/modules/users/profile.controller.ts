import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ProfileService } from './profile.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UpdateProfileDto, UpdateProfilePhotoDto, ChangePasswordDto } from './dto';

@Controller('me/profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  /**
   * GET /api/me/profile
   * Get current user's profile
   */
  @Get()
  async getProfile(@CurrentUser('id') userId: string) {
    return this.profileService.getProfileWithCompletion(userId);
  }

  /**
   * PATCH /api/me/profile
   * Update current user's profile
   */
  @Patch()
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    const profile = await this.profileService.updateProfile(userId, dto);
    const completion = this.profileService.getProfileCompletion(profile);
    return { profile, completion };
  }

  /**
   * PATCH /api/me/profile/photo
   * Update profile photo URL
   */
  @Patch('photo')
  async updatePhoto(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProfilePhotoDto,
  ) {
    return this.profileService.updateProfilePhoto(userId, dto.profilePhotoUrl);
  }

  /**
   * DELETE /api/me/profile/photo
   * Remove profile photo
   */
  @Delete('photo')
  @HttpCode(HttpStatus.OK)
  async removePhoto(@CurrentUser('id') userId: string) {
    return this.profileService.removeProfilePhoto(userId);
  }

  /**
   * PATCH /api/me/profile/password
   * Change password
   */
  @Patch('password')
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.profileService.changePassword(userId, dto);
  }
}
