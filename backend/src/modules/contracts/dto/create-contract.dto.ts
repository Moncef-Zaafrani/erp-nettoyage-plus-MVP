import {
  IsUUID,
  IsEnum,
  IsDateString,
  IsOptional,
  IsObject,
  IsString,
  IsNotEmpty,
  ValidateIf,
} from 'class-validator';
import {
  ContractType,
  ContractFrequency,
  ContractPricing,
  ServiceScope,
} from '../../../shared/types/contract.types';

export class CreateContractDto {
  @IsUUID()
  @IsNotEmpty()
  clientId: string;

  @IsUUID()
  @IsNotEmpty()
  siteId: string;

  @IsEnum(ContractType)
  @IsNotEmpty()
  type: ContractType;

  @ValidateIf((o) => o.type === ContractType.PERMANENT)
  @IsEnum(ContractFrequency)
  @IsNotEmpty()
  frequency: ContractFrequency;

  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

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
