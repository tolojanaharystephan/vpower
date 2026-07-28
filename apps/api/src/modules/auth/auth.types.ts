import type { Role } from '@vpower777/types';
import type { PermissionCode } from '../rbac/permissions.constants';

export type AuthUser = {
  id: string;
  email: string;
  roles: Role[];
  permissions: PermissionCode[];
};

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  tokenType: 'Bearer';
};
