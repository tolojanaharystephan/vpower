import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class WalletAdjustDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  amountCents!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class ChatMessageDto {
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  body?: string;
}

export class AssignAgentDto {
  @IsUUID()
  userId!: string;

  @IsArray()
  @IsString({ each: true })
  roomSlugs!: string[];
}

export class CreateAgentDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsArray()
  @IsString({ each: true })
  roomSlugs!: string[];
}

export class RevenueQueryDto {
  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;
}
