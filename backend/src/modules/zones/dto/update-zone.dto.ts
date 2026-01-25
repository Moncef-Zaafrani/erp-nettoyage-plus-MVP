import { IsString, IsUUID, IsOptional, IsEnum } from 'class-validator';
import { ZoneStatus } from '../../../shared/types/zone.types';

export class UpdateZoneDto {
  @IsString()
  @IsOptional()
  zoneName?: string;

  @IsString()
  @IsOptional()
  zoneCode?: string;

  @IsUUID()
  @IsOptional()
  zoneChiefId?: string;

  @IsEnum(ZoneStatus)
  @IsOptional()
  status?: ZoneStatus;

  @IsString()
  @IsOptional()
  description?: string;
}
