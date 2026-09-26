import { Body, Controller, Get, NotFoundException, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ROLES } from '@vpower777/types';
import { CurrentUser, RequirePermissions, Roles } from '../../common/decorators';
import { hashPassword } from '../../common/crypto/password';
import type { AuthUser } from '../auth/auth.types';
import { UsersService } from '../users/users.service';
import { PERMISSIONS } from '../rbac/permissions.constants';
import { AgentOpsService } from '../agent/agent-ops.service';
import {
  AssignAgentDto,
  CreateAgentDto,
  RevenueQueryDto,
  UpdateAgentDto,
} from '../agent/dto/agent.dto';
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
  @Roles(ROLES.SUPER_ADMIN)
  @RequirePermissions(PERMISSIONS.AGENTS_MANAGE)
  listAgents() {
    return this.ops.listAgentAssignments();
  }

  @Post('agents/assign')
  @Roles(ROLES.SUPER_ADMIN)
  @RequirePermissions(PERMISSIONS.AGENTS_MANAGE)
  async assign(@Body() body: AssignAgentDto) {
    await this.users.assignRole(body.userId, ROLES.ROOM_AGENT);
    return this.ops.assignAgent(body.userId, body.roomSlugs);
  }

  @Post('agents')
  @Roles(ROLES.SUPER_ADMIN)
  @RequirePermissions(PERMISSIONS.AGENTS_MANAGE)
  @ApiOperation({ summary: 'Create a ROOM_AGENT user and assign rooms (SUPER_ADMIN only)' })
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
      await this.users.markEmailVerified(userId);
    }
    await this.users.assignRole(userId!, ROLES.ROOM_AGENT);
    const scopes = await this.ops.assignAgent(userId!, body.roomSlugs);
    return { userId: userId!, rooms: scopes.rooms };
  }

  @Patch('agents/:userId')
  @Roles(ROLES.SUPER_ADMIN)
  @RequirePermissions(PERMISSIONS.AGENTS_MANAGE)
  @ApiOperation({
    summary: 'Update room agent: rooms, password, name (SUPER_ADMIN only)',
  })
  async updateAgent(@Param('userId') userId: string, @Body() body: UpdateAgentDto) {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    await this.users.assignRole(userId, ROLES.ROOM_AGENT);
    if (body.firstName !== undefined || body.lastName !== undefined) {
      await this.users.updateProfile(userId, {
        firstName: body.firstName,
        lastName: body.lastName,
      });
    }
    if (body.password) {
      await this.users.updatePassword(userId, await hashPassword(body.password));
    }
    const rooms =
      body.roomSlugs !== undefined
        ? (await this.ops.assignAgent(userId, body.roomSlugs)).rooms
        : (await this.ops.listAgentAssignments()).find((a) => a.userId === userId)?.rooms ?? [];
    return { userId, rooms };
  }
}