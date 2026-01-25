import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsBoolean,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ChecklistFrequency } from '../../../shared/types/checklist.types';
import { SiteSize } from '../../../shared/types/site.types';

class ZoneConfigDto {
  @IsNotEmpty()
  @IsString()
  zoneName: string;

  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  tasks: string[];
}

export class CreateTemplateDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsEnum(ChecklistFrequency)
  frequency: ChecklistFrequency;

  @IsOptional()
  @IsEnum(SiteSize)
  siteSize?: SiteSize;

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ZoneConfigDto)
  zones: ZoneConfigDto[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
