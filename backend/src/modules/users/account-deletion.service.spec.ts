import { ConflictException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { PhotoOwnerType } from '../../common/photos/photo-gallery.policy.js';
import { AccountDeletionService } from './account-deletion.service.js';
import { DeletionReason } from './domain/deletion-reason.js';
import { Role } from './domain/role.js';

const exec = <T>(value: T) => ({ exec: vi.fn().mockResolvedValue(value) });
const lean = <T>(value: T) => {
  const chain = {
    select: vi.fn(),
    lean: vi.fn(),
    exec: vi.fn().mockResolvedValue(value),
  };
  chain.select.mockReturnValue(chain);
  chain.lean.mockReturnValue(chain);
  return chain;
};

const ADMIN = new Types.ObjectId().toHexString();
const TARGET = new Types.ObjectId();
const PRODUCT = new Types.ObjectId();
const EXPERIENCE = new Types.ObjectId();

function setup({
  target = {
    perfil: Role.PRODUTOR,
    email: 'alvo@exemplo.com',
    cpfHash: 'h-cpf',
    cnpjHash: 'h-cnpj',
  } as {
    perfil: Role;
    email: string;
    cpfHash?: string;
    cnpjHash?: string;
  } | null,
  bootstrapEmail = 'Admin@Cafuringa.local',
} = {}) {
  const calls: string[] = [];
  const track =
    (name: string) =>
    <T>(value: T) =>
      vi.fn(() => {
        calls.push(name);
        return exec(value);
      });
  const users = {
    findById: vi.fn().mockReturnValue(lean(target)),
    updateOne: track('users.updateOne')({ modifiedCount: 1 }),
    deleteOne: track('users.deleteOne')({ deletedCount: 1 }),
  };
  const products = {
    find: vi.fn().mockReturnValue(lean([{ _id: PRODUCT }])),
    deleteMany: track('products.deleteMany')({}),
  };
  const experiences = {
    find: vi.fn().mockReturnValue(lean([{ _id: EXPERIENCE }])),
    deleteMany: track('experiences.deleteMany')({}),
  };
  const producerPhotos = {
    collection: {
      deleteMany: vi.fn(async () => {
        calls.push('producerPhotos.deleteMany');
      }),
    },
  };
  const resetTokens = { deleteMany: track('resetTokens.deleteMany')({}) };
  const gallery = {
    removeAll: vi.fn(async () => {
      calls.push('gallery.removeAll');
    }),
  };
  const config = { get: vi.fn(() => bootstrapEmail) };
  const bans = {
    ban: vi.fn(async () => {
      calls.push('bans.ban');
    }),
  };
  const service = new AccountDeletionService(
    users as never,
    products as never,
    experiences as never,
    producerPhotos as never,
    resetTokens as never,
    gallery as never,
    config as never,
    bans as never,
  );
  return {
    service,
    users,
    products,
    experiences,
    producerPhotos,
    resetTokens,
    gallery,
    bans,
    calls,
  };
}

describe('AccountDeletionService', () => {
  it('banimento: bloqueia CPF, CNPJ e e-mail antes de apagar qualquer coisa', async () => {
    const s = setup();

    await s.service.delete(
      ADMIN,
      TARGET.toHexString(),
      DeletionReason.DESCUMPRIMENTO_REGRAS,
    );

    expect(s.bans.ban).toHaveBeenCalledWith({
      cpfHash: 'h-cpf',
      cnpjHash: 'h-cnpj',
      email: 'alvo@exemplo.com',
    });
    expect(s.calls[0]).toBe('bans.ban');
  });

  it('inatividade: exclui sem bloquear um novo cadastro', async () => {
    const s = setup();

    await s.service.delete(
      ADMIN,
      TARGET.toHexString(),
      DeletionReason.INATIVIDADE,
    );

    expect(s.bans.ban).not.toHaveBeenCalled();
    expect(s.users.deleteOne).toHaveBeenCalled();
  });

  it('CA04: desativa, apaga ofertas, fotos e pedidos de senha e por fim a conta', async () => {
    const s = setup();

    await s.service.delete(
      ADMIN,
      TARGET.toHexString(),
      DeletionReason.DESCUMPRIMENTO_REGRAS,
    );

    expect(s.users.updateOne).toHaveBeenCalledWith(
      { _id: TARGET },
      { $set: { ativo: false } },
    );
    expect(s.gallery.removeAll).toHaveBeenCalledWith({
      tipo: PhotoOwnerType.PRODUTO,
      id: PRODUCT,
    });
    expect(s.gallery.removeAll).toHaveBeenCalledWith({
      tipo: PhotoOwnerType.EXPERIENCIA,
      id: EXPERIENCE,
    });
    expect(s.products.deleteMany).toHaveBeenCalledWith({ produtor: TARGET });
    expect(s.experiences.deleteMany).toHaveBeenCalledWith({
      produtor: TARGET,
    });
    expect(s.producerPhotos.collection.deleteMany).toHaveBeenCalledWith({
      _id: { $in: [TARGET, TARGET.toHexString()] },
    });
    expect(s.resetTokens.deleteMany).toHaveBeenCalledWith({ userId: TARGET });
    expect(s.users.deleteOne).toHaveBeenCalledWith({ _id: TARGET });
    // Bloqueio (banimento) e desativação primeiro; a conta só some depois que
    // os dependentes saíram: se algo falhar no meio, ela segue listada
    // (desativada) e dá para repetir.
    expect(s.calls.slice(0, 2)).toEqual(['bans.ban', 'users.updateOne']);
    expect(s.calls.at(-1)).toBe('users.deleteOne');
  });

  it('CA07: 404 para id inválido ou conta inexistente, sem apagar nada', async () => {
    const s = setup({ target: null });

    await expect(
      s.service.delete(ADMIN, 'nao-e-id', DeletionReason.DESCUMPRIMENTO_REGRAS),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      s.service.delete(ADMIN, TARGET.toHexString(), DeletionReason.INATIVIDADE),
    ).rejects.toThrow('Conta não encontrada ou já excluída');
    expect(s.calls).toEqual([]);
  });

  it('CA07: 409 para a própria conta', async () => {
    const s = setup();

    await expect(
      s.service.delete(ADMIN, ADMIN, DeletionReason.DESCUMPRIMENTO_REGRAS),
    ).rejects.toThrow(
      new ConflictException('Você não pode excluir a sua própria conta'),
    );
    expect(s.users.findById).not.toHaveBeenCalled();
  });

  it('CA07: 409 para o administrador inicial, que voltaria no próximo boot', async () => {
    const s = setup({
      target: { perfil: Role.ADMINISTRADOR, email: 'admin@cafuringa.local' },
    });

    await expect(
      s.service.delete(ADMIN, TARGET.toHexString(), DeletionReason.INATIVIDADE),
    ).rejects.toThrow('A conta administrativa inicial não pode ser excluída');
    expect(s.calls).toEqual([]);
  });

  it('exclui outro administrador quando não há administrador inicial configurado', async () => {
    const s = setup({
      target: { perfil: Role.ADMINISTRADOR, email: 'admin@cafuringa.local' },
      bootstrapEmail: '',
    });

    await s.service.delete(
      ADMIN,
      TARGET.toHexString(),
      DeletionReason.INATIVIDADE,
    );

    expect(s.users.deleteOne).toHaveBeenCalled();
  });
});
