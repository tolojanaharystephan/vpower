import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../common/decorators';
import { PERMISSIONS } from '../rbac/permissions.constants';
import { AdminService } from './admin.service';

@ApiTags('admin')
@ApiBearerAuth()
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('overview')
  @RequirePermissions(PERMISSIONS.ADMIN_ACCESS)
  @ApiOperation({ summary: 'Admin dashboard overview (staff only)' })
  overview() {
    return this.admin.getOverview();
  }
}
