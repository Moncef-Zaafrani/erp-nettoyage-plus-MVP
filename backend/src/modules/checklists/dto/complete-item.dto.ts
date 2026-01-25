import {
  IsNotEmpty,
  IsUUID,
  IsOptional,
  IsString,
  IsArray,
  IsInt,
  Min,
  Max,
} from 'class-validator';

export class CompleteItemDto {
  @IsNotEmpty()
  @IsUUID()
  completedBy: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photoUrls?: string[];

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  qualityRating?: number;
}
