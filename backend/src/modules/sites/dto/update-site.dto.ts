import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateSiteDto } from './create-site.dto';

// Omit clientId from updates - site ownership shouldn't change
export class UpdateSiteDto extends PartialType(
  OmitType(CreateSiteDto, ['clientId'] as const),
) {}
