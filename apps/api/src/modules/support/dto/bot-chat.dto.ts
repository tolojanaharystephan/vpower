import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class BotChatDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  message!: string;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  locale?: string;
}
