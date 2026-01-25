import { IsNotEmpty, IsUUID, IsInt, Min, Max, IsString, IsOptional } from 'class-validator';

export class ReviewInstanceDto {
  @IsNotEmpty()
  @IsUUID()
  reviewedBy: string;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(5)
  qualityScore: number;

  @IsOptional()
  @IsString()
  reviewNotes?: string;
}
