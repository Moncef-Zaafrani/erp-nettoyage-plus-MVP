import {
  IsString,
  IsOptional,
  IsEnum,
  IsEmail,
  MaxLength,
  IsUUID,
} from 'class-validator';
import { ClientType, ClientStatus } from '../../../shared/types/client.types';

export class CreateClientDto {
  @IsString()
  @MaxLength(200)
  name: string;

  @IsOptional()
  @IsEnum(ClientType, { message: 'Invalid client type' })
  type?: ClientType;

  @IsOptional()
  @IsUUID('4', { message: 'Invalid user ID format' })
  userId?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  contactPerson?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  contactPhone?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(ClientStatus, { message: 'Invalid status' })
  status?: ClientStatus;
}
