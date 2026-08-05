import { IsString, MaxLength, MinLength } from 'class-validator';

export class TranslateMessageDto {
  @IsString()
  @MinLength(2)
  @MaxLength(16)
  targetLang!: string;
}
