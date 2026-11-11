import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { makeConsumer, makeProducer } from '@test/factories';
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

/** Consulta encadeável do Mongoose (find().select().sort()...exec()). */
function chainQuery<T>(value: T) {
  const chain = {
    select: vi.fn<(fields: string) => unknown>(),
    sort: vi.fn<(order: Record<string, number>) => unknown>(),
    collation: vi.fn<(options: object) => unknown>(),
    skip: vi.fn<(count: number) => unknown>(),
    limit: vi.fn<(count: number) => unknown>(),
    exec: vi.fn().mockResolvedValue(value),
  };
  for (const step of [
    chain.select,
    chain.sort,
    chain.collation,
    chain.skip,
    chain.limit,
  ]) {
    step.mockReturnValue(chain);
  }
  return chain;
}

function setup() {
  const model = {
    find: vi.fn().mockReturnValue(chainQuery([])),
    countDocuments: vi.fn().mockReturnValue(query(0)),
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

    it('RNF15: recusa cadastro de menor de 18 anos', async () => {
      const { service, model } = setup();
      const seventeenYearsAgo = new Date().getUTCFullYear() - 17;

      await expect(
        service.createConsumer(
          makeConsumer({ dataNascimento: `${seventeenYearsAgo}-01-01` }),
        ),
      ).rejects.toThrow(BadRequestException);
      expect(model.create).not.toHaveBeenCalled();
    });

    it('RF01: cadastra sem telefone', async () => {
      const { service, model } = setup();
      const { nome, cpf, email, senha, dataNascimento } = makeConsumer();

      await service.createConsumer({ nome, cpf, email, senha, dataNascimento });

      const saved = model.create.mock.calls[0][0];
      expect(saved.telefone).toBeUndefined();
      expect(saved.dataNascimento).toBeInstanceOf(Date);
    });

    it('RNF15: recusa cadastro sem data de nascimento', async () => {
      const { service, model } = setup();
      const { nome, cpf, email, senha } = makeConsumer();

      await expect(
        service.createConsumer({ nome, cpf, email, senha } as never),
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

  describe('createProducer (HU02)', () => {
    it('CA01/CA05: cria o perfil PRODUTOR com os dados da iniciativa', async () => {
      const { service, model } = setup();
      const dto = makeProducer();

      const user = await service.createProducer(dto);

      expect(user.perfil).toBe(Role.PRODUTOR);
      expect(model.create).toHaveBeenCalledWith(
        expect.objectContaining({
          nome: dto.nomeResponsavel,
          nomeIniciativa: dto.nomeIniciativa,
          nomeResponsavel: dto.nomeResponsavel,
          localidade: dto.localidade,
          categoriaOfertada: dto.categoriaOfertada,
          formasPagamento: dto.formasPagamento,
          perfil: Role.PRODUTOR,
        }),
      );
    });

    it('RN02/RNF11: guarda CPF e CNPJ sem texto claro e protege a senha', async () => {
      const { service, model, cipher, hasher } = setup();
      const dto = makeProducer();

      await service.createProducer(dto);

      const saved = model.create.mock.calls[0][0];
      expect(saved).toMatchObject({
        cpfHash: `idx:${dto.cpf}`,
        cpfCifrado: `enc:${dto.cpf}`,
        cnpjHash: `idx:${dto.cnpj}`,
        cnpjCifrado: `enc:${dto.cnpj}`,
        senhaHash: `hash:${dto.senha}`,
      });
      expect(saved).not.toHaveProperty('cpf');
      expect(saved).not.toHaveProperty('cnpj');
      expect(saved).not.toHaveProperty('senha');
      expect(cipher.encrypt).toHaveBeenCalledWith(dto.cnpj);
      expect(hasher.hash).toHaveBeenCalledWith(dto.senha);
    });

    it('RF02/RN02: aceita cadastro sem CNPJ e não grava dados opcionais do CNPJ', async () => {
      const { service, model, cipher } = setup();
      const dto = makeProducer({ cnpj: undefined });

      await service.createProducer(dto);

      const saved = model.create.mock.calls[0][0];
      expect(saved).not.toHaveProperty('cnpjHash');
      expect(saved).not.toHaveProperty('cnpjCifrado');
      expect(cipher.encrypt).not.toHaveBeenCalledWith(undefined);
    });

    it('RN02/RNF03: normaliza o e-mail para minúsculas antes de salvar', async () => {
      const { service, model } = setup();

      await service.createProducer(
        makeProducer({ email: 'Produtor@Exemplo.COM' }),
      );

      expect(model.create.mock.calls[0][0].email).toBe('produtor@exemplo.com');
    });

    it('CA04/RN02: recusa CPF já cadastrado com 409', async () => {
      const { service, model } = setup();
      model.exists.mockReturnValueOnce(query({ _id: 'cpf-existente' }));

      await expect(service.createProducer(makeProducer())).rejects.toThrow(
        ConflictException,
      );
      expect(model.create).not.toHaveBeenCalled();
    });

    it('RF02/RN02: recusa e-mail já cadastrado com 409', async () => {
      const { service, model } = setup();
      model.exists
        .mockReturnValueOnce(query(null))
        .mockReturnValueOnce(query({ _id: 'email-existente' }));

      await expect(service.createProducer(makeProducer())).rejects.toThrow(
        ConflictException,
      );
      expect(model.create).not.toHaveBeenCalled();
    });

    it('RF02/RN02: recusa CNPJ já cadastrado com 409 quando informado', async () => {
      const { service, model } = setup();
      model.exists
        .mockReturnValueOnce(query(null))
        .mockReturnValueOnce(query(null))
        .mockReturnValueOnce(query({ _id: 'cnpj-existente' }));

      await expect(service.createProducer(makeProducer())).rejects.toThrow(
        ConflictException,
      );
      expect(model.create).not.toHaveBeenCalled();
    });

    it('RF02/RN02: converte corrida do índice único em 409', async () => {
      const { service, model } = setup();
      model.create.mockRejectedValue(
        Object.assign(new Error('E11000'), { code: 11000 }),
      );

      await expect(service.createProducer(makeProducer())).rejects.toThrow(
        ConflictException,
      );
    });

    it('RNF07/RNF03: propaga falhas não relacionadas a duplicidade do banco', async () => {
      const { service, model } = setup();
      model.create.mockRejectedValue(new Error('banco fora do ar'));

      await expect(service.createProducer(makeProducer())).rejects.toThrow(
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

  describe('createAdmin (HU03, RF03)', () => {
    it('CA05: grava a conta com perfil ADMINISTRADOR, e-mail em minúsculas e senha com hash', async () => {
      const { service, model, hasher } = setup();

      const user = await service.createAdmin({
        email: 'Admin@Exemplo.COM',
        senha: 'SenhaForte123',
      });

      const saved = model.create.mock.calls[0][0];
      expect(user.perfil).toBe(Role.ADMINISTRADOR);
      expect(saved.perfil).toBe(Role.ADMINISTRADOR);
      expect(saved.email).toBe('admin@exemplo.com');
      expect(saved.senhaHash).toBe('hash:SenhaForte123');
      expect(hasher.hash).toHaveBeenCalledWith('SenhaForte123');
    });

    it('HU03 só pede e-mail e senha: não grava CPF, CNPJ nem data de nascimento', async () => {
      const { service, model } = setup();

      await service.createAdmin({
        email: 'admin@exemplo.com',
        senha: 'SenhaForte123',
      });

      const saved = model.create.mock.calls[0][0];
      expect(saved).not.toHaveProperty('cpfHash');
      expect(saved).not.toHaveProperty('cpfCifrado');
      expect(saved).not.toHaveProperty('dataNascimento');
      expect(saved.nome).toBeTruthy();
    });

    it('CA04: recusa e-mail já cadastrado com 409', async () => {
      const { service, model } = setup();
      model.exists.mockReturnValue(query({ _id: 'existente' }));

      await expect(
        service.createAdmin({ email: 'a@b.com', senha: 'SenhaForte123' }),
      ).rejects.toThrow(new ConflictException('E-mail já cadastrado'));
      expect(model.create).not.toHaveBeenCalled();
    });

    it('CA04: converte corrida do índice único de e-mail em 409', async () => {
      const { service, model } = setup();
      model.create.mockRejectedValue(
        Object.assign(new Error('E11000'), {
          code: 11000,
          keyPattern: { email: 1 },
        }),
      );

      await expect(
        service.createAdmin({ email: 'a@b.com', senha: 'SenhaForte123' }),
      ).rejects.toThrow(ConflictException);
    });

    it('não disfarça de "e-mail repetido" uma chave duplicada de outro índice', async () => {
      const { service, model } = setup();
      const indexError = Object.assign(new Error('E11000'), {
        code: 11000,
        keyPattern: { cpfHash: 1 },
      });
      model.create.mockRejectedValue(indexError);

      await expect(
        service.createAdmin({ email: 'a@b.com', senha: 'SenhaForte123' }),
      ).rejects.toBe(indexError);
    });
  });

  describe('findByEmail (RN05)', () => {
    it('busca pelo e-mail normalizado em minúsculas', async () => {
      const { service, model } = setup();

      await service.findByEmail('Maria@Exemplo.COM');

      expect(model.findOne).toHaveBeenCalledWith({
        email: 'maria@exemplo.com',
      });
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

  describe('list (HU04)', () => {
    const consumer = {
      id: 'c1',
      nome: 'Maria',
      email: 'maria@exemplo.com',
      perfil: Role.CONSUMIDOR,
    };
    const producer = {
      id: 'p1',
      nome: 'João',
      email: 'joao@exemplo.com',
      perfil: Role.PRODUTOR,
      nomeIniciativa: 'Horta Cafuringa',
    };

    it('CA09: devolve a página com os usuários e o total', async () => {
      const { service, model } = setup();
      model.find.mockReturnValue(chainQuery([consumer, producer]));
      model.countDocuments.mockReturnValue(query(2));

      const page = await service.list({});

      expect(page).toEqual({
        itens: [
          {
            id: 'c1',
            nome: 'Maria',
            email: 'maria@exemplo.com',
            perfil: Role.CONSUMIDOR,
          },
          {
            id: 'p1',
            nome: 'João',
            email: 'joao@exemplo.com',
            perfil: Role.PRODUTOR,
            nomeIniciativa: 'Horta Cafuringa',
          },
        ],
        total: 2,
        pagina: 1,
        limite: 20,
      });
    });

    it('CA08: sem registros, devolve lista vazia e total zero', async () => {
      const { service } = setup();

      await expect(service.list({})).resolves.toMatchObject({
        itens: [],
        total: 0,
      });
    });

    it('aplica o mesmo filtro de perfil e busca na página e na contagem', async () => {
      const { service, model } = setup();

      await service.list({ perfil: Role.PRODUTOR, busca: 'horta' });

      const filter = model.find.mock.calls[0][0];
      expect(filter).toMatchObject({ perfil: Role.PRODUTOR });
      expect(filter.$or).toHaveLength(3);
      expect(model.countDocuments).toHaveBeenCalledWith(filter);
    });

    it('pagina com skip/limit e ordena por nome', async () => {
      const { service, model } = setup();
      const chain = chainQuery([]);
      model.find.mockReturnValue(chain);

      const page = await service.list({ pagina: 3, limite: 10 });

      expect(chain.skip).toHaveBeenCalledWith(20);
      expect(chain.limit).toHaveBeenCalledWith(10);
      expect(chain.sort).toHaveBeenCalledWith({ nome: 1, _id: 1 });
      expect(page).toMatchObject({ pagina: 3, limite: 10 });
    });

    it('CA06/RNF11: não carrega senha, hashes nem documentos do banco', async () => {
      const { service, model } = setup();
      const chain = chainQuery([]);
      model.find.mockReturnValue(chain);

      await service.list({});

      const [projection] = chain.select.mock.calls[0];
      for (const field of [
        'senhaHash',
        'cpfHash',
        'cpfCifrado',
        'cnpjHash',
        'cnpjCifrado',
      ]) {
        expect(projection).toContain(`-${field}`);
      }
    });
  });

  describe('findDetail (HU04)', () => {
    it('devolve o produtor com documentos mascarados e sem senha', async () => {
      const { service, model } = setup();
      const id = new Types.ObjectId().toHexString();
      model.findById.mockReturnValue(
        chainQuery({
          id,
          nome: 'João',
          email: 'joao@exemplo.com',
          telefone: '61999990000',
          perfil: Role.PRODUTOR,
          cpfCifrado: 'enc:52998224725',
          cnpjCifrado: 'enc:11222333000181',
          nomeIniciativa: 'Horta',
          nomeResponsavel: 'João',
          localidade: 'Cafuringa',
          categoriaOfertada: 'Produtos',
          formasPagamento: ['PIX'],
          senhaHash: 'hash',
        }),
      );

      const detail = await service.findDetail(id);

      expect(detail).toEqual({
        id,
        nome: 'João',
        email: 'joao@exemplo.com',
        telefone: '61999990000',
        perfil: Role.PRODUTOR,
        cpf: '***.982.247-**',
        cnpj: '**.222.333/0001-**',
        nomeIniciativa: 'Horta',
        nomeResponsavel: 'João',
        localidade: 'Cafuringa',
        categoriaOfertada: 'Produtos',
        formasPagamento: ['PIX'],
      });
    });

    it('CA04: administrador não tem documentos nem campos de produtor', async () => {
      const { service, model } = setup();
      const id = new Types.ObjectId().toHexString();
      model.findById.mockReturnValue(
        chainQuery({
          id,
          nome: 'Administrador',
          email: 'admin@exemplo.com',
          perfil: Role.ADMINISTRADOR,
        }),
      );

      await expect(service.findDetail(id)).resolves.toEqual({
        id,
        nome: 'Administrador',
        email: 'admin@exemplo.com',
        perfil: Role.ADMINISTRADOR,
      });
    });

    it('CA06: não carrega senha nem hashes do banco', async () => {
      const { service, model } = setup();
      const chain = chainQuery({
        id: 'x',
        nome: 'Maria',
        email: 'maria@exemplo.com',
        perfil: Role.CONSUMIDOR,
      });
      model.findById.mockReturnValue(chain);

      await service.findDetail(new Types.ObjectId().toHexString());

      const [projection] = chain.select.mock.calls[0];
      expect(projection).toContain('-senhaHash');
      expect(projection).toContain('-cpfHash');
      expect(projection).toContain('-cnpjHash');
    });

    it('responde 404 para usuário inexistente', async () => {
      const { service, model } = setup();
      model.findById.mockReturnValue(chainQuery(null));

      await expect(
        service.findDetail(new Types.ObjectId().toHexString()),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('responde 404 para id malformado sem consultar o banco', async () => {
      const { service, model } = setup();

      await expect(service.findDetail('abc')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(model.findById).not.toHaveBeenCalled();
    });
  });
});
