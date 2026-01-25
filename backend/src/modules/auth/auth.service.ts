import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/entities/user.entity';
import { RegisterDto, LoginDto } from './dto';
import { UserStatus } from '../../shared/types/user.types';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Register a new user
   */
  async register(registerDto: RegisterDto): Promise<{
    user: Partial<User>;
    accessToken: string;
  }> {
    const { email } = registerDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException(`User with email ${email} already exists`);
    }

    // Create new user
    const user = this.userRepository.create({
      ...registerDto,
      email: email.toLowerCase(),
    });

    await this.userRepository.save(user);
    this.logger.log(`User registered: ${user.email}`);

    // Generate token
    const accessToken = this.generateToken(user);

    return {
      user: this.sanitizeUser(user),
      accessToken,
    };
  }

  /**
   * Login user with email and password
   */
  async login(loginDto: LoginDto): Promise<{
    user: Partial<User>;
    accessToken: string;
  }> {
    const { email, password } = loginDto;

    // Find user by email
    const user = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check if user is active
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException(
        'Your account is not active. Please contact support.',
      );
    }

    // Validate password
    const isPasswordValid = await user.validatePassword(password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Update last login
    user.lastLoginAt = new Date();
    await this.userRepository.save(user);

    this.logger.log(`User logged in: ${user.email}`);

    // Generate token
    const accessToken = this.generateToken(user);

    return {
      user: this.sanitizeUser(user),
      accessToken,
    };
  }

  /**
   * Get user by ID (for JWT validation)
   */
  async validateUser(userId: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id: userId, status: UserStatus.ACTIVE },
    });
  }

  /**
   * Generate JWT token
   */
  private generateToken(user: User): string {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return this.jwtService.sign(payload);
  }

  /**
   * Initiate password reset
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });

    // Always return success message (security best practice)
    // Don't reveal if email exists or not
    if (!user) {
      this.logger.log(`Password reset requested for non-existent email: ${email}`);
      return { message: 'If an account exists, a reset link has been sent' };
    }

    // Generate a secure reset token (for demo, use JWT, in prod use random string)
    const resetToken = this.jwtService.sign(
      { sub: user.id, email: user.email },
      { expiresIn: '1h' }
    );
    
    // Construct reset URL with proper protocol handling
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const baseUrl = frontendUrl.startsWith('http') ? frontendUrl : `https://${frontendUrl}`;
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;
    
    this.logger.log(`Password reset requested for: ${user.email}`);
    try {
      await this.emailService.sendPasswordReset(user.email, resetUrl);
      this.logger.log(`Password reset email sent successfully to: ${user.email}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset email: ${error.message}`);
      // Still return success to not reveal if email exists
    }
    return { message: 'If an account exists, a reset link has been sent' };
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    try {
      // Verify token and extract user info
      const payload = this.jwtService.verify(token);
      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Hash and update password
      user.password = newPassword; // The entity's setter should hash it
      await this.userRepository.save(user);

      this.logger.log(`Password reset successful for: ${user.email}`);
      return { message: 'Password has been reset successfully' };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Reset token has expired. Please request a new one.');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid reset token.');
      }
      throw error;
    }
  }

  /**
   * Remove sensitive fields from user object
   */
  private sanitizeUser(user: User): Partial<User> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...sanitized } = user;
    return sanitized;
  }
}
