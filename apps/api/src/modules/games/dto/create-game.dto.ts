import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateGameDto {
  @IsString()
  slug!: string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @IsOptional()
  @IsString()
  bannerUrl?: string;

  @IsOptional()
  @IsString()
  accent?: string;

  @IsUUID()
  providerId!: string;

  @IsUUID()
  categoryId!: string;

  @IsOptional()
  @IsEnum(['draft', 'active', 'inactive', 'archived'] as const)
  status?: 'draft' | 'active' | 'inactive' | 'archived';

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsBoolean()
  isNew?: boolean;

  @IsOptional()
  @IsBoolean()
  isPopular?: boolean;

  @IsOptional()
  @IsInt()
  rtp?: number;

  @IsOptional()
  @IsString()
  volatility?: string;

  @IsOptional()
  @IsInt()
  minBet?: number;

  @IsOptional()
  @IsInt()
  maxBet?: number;

  @IsOptional()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  metaTitle?: string;

  @IsOptional()
  @IsString()
  metaDescription?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
