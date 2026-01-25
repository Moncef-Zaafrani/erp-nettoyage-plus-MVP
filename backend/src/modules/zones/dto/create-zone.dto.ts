import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsOptional,
  MaxLength,
} from 'class-validator';

export class CreateZoneDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  zoneName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  zoneCode: string;

  @IsUUID()
  @IsOptional()
  zoneChiefId?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
