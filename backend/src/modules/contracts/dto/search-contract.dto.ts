import { IsUUID, IsEnum, IsOptional, IsString } from 'class-validator';
import {
  ContractType,
  ContractStatus,
} from '../../../shared/types/contract.types';

export class SearchContractDto {
  @IsUUID()
  @IsOptional()
  id?: string;

  @IsString()
  @IsOptional()
  contractCode?: string;

  @IsUUID()
  @IsOptional()
  clientId?: string;

  @IsUUID()
  @IsOptional()
  siteId?: string;

  @IsEnum(ContractType)
  @IsOptional()
  type?: ContractType;

  @IsEnum(ContractStatus)
  @IsOptional()
  status?: ContractStatus;
}
