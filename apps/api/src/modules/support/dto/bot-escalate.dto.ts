import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class BotEscalateDto {
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  message!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  subject?: string;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  preferredLang?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  botAnswer?: string;
}
