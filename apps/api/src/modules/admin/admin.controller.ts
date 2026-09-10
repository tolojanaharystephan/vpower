import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ROLES } from '@vpower777/types';
import { CurrentUser, RequirePermissions } from '../../common/decorators';
import type { AuthUser } from '../auth/auth.types';
import { UsersService } from '../users/users.service';
import { PERMISSIONS } from '../rbac/permissions.constants';
import { AgentOpsService } from '../agent/agent-ops.service';
import { AssignAgentDto, CreateAgentDto, RevenueQueryDto } from '../agent/dto/agent.dto';
import { AdminService } from './admin.service';

@ApiTags('admin')
@ApiBearerAuth()
@Controller('admin')
export class AdminController {
  constructor(
    private readonly admin: AdminService,
    private readonly ops: AgentOpsService,
    private readonly users: UsersService,
  ) {}

  @Get('overview')
  @RequirePermissions(PERMISSIONS.ADMIN_ACCESS)
  @ApiOperation({ summary: 'Admin dashboard overview (staff only)' })
  overview() {
    return this.admin.getOverview();
  }

  @Get('rooms')
  @RequirePermissions(PERMISSIONS.ADMIN_ACCESS)
  rooms(@CurrentUser() user: AuthUser) {
    return this.ops.listMyRooms(user);
  }

  @Get('revenue')
  @RequirePermissions(PERMISSIONS.REVENUE_READ)
  @ApiOperation({ summary: 'Platform + per-room recettes (deposits / withdrawals / net)' })
  revenue(@CurrentUser() user: AuthUser, @Query() query: RevenueQueryDto) {
    return this.ops.platformRevenue(
      user,
      query.from ? new Date(query.from) : undefined,
      query.to ? new Date(query.to) : undefined,
    );
  }

  @Get('agents')
  @RequirePermissions(PERMISSIONS.AGENTS_MANAGE)
  listAgents() {
    return this.ops.listAgentAssignments();
  }

  @Post('agents/assign')
  @RequirePermissions(PERMISSIONS.AGENTS_MANAGE)
  async assign(@Body() body: AssignAgentDto) {
    await this.users.assignRole(body.userId, ROLES.ROOM_AGENT);
    return this.ops.assignAgent(body.userId, body.roomSlugs);
  }

  @Post('agents')
  @RequirePermissions(PERMISSIONS.AGENTS_MANAGE)
  @ApiOperation({ summary: 'Create a ROOM_AGENT user and assign rooms' })
  async createAgent(@Body() body: CreateAgentDto) {
    const existing = await this.users.findByEmail(body.email);
    let userId = existing?.id;
    if (!existing) {
      const created = await this.users.createUser({
        email: body.email,
        password: body.password,
        firstName: body.firstName,
        lastName: body.lastName,
      });
      userId = created.id;
    }
    await this.users.assignRole(userId!, ROLES.ROOM_AGENT);
    const scopes = await this.ops.assignAgent(userId!, body.roomSlugs);
    return { userId: userId!, rooms: scopes.rooms };
  }
}
