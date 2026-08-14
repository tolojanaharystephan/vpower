import { UsersService } from './users.service';
import type { VblinkClientService } from '../game-integration/vblink-client.service';

const TEST_KEY = 'a'.repeat(64);

describe('UsersService.ensureVblinkAccount', () => {
  const userId = '550e8400-e29b-41d4-a716-446655440000';

  beforeAll(() => {
    process.env.VBLINK_ENCRYPTION_KEY = TEST_KEY;
  });

  function buildService(opts: {
    existingAccount?: string | null;
    existingEncrypted?: string | null;
    createPlayer?: jest.Mock;
    resetPassword?: jest.Mock;
  }) {
    const db = {
      update: jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(undefined),
        }),
      }),
    };
    const vblink = {
      isConfigured: () => true,
      createPlayer:
        opts.createPlayer ||
        jest.fn().mockResolvedValue({
          fullAccount: 'AG_vpuser',
          code: 1,
          alreadyExists: false,
        }),
      resetPassword: opts.resetPassword || jest.fn().mockResolvedValue(undefined),
    } as unknown as VblinkClientService;

    const service = new UsersService(db as never, vblink);
    jest.spyOn(service, 'findById').mockResolvedValue({
      id: userId,
      email: 'a@b.c',
      passwordHash: 'x',
      firstName: null,
      lastName: null,
      vblinkAccount: opts.existingAccount ?? null,
      vblinkPasswordEncrypted: opts.existingEncrypted ?? null,
      isActive: true,
      emailVerifiedAt: null,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    } as never);
    return { service, vblink, db };
  }

  it('decrypts and returns an existing encrypted account without calling createPlayer', async () => {
    const { encryptVblinkPassword } = await import('../../common/crypto/vblink-password');
    const encrypted = encryptVblinkPassword('Vpstored99a1!');
    const { service, vblink } = buildService({
      existingAccount: 'AG_existing',
      existingEncrypted: encrypted,
    });
    const result = await service.ensureVblinkAccount(userId);
    expect(result).toEqual({ account: 'AG_existing', password: 'Vpstored99a1!' });
    expect(vblink.createPlayer).not.toHaveBeenCalled();
  });

  it('creates player and stores full_account + encrypted password', async () => {
    const createPlayer = jest.fn().mockResolvedValue({
      fullAccount: 'AG_vpuser',
      code: 1,
      alreadyExists: false,
    });
    const { service, db } = buildService({ existingAccount: null, createPlayer });
    const result = await service.ensureVblinkAccount(userId);
    expect(result.account).toBe('AG_vpuser');
    expect(result.password.length).toBe(16);
    expect(createPlayer).toHaveBeenCalled();
    expect(db.update).toHaveBeenCalled();
  });

  it('accepts code 12 and resets password', async () => {
    const createPlayer = jest.fn().mockResolvedValue({
      fullAccount: undefined,
      code: 12,
      alreadyExists: true,
    });
    const resetPassword = jest.fn().mockResolvedValue(undefined);
    const { service, vblink } = buildService({
      existingAccount: null,
      createPlayer,
      resetPassword,
    });
    const result = await service.ensureVblinkAccount(userId);
    expect(result.account).toMatch(/^vp/);
    expect(vblink.resetPassword).toHaveBeenCalled();
  });
});
