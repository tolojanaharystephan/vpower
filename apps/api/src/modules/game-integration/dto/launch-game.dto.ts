import { IsOptional, IsString } from 'class-validator';

export class LaunchGameDto {
  @IsOptional()
  @IsString()
  locale?: string;
}
