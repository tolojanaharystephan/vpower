import { SetMetadata } from '@nestjs/common';
import type { PermissionCode } from '../../modules/rbac/permissions.constants';
import { PERMISSIONS_KEY } from '../auth.constants';

export const RequirePermissions = (...permissions: PermissionCode[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
