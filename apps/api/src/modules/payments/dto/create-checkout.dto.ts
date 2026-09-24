import { IsIn, IsInt, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ROOM_SLUGS } from '@vpower777/types';

export class CreateCheckoutDto {
  @IsIn([...ROOM_SLUGS])
  roomSlug!: string;

  /** Fiat USD cents (AllScale currency=1). Min $1.00 for a clean UX floor above 0.1 USDT. */
  @Type(() => Number)
  @IsInt()
  @Min(100)
  @Max(500_000)
  amountCents!: number;
}
