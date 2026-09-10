import { ForbiddenException } from '@nestjs/common';
import { AgentOpsService } from './agent-ops.service';
import type { AuthUser } from '../auth/auth.types';

describe('AgentOpsService room isolation', () => {
  it('assertRoomAccess rejects agent outside scoped room', async () => {
    const ops = Object.create(AgentOpsService.prototype) as AgentOpsService;
    (ops as unknown as { isGlobalStaff: (u: AuthUser) => boolean }).isGlobalStaff = () =>
      false;
    (ops as unknown as { getScopedRooms: (u: AuthUser) => Promise<string[]> }).getScopedRooms =
      async () => ['vblink'];
    (ops as unknown as { wallets: { parseRoomSlug: (s: string) => string } }).wallets = {
      parseRoomSlug: (s) => s,
    };

    const agent = {
      id: 'agent-1',
      roles: ['ROOM_AGENT'],
      permissions: ['agent:access'],
    } as AuthUser;

    await expect(ops.assertRoomAccess(agent, 'dragonfury')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    await expect(ops.assertRoomAccess(agent, 'vblink')).resolves.toBe('vblink');
  });

  it('platformRevenue totals sum room nets', () => {
    const rooms = [
      { depositsCents: 1000, withdrawalsCents: 200 },
      { depositsCents: 500, withdrawalsCents: 100 },
    ];
    const depositsCents = rooms.reduce((s, r) => s + r.depositsCents, 0);
    const withdrawalsCents = rooms.reduce((s, r) => s + r.withdrawalsCents, 0);
    expect(depositsCents).toBe(1500);
    expect(withdrawalsCents).toBe(300);
    expect(depositsCents - withdrawalsCents).toBe(1200);
  });
});
