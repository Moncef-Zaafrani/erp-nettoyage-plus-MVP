import {
  IsEmail,
  IsString,
  IsOptional,
  IsEnum,
  MinLength,
  MaxLength,
  IsUUID,
  IsDateString,
} from 'class-validator';
import { UserRole, UserStatus } from '../../../shared/types/user.types';

export class CreateUserDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(100)
  password: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  secondaryPhone?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid personal email address' })
  personalEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  region?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  employeeId?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Hire date must be a valid date' })
  hireDate?: string;

  @IsOptional()
  @IsEnum(['CDI', 'CDD', 'FREELANCE'], { message: 'Invalid contract type' })
  contractType?: 'CDI' | 'CDD' | 'FREELANCE';

  @IsOptional()
  @IsEnum(UserRole, { message: 'Invalid role' })
  role?: UserRole;

  @IsOptional()
  @IsEnum(UserStatus, { message: 'Invalid status' })
  status?: UserStatus;

  @IsOptional()
  @IsUUID('4', { message: 'Invalid supervisor ID' })
  supervisorId?: string;
}
