import { IsArray, ValidateNested, ArrayMinSize, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateClientDto } from './create-client.dto';
import { UpdateClientWithIdDto } from './update-client.dto';

/**
 * DTO for creating multiple clients at once
 */
export class BatchCreateClientsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => CreateClientDto)
  clients: CreateClientDto[];
}

/**
 * DTO for updating multiple clients at once
 */
export class BatchUpdateClientsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => UpdateClientWithIdDto)
  updates: UpdateClientWithIdDto[];
}

/**
 * DTO for batch operations that just need IDs (delete, restore)
 */
export class BatchIdsDto {
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMinSize(1)
  ids: string[];
}
