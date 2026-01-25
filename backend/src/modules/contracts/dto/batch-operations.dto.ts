import { IsArray, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateContractDto } from './create-contract.dto';
import { UpdateContractDto } from './update-contract.dto';

export class BatchCreateContractsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateContractDto)
  contracts: CreateContractDto[];
}

export class BatchUpdateContractsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateContractItemDto)
  contracts: UpdateContractItemDto[];
}

class UpdateContractItemDto extends UpdateContractDto {
  @IsUUID()
  id: string;
}

export class BatchDeleteContractsDto {
  @IsArray()
  @IsUUID('4', { each: true })
  ids: string[];
}

export class BatchRestoreContractsDto {
  @IsArray()
  @IsUUID('4', { each: true })
  ids: string[];
}
