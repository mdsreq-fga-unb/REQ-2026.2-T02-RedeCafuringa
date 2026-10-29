import { BadRequestException, ConflictException } from '@nestjs/common';
import { makeConsumer, makeCpf } from '@test/factories';
import type { Model } from 'mongoose';
import { Types } from 'mongoose';
import type { PasswordHasher } from '../../common/crypto/password-hasher.js';
import type { PiiCipher } from '../../common/crypto/pii-cipher.js';
import { Role } from './domain/role.js';
import type { User } from './schemas/user.schema.js';
import { UsersService } from './users.service.js';

function query<T>(value: T) {
  return { exec: vi.fn().mockResolvedValue(value) };
}

function setup() {
  const model = {
    exists: vi.fn().mockReturnValue(query(null)),
    create: vi.fn(async (data: Record<string, unknown>) => ({
      id: new Types.ObjectId().toHexString(),
      ...data,
    })),
    findOne: vi.fn().mockReturnValue(query(null)),
    findById: vi.fn().mockReturnValue(query(null)),
  };
  const cipher = {
    blindIndex: vi.fn((value: string) => `idx:${value}`),
    encrypt: vi.fn((value: string) => `enc:${value}`),
    decrypt: vi.fn((value: string) => value.replace('enc:', '')),
  };
  const hasher = {
    hash: vi.fn(async (value: string) => `hash:${value}`),
  };
  const service = new UsersService(
    model as unknown as Model<User>,
    cipher as unknown as PiiCipher,
    hasher as unknown as PasswordHasher,
  );

  return { service, model, cipher, hasher };
}

describe('UsersService', () => {
  describe('createConsumer (HU01)', () => {
    it('CA03: cria o perfil com papel CONSUMIDOR', async () => {
      const { service, model } = setup();
      const dto = makeConsumer();

      const user = await service.createConsumer(dto);

      expect(user.perfil).toBe(Role.CONSUMIDOR);
      expect(model.create).toHaveBeenCalledWith(
        expect.objectContaining({ nome: dto.nome, perfil: Role.CONSUMIDOR }),
      );
    });

    it('RNF11: guarda CPF só como blind index + cifra e a senha só como hash', async () => {
      const { service, model } = setup();
      const dto = makeConsumer();

      await service.createConsumer(dto);

      const saved = model.create.mock.calls[0][0];
      expect(saved).toMatchObject({
        cpfHash: `idx:${dto.cpf}`,
        cpfCifrado: `enc:${dto.cpf}`,
        senhaHash: `hash:${dto.senha}`,
      });
      expect(saved).not.toHaveProperty('cpf');
      expect(saved).not.toHaveProperty('senha');
    });

    it('normaliza o e-mail para minúsculas', async () => {
      const { service, model } = setup();

      await service.createConsumer(
        makeConsumer({ email: 'Maria@Exemplo.COM' }),
      );

      expect(model.create.mock.calls[0][0].email).toBe('maria@exemplo.com');
    });

    it('RN15: recusa cadastro de menor de 18 anos', async () => {
      const { service, model } = setup();
      const seventeenYearsAgo = new Date().getUTCFullYear() - 17;

      await expect(
        service.createConsumer(
          makeConsumer({ dataNascimento: `${seventeenYearsAgo}-01-01` }),
        ),
      ).rejects.toThrow(BadRequestException);
      expect(model.create).not.toHaveBeenCalled();
    });

    it('recusa CPF já cadastrado com 409', async () => {
      const { service, model } = setup();
      model.exists.mockReturnValue(query({ _id: 'existente' }));

      await expect(service.createConsumer(makeConsumer())).rejects.toThrow(
        ConflictException,
      );
      expect(model.create).not.toHaveBeenCalled();
    });

    it('converte violação do índice único (corrida) em 409', async () => {
      const { service, model } = setup();
      model.create.mockRejectedValue(
        Object.assign(new Error('E11000'), { code: 11000 }),
      );

      await expect(service.createConsumer(makeConsumer())).rejects.toThrow(
        ConflictException,
      );
    });

    it('propaga outros erros do banco', async () => {
      const { service, model } = setup();
      model.create.mockRejectedValue(new Error('banco fora do ar'));

      await expect(service.createConsumer(makeConsumer())).rejects.toThrow(
        'banco fora do ar',
      );
    });
  });

  describe('create', () => {
    it('permite criar outros perfis (seed de produtor/admin)', async () => {
      const { service } = setup();

      const user = await service.create(makeConsumer(), Role.ADMINISTRADOR);

      expect(user.perfil).toBe(Role.ADMINISTRADOR);
    });
  });

  describe('findByCpf (RN08)', () => {
    it('busca pelo blind index, nunca pelo CPF em texto', async () => {
      const { service, model } = setup();
      const cpf = makeCpf();

      await service.findByCpf(cpf);

      expect(model.findOne).toHaveBeenCalledWith({ cpfHash: `idx:${cpf}` });
    });
  });

  describe('findById', () => {
    it('busca pelo id', async () => {
      const { service, model } = setup();
      const id = new Types.ObjectId().toHexString();
      model.findById.mockReturnValue(query({ id }));

      expect(await service.findById(id)).toEqual({ id });
    });

    it('devolve null para id malformado sem consultar o banco', async () => {
      const { service, model } = setup();

      expect(await service.findById('nao-e-object-id')).toBeNull();
      expect(model.findById).not.toHaveBeenCalled();
    });
  });

  describe('toResponse (RNF11)', () => {
    it('expõe só campos públicos do titular e o CPF mascarado', () => {
      const { service } = setup();
      const user = {
        id: 'abc',
        nome: 'Maria',
        email: 'maria@exemplo.com',
        telefone: '61999990000',
        perfil: Role.CONSUMIDOR,
        cpfHash: 'idx',
        cpfCifrado: 'enc:52998224725',
        senhaHash: 'hash',
        ativo: true,
      } as unknown as Parameters<UsersService['toResponse']>[0];

      expect(service.toResponse(user)).toEqual({
        id: 'abc',
        nome: 'Maria',
        email: 'maria@exemplo.com',
        telefone: '61999990000',
        perfil: Role.CONSUMIDOR,
        cpf: '***.982.247-**',
      });
    });
  });
});
