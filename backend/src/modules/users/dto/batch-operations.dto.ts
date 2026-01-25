import { Type } from 'class-transformer';
import { IsArray, ValidateNested, ArrayMinSize, IsUUID } from 'class-validator';
import { CreateUserDto } from './create-user.dto';
import { UpdateUserDto } from './update-user.dto';

/**
 * DTO for creating multiple users at once
 */
export class BatchCreateUsersDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateUserDto)
  @ArrayMinSize(1, { message: 'At least one user is required' })
  users: CreateUserDto[];
}

/**
 * DTO for updating a single user in batch
 */
export class BatchUpdateItem extends UpdateUserDto {
  @IsUUID('4', { message: 'Invalid user ID format' })
  id: string;
}

/**
 * DTO for updating multiple users at once
 */
export class BatchUpdateUsersDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BatchUpdateItem)
  @ArrayMinSize(1, { message: 'At least one user is required' })
  users: BatchUpdateItem[];
}

/**
 * DTO for batch delete/restore operations
 */
export class BatchIdsDto {
  @IsArray()
  @IsUUID('4', { each: true, message: 'Invalid user ID format' })
  @ArrayMinSize(1, { message: 'At least one ID is required' })
  ids: string[];
}
