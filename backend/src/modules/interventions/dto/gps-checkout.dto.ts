import { IsNumber, IsNotEmpty, Min, Max } from 'class-validator';

export class GpsCheckOutDto {
  @IsNumber()
  @IsNotEmpty()
  @Min(-90)
  @Max(90)
  latitude: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(-180)
  @Max(180)
  longitude: number;

  @IsNumber()
  @Min(0)
  accuracy?: number;
}
