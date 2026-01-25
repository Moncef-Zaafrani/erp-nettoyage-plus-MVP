import {
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsString,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SiteSize, SiteStatus } from '../../../shared/types/site.types';

export class SearchSiteDto {
  // Pagination
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  // Filters
  @IsOptional()
  @IsUUID('4')
  clientId?: string;

  @IsOptional()
  @IsEnum(SiteSize)
  size?: SiteSize;

  @IsOptional()
  @IsEnum(SiteStatus)
  status?: SiteStatus;

  @IsOptional()
  @IsString()
  search?: string; // Search in name, address, city

  // Sorting
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt'; // name, size, status, createdAt

  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
