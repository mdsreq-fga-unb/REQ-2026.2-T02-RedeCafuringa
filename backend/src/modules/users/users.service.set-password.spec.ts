import { Types } from 'mongoose';
import type { Model } from 'mongoose';
import type { PasswordHasher } from '../../common/crypto/password-hasher.js';
import type { PiiCipher } from '../../common/crypto/pii-cipher.js';
import { Role } from './domain/role.js';
import type { User } from './schemas/user.schema.js';
import { UsersService } from './users.service.js';

const NOW = new Date('2026-11-06T12:00:00.000Z');

function setup() {
  const model = {
    updateOne: vi.fn().mockReturnValue({
      exec: vi.fn().mockResolvedValue({ modifiedCount: 1 }),
    }),
    findById: vi.fn(),
  };
  const hasher = { hash: vi.fn(async (value: string) => `hash:${value}`) };
  const service = new UsersService(
    model as unknown as Model<User>,
    {} as PiiCipher,
    hasher as unknown as PasswordHasher,
  );

  return { service, model, hasher };
}

describe('HU10/CA05 — UsersService.setPassword', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('grava somente o hash da nova senha e marca a troca de credencial', async () => {
    const { service, model, hasher } = setup();
    const id = new Types.ObjectId();

    await service.setPassword(id, 'NovaSenha123');

    expect(hasher.hash).toHaveBeenCalledExactlyOnceWith('NovaSenha123');
    expect(model.updateOne).toHaveBeenCalledExactlyOnceWith(
      { _id: id },
      {
        $set: {
          senhaHash: 'hash:NovaSenha123',
          credenciaisAlteradasEm: NOW,
        },
      },
    );
  });

  it('não altera nenhum outro campo da conta', async () => {
    const { service, model } = setup();

    await service.setPassword(new Types.ObjectId(), 'NovaSenha123');

    const [, update] = model.updateOne.mock.calls[0] as [
      unknown,
      { $set: Record<string, unknown> },
    ];
    expect(Object.keys(update.$set).sort()).toEqual([
      'credenciaisAlteradasEm',
      'senhaHash',
    ]);
  });

  it('propaga falha do banco', async () => {
    const { service, model } = setup();
    model.updateOne.mockReturnValue({
      exec: vi.fn().mockRejectedValue(new Error('db fora')),
    });

    await expect(
      service.setPassword(new Types.ObjectId(), 'NovaSenha123'),
    ).rejects.toThrow('db fora');
  });
});

describe('HU10/RNF08 — UsersService.findSessionState', () => {
  function chain(value: unknown) {
    const lean = vi.fn().mockReturnValue({
      exec: vi.fn().mockResolvedValue(value),
    });
    const select = vi.fn().mockReturnValue({ lean });
    return { select, lean };
  }

  it('lê só os campos que sustentam a sessão', async () => {
    const { service, model } = setup();
    const id = new Types.ObjectId().toHexString();
    const q = chain({ ativo: true, perfil: Role.CONSUMIDOR });
    model.findById.mockReturnValue({ select: q.select });

    const state = await service.findSessionState(id);

    expect(model.findById).toHaveBeenCalledWith(id);
    expect(q.select).toHaveBeenCalledWith(
      'ativo perfil credenciaisAlteradasEm',
    );
    expect(state).toEqual({ ativo: true, perfil: Role.CONSUMIDOR });
  });

  it('documento sem o campo ativo (dado antigo): considerado ativo, como no login', async () => {
    const { service, model } = setup();
    model.findById.mockReturnValue({
      select: chain({ perfil: Role.CONSUMIDOR }).select,
    });

    const state = await service.findSessionState(
      new Types.ObjectId().toHexString(),
    );

    expect(state).toEqual({ ativo: true, perfil: Role.CONSUMIDOR });
  });

  it('ativo: false continua desativado', async () => {
    const { service, model } = setup();
    model.findById.mockReturnValue({
      select: chain({ ativo: false, perfil: Role.CONSUMIDOR }).select,
    });

    const state = await service.findSessionState(
      new Types.ObjectId().toHexString(),
    );

    expect(state?.ativo).toBe(false);
  });

  it('id inválido: null sem consultar o banco', async () => {
    const { service, model } = setup();

    await expect(service.findSessionState('nao-e-id')).resolves.toBeNull();
    expect(model.findById).not.toHaveBeenCalled();
  });

  it('conta inexistente: null', async () => {
    const { service, model } = setup();
    model.findById.mockReturnValue({ select: chain(null).select });

    await expect(
      service.findSessionState(new Types.ObjectId().toHexString()),
    ).resolves.toBeNull();
  });
});
