import { IsUUID, IsNotEmpty, IsDateString, IsOptional } from 'class-validator';

export class AssignSiteDto {
  @IsUUID()
  @IsNotEmpty()
  siteId: string;

  @IsUUID()
  @IsOptional()
  teamChiefId?: string;

  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;
}
