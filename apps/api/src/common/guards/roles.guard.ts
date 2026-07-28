import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Role } from '@vpower777/types';
import { ROLES_KEY } from '../auth.constants';
import type { AuthUser } from '../../modules/auth/auth.types';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required?.length) return true;

    const request = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    const user = request.user;
    if (!user) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Missing user context' });
    }

    const ok = required.some((role) => user.roles.includes(role));
    if (!ok) {
      throw new ForbiddenException({
        code: 'INSUFFICIENT_ROLE',
        message: 'Insufficient role',
      });
    }
    return true;
  }
}
