import { SetMetadata } from '@nestjs/common';
import { IS_PUBLIC_KEY } from '../auth.constants';

/** Mark route as publicly accessible (no JWT). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
