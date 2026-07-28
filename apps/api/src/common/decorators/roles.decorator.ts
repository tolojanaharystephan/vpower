import { SetMetadata } from '@nestjs/common';
import type { Role } from '@vpower777/types';
import { ROLES_KEY } from '../auth.constants';

export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
