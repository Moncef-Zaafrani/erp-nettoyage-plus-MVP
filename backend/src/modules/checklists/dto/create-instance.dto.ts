import { IsNotEmpty, IsUUID } from 'class-validator';

export class CreateInstanceDto {
  @IsNotEmpty()
  @IsUUID()
  interventionId: string;

  @IsNotEmpty()
  @IsUUID()
  templateId: string;
}
