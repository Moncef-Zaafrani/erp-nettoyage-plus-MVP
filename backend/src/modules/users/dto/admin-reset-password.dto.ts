import { IsEnum, IsOptional } from 'class-validator';

export enum ResetPasswordMode {
  TEMP = 'temp',
  LINK = 'link',
}

export class AdminResetPasswordDto {
  @IsOptional()
  @IsEnum(ResetPasswordMode, {
    message: 'mode must be either "temp" or "link"',
  })
  mode?: ResetPasswordMode = ResetPasswordMode.LINK;
}
