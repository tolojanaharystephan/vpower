import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ROOM_SLUGS } from '@vpower777/types';

export class DevCreditDto {
  @IsIn([...ROOM_SLUGS])
  roomSlug!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(100)
  @Max(1_000_000)
  amountCents?: number;
}
