import { IsArray, ValidateNested, ArrayMinSize, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateSiteDto } from './create-site.dto';
import { UpdateSiteDto } from './update-site.dto';

/**
 * DTO for creating multiple sites at once
 */
export class BatchCreateSitesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSiteDto)
  @ArrayMinSize(1, { message: 'At least one site is required' })
  sites: CreateSiteDto[];
}

/**
 * DTO for updating multiple sites at once
 */
export class BatchUpdateSitesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BatchUpdateItem)
  @ArrayMinSize(1, { message: 'At least one site update is required' })
  sites: BatchUpdateItem[];
}

class BatchUpdateItem {
  @IsUUID('4', { message: 'Invalid site ID format' })
  id: string;

  @ValidateNested()
  @Type(() => UpdateSiteDto)
  data: UpdateSiteDto;
}

/**
 * DTO for batch operations (delete, restore) with IDs
 */
export class BatchIdsDto {
  @IsArray()
  @IsUUID('4', { each: true, message: 'Each ID must be a valid UUID' })
  @ArrayMinSize(1, { message: 'At least one ID is required' })
  ids: string[];
}
