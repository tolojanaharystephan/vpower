import { IsIn, IsOptional } from 'class-validator';

export class UpdateTicketDto {
  @IsOptional()
  @IsIn(['open', 'pending', 'resolved', 'closed'])
  status?: 'open' | 'pending' | 'resolved' | 'closed';

  @IsOptional()
  @IsIn(['low', 'normal', 'high'])
  priority?: 'low' | 'normal' | 'high';
}
