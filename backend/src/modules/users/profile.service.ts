import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, ProfileCompletion } from './entities/user.entity';
import { UpdateProfileDto, ChangePasswordDto } from './dto';
import { validatePassword, hashPassword } from '../../shared/utils/password.util';

@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Get current user's full profile
   */
  async getProfile(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['settings'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.sanitizeUser(user);
  }

  /**
   * Update current user's profile
   */
  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Update allowed fields
    const allowedFields = [
      'firstName',
      'lastName',
      'displayName',
      'phone',
      'secondaryPhone',
      'personalEmail',
      'dateOfBirth',
      'nationalId',
      'address',
      'city',
      'region',
      'emergencyContact',
      'certifications',
      'languages',
      'equipmentCompetencies',
      'specialSkills',
      'workPreferences',
    ];

    for (const field of allowedFields) {
      if (dto[field] !== undefined) {
        user[field] = dto[field];
      }
    }

    await this.userRepository.save(user);
    this.logger.log(`Profile updated for user: ${userId}`);

    return this.sanitizeUser(user);
  }

  /**
   * Update profile photo URL
   */
  async updateProfilePhoto(userId: string, photoUrl: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.profilePhotoUrl = photoUrl;
    await this.userRepository.save(user);

    this.logger.log(`Profile photo updated for user: ${userId}`);
    return this.sanitizeUser(user);
  }

  /**
   * Remove profile photo
   */
  async removeProfilePhoto(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.profilePhotoUrl = null;
    await this.userRepository.save(user);

    this.logger.log(`Profile photo removed for user: ${userId}`);
    return this.sanitizeUser(user);
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, dto: ChangePasswordDto): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isValid = await validatePassword(dto.currentPassword, user.password);
    if (!isValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Validate new password confirmation
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('New password and confirmation do not match');
    }

    // Validate password strength (minimum 8 characters)
    if (dto.newPassword.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters');
    }

    // Hash and save new password
    user.password = await hashPassword(dto.newPassword);
    user.lastPasswordChangeAt = new Date();
    user.forcePasswordChange = false;
    await this.userRepository.save(user);

    this.logger.log(`Password changed for user: ${userId}`);
    return { message: 'Password changed successfully' };
  }

  /**
   * Calculate profile completion percentage
   */
  getProfileCompletion(user: User): ProfileCompletion {
    const hasPhoto = !!user.profilePhotoUrl;
    const hasPhone = !!user.phone;
    const hasEmergencyContact = !!user.emergencyContact?.name;
    const hasCertifications = user.certifications?.length > 0;

    // Calculate percentage based on role
    let totalItems = 3; // photo, phone, emergency contact
    let completedItems = 0;

    if (hasPhoto) completedItems++;
    if (hasPhone) completedItems++;
    if (hasEmergencyContact) completedItems++;

    // Agents need certifications
    if (user.role === 'AGENT' || user.role === 'SUPERVISOR') {
      totalItems++;
      if (hasCertifications) completedItems++;
    }

    const percentage = Math.round((completedItems / totalItems) * 100);

    return {
      hasPhoto,
      hasPhone,
      hasEmergencyContact,
      hasCertifications,
      percentage,
    };
  }

  /**
   * Get profile with completion info
   */
  async getProfileWithCompletion(userId: string): Promise<{
    profile: User;
    completion: ProfileCompletion;
  }> {
    const profile = await this.getProfile(userId);
    const completion = this.getProfileCompletion(profile);

    return { profile, completion };
  }

  /**
   * Remove sensitive fields from user object
   */
  private sanitizeUser(user: User): User {
    const sanitized = { ...user };
    delete sanitized.password;
    delete sanitized.failedLoginAttempts;
    delete sanitized.lastFailedLoginAt;
    return sanitized as User;
  }
}
