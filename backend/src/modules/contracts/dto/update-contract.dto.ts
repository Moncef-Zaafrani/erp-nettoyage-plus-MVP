import {
  IsEnum,
  IsDateString,
  IsOptional,
  IsObject,
  IsString,
} from 'class-validator';
import {
  ContractType,
  ContractFrequency,
  ContractStatus,
  ContractPricing,
  ServiceScope,
} from '../../../shared/types/contract.types';

export class UpdateContractDto {
  @IsEnum(ContractType)
  @IsOptional()
  type?: ContractType;

  @IsEnum(ContractFrequency)
  @IsOptional()
  frequency?: ContractFrequency;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsEnum(ContractStatus)
  @IsOptional()
  status?: ContractStatus;

  @IsObject()
  @IsOptional()
  pricing?: ContractPricing;

  @IsObject()
  @IsOptional()
  serviceScope?: ServiceScope;

  @IsString()
  @IsOptional()
  notes?: string;
}
