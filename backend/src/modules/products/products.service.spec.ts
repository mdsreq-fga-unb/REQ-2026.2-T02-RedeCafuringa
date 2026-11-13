import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import type { Model } from 'mongoose';
import { PhotoOwnerType } from '../../common/photos/photo-gallery.policy.js';
import type { PhotoGalleryService } from '../../common/photos/photo-gallery.service.js';
import { Role } from '../users/domain/role.js';
import type { User } from '../users/schemas/user.schema.js';
import { ProductCategory } from './domain/product.js';
import { buildProductSearch } from './domain/product-search.js';
import type { CreateProductDto } from './dto/create-product.dto.js';
import { ProductsService } from './products.service.js';
import type { Product } from './schemas/product.schema.js';

const CREATED_AT = new Date('2026-11-13T12:00:00.000Z');

function query<T>(value: T) {
  const q = {
    select: vi.fn(() => q),
    lean: vi.fn(() => q),
    exec: vi.fn().mockResolvedValue(value),
  };
  return q;
}

const producerId = new Types.ObjectId();
const photoRef = { id: new Types.ObjectId(), versao: 'v1' };

function productDoc(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    _id: new Types.ObjectId(),
    produtor: producerId,
    nome: 'Mel silvestre',
    categoria: ProductCategory.PRODUTOS,
    descricao: 'Mel de abelhas nativas.',
    precoCentavos: 3590,
    gramasPorUnidade: 450,
    fotos: [photoRef],
    disponivel: true,
    criadoEm: CREATED_AT,
    ...overrides,
  };
}

const dto: CreateProductDto = {
  nome: 'Mel silvestre',
  categoria: ProductCategory.PRODUTOS,
  descricao: 'Mel de abelhas nativas.',
  precoPorUnidade: 35.9,
  gramasPorUnidade: 450,
};

function setup() {
  const users = {
    findOne: vi
      .fn()
      .mockReturnValue(query({ nomeIniciativa: 'Apiário Cafuringa' })),
    collection: { name: 'users' },
  };
  const products = {
    findOne: vi.fn().mockReturnValue(query(null)),
    create: vi.fn(async (doc: Record<string, unknown>) => ({
      toObject: () => ({ ...doc, disponivel: true, criadoEm: CREATED_AT }),
    })),
    aggregate: vi.fn().mockReturnValue({
      exec: vi.fn().mockResolvedValue([{ itens: [], total: [] }]),
    }),
  };
  const gallery = {
    prepare: vi.fn().mockResolvedValue([{ versao: 'v1' }]),
    store: vi.fn().mockResolvedValue([photoRef]),
    removeAll: vi.fn().mockResolvedValue(undefined),
    find: vi.fn().mockResolvedValue({
      dados: Buffer.from([1]),
      tipo: 'image/webp',
      versao: 'v1',
    }),
  };
  const service = new ProductsService(
    users as unknown as Model<User>,
    products as unknown as Model<Product>,
    gallery as unknown as PhotoGalleryService,
  );
  return { service, users, products, gallery };
}

describe('ProductsService (HU15/RF15)', () => {
  const userId = producerId.toHexString();

  describe('create', () => {
    it('grava o produto do dono do token, em centavos, e devolve a resposta pública', async () => {
      const { service, users, products, gallery } = setup();

      const res = await service.create(userId, dto, [
        { buffer: Buffer.from('x') },
      ]);

      expect(users.findOne).toHaveBeenCalledWith({
        _id: userId,
        perfil: Role.PRODUTOR,
        ativo: true,
      });
      expect(gallery.prepare).toHaveBeenCalledWith(PhotoOwnerType.PRODUTO, [
        { buffer: Buffer.from('x') },
      ]);
      const [saved] = products.create.mock.calls[0];
      expect(saved).toMatchObject({ precoCentavos: 3590, fotos: [photoRef] });
      expect(String(saved.produtor)).toBe(userId);
      expect(saved).not.toHaveProperty('chaveIdempotencia');
      expect(res).toMatchObject({
        nome: 'Mel silvestre',
        precoPorUnidade: 35.9,
        produtor: { id: userId, nomeIniciativa: 'Apiário Cafuringa' },
        criadoEm: CREATED_AT.toISOString(),
        disponivel: true,
      });
      expect(res.fotos[0]).toBe(
        `/products/${res.id}/photos/${photoRef.id.toHexString()}?v=v1`,
      );
    });

    it('404 quando a conta não é de produtor ativo', async () => {
      const { service, users, gallery } = setup();
      users.findOne.mockReturnValue(query(null));
      await expect(service.create(userId, dto, [])).rejects.toThrow(
        NotFoundException,
      );
      expect(gallery.prepare).not.toHaveBeenCalled();
    });

    it('recusa Idempotency-Key fora do formato', async () => {
      const { service } = setup();
      await expect(service.create(userId, dto, [], 'curta')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('com chave já usada, devolve o produto existente sem gravar de novo', async () => {
      const { service, products, gallery } = setup();
      const existing = productDoc();
      products.findOne.mockReturnValue(query(existing));

      const res = await service.create(userId, dto, [], 'chave-0001');

      expect(res.id).toBe(existing._id.toHexString());
      expect(gallery.prepare).not.toHaveBeenCalled();
      expect(products.create).not.toHaveBeenCalled();
    });

    it('grava a chave quando enviada', async () => {
      const { service, products } = setup();
      await service.create(userId, dto, [], 'chave-0002');
      expect(products.create.mock.calls[0][0]).toMatchObject({
        chaveIdempotencia: 'chave-0002',
      });
    });

    it('envios simultâneos com a mesma chave: apaga as fotos e devolve o que chegou antes', async () => {
      const { service, products, gallery } = setup();
      const winner = productDoc();
      products.findOne
        .mockReturnValueOnce(query(null))
        .mockReturnValueOnce(query(winner));
      products.create.mockRejectedValueOnce(
        Object.assign(new Error('dup'), { code: 11000 }),
      );

      const res = await service.create(userId, dto, [], 'chave-0003');

      expect(gallery.removeAll).toHaveBeenCalledTimes(1);
      expect(res.id).toBe(winner._id.toHexString());
    });

    it('outra falha ao gravar: apaga as fotos e repassa o erro', async () => {
      const { service, products, gallery } = setup();
      products.create.mockRejectedValueOnce(new Error('banco fora'));
      await expect(service.create(userId, dto, [])).rejects.toThrow(
        'banco fora',
      );
      expect(gallery.removeAll).toHaveBeenCalledTimes(1);
    });

    it('chave duplicada sem produto encontrado repassa o erro', async () => {
      const { service, products } = setup();
      products.create.mockRejectedValueOnce(
        Object.assign(new Error('dup'), { code: 11000 }),
      );
      await expect(
        service.create(userId, dto, [], 'chave-0004'),
      ).rejects.toThrow('dup');
    });
  });

  describe('getPublic', () => {
    it('404 para id inválido, inexistente ou de produtor inativo', async () => {
      const { service, products, users } = setup();
      await expect(service.getPublic('nao-e-id')).rejects.toThrow(
        NotFoundException,
      );
      const id = new Types.ObjectId().toHexString();
      await expect(service.getPublic(id)).rejects.toThrow(NotFoundException);

      products.findOne.mockReturnValue(query(productDoc()));
      users.findOne.mockReturnValue(query(null));
      await expect(service.getPublic(id)).rejects.toThrow(NotFoundException);
    });

    it('devolve o produto disponível com o responsável', async () => {
      const { service, products } = setup();
      const doc = productDoc({ criadoEm: undefined, disponivel: undefined });
      products.findOne.mockReturnValue(query(doc));
      const res = await service.getPublic(doc._id.toHexString());
      expect(products.findOne.mock.calls[0][0]).toMatchObject({
        disponivel: true,
      });
      expect(res.produtor.nomeIniciativa).toBe('Apiário Cafuringa');
      expect(res.disponivel).toBe(true);
      expect(typeof res.criadoEm).toBe('string');
    });

    it('nome da iniciativa ausente vira texto vazio', async () => {
      const { service, products, users } = setup();
      products.findOne.mockReturnValue(query(productDoc()));
      users.findOne.mockReturnValue(query({}));
      const res = await service.getPublic(new Types.ObjectId().toHexString());
      expect(res.produtor.nomeIniciativa).toBe('');
    });
  });

  describe('HU20 — responsável pela oferta (CA03, CA05, RN09, RN11)', () => {
    const conta = {
      nomeIniciativa: 'Apiário Cafuringa',
      localidade: 'Fazenda Cafuringa',
      nome: 'João da Silva',
      email: 'joao@exemplo.com',
      telefone: '61999990000',
      cpfHash: 'hash',
    };

    it('detalhe traz a localidade e só os dados públicos do produtor', async () => {
      const { service, products, users } = setup();
      products.findOne.mockReturnValue(query(productDoc()));
      users.findOne.mockReturnValue(query(conta));

      const res = await service.getPublic(new Types.ObjectId().toHexString());

      expect(res.produtor).toEqual({
        id: producerId.toHexString(),
        nomeIniciativa: 'Apiário Cafuringa',
        localidade: 'Fazenda Cafuringa',
      });
    });

    it('produtor sem localidade não traz o campo', async () => {
      const { service, products, users } = setup();
      products.findOne.mockReturnValue(query(productDoc()));
      users.findOne.mockReturnValue(query({ nomeIniciativa: 'Horta' }));

      const res = await service.getPublic(new Types.ObjectId().toHexString());

      expect(res.produtor).not.toHaveProperty('localidade');
    });

    it('catálogo busca e devolve a localidade do responsável', async () => {
      const { service, products } = setup();
      const doc = { ...productDoc(), responsavel: conta };
      products.aggregate.mockReturnValue({
        exec: vi.fn().mockResolvedValue([{ itens: [doc], total: [{ n: 1 }] }]),
      });

      const res = await service.list({});

      const pipeline: Array<Record<string, { pipeline?: unknown[] }>> =
        products.aggregate.mock.calls[0][0];
      const lookup = pipeline.find((s) => s.$lookup)?.$lookup;
      expect(lookup?.pipeline).toContainEqual({
        $project: { _id: 0, nomeIniciativa: 1, localidade: 1 },
      });
      expect(res.itens[0].produtor).toEqual({
        id: producerId.toHexString(),
        nomeIniciativa: 'Apiário Cafuringa',
        localidade: 'Fazenda Cafuringa',
      });
    });
  });

  describe('getPublicPhoto', () => {
    it('404 para foto que não faz parte do produto', async () => {
      const { service, products, gallery } = setup();
      products.findOne.mockReturnValue(query(productDoc()));
      await expect(
        service.getPublicPhoto(
          new Types.ObjectId().toHexString(),
          new Types.ObjectId().toHexString(),
        ),
      ).rejects.toThrow(NotFoundException);
      expect(gallery.find).not.toHaveBeenCalled();
    });

    it('busca a foto na galeria do produto', async () => {
      const { service, products, gallery } = setup();
      const doc = productDoc();
      products.findOne.mockReturnValue(query(doc));
      const photo = await service.getPublicPhoto(
        doc._id.toHexString(),
        photoRef.id.toHexString(),
      );
      expect(photo.versao).toBe('v1');
      expect(gallery.find).toHaveBeenCalledWith(
        { tipo: PhotoOwnerType.PRODUTO, id: doc._id },
        photoRef.id.toHexString(),
      );
    });
  });

  describe('list', () => {
    it('padrão: página 1, 20 itens, só disponíveis; vazio quando não há nada', async () => {
      const { service, products } = setup();
      const res = await service.list({});
      expect(res).toEqual({ itens: [], total: 0, pagina: 1, limite: 20 });
      const pipeline = products.aggregate.mock.calls[0][0];
      expect(pipeline[0]).toEqual({ $match: { disponivel: true } });
      const facet = pipeline.find((s: Record<string, unknown>) => s.$facet);
      expect(facet.$facet.itens).toEqual([{ $skip: 0 }, { $limit: 20 }]);
    });

    it('aplica filtros e paginação e monta os itens com o responsável', async () => {
      const { service, products } = setup();
      const doc = { ...productDoc(), responsavel: { nomeIniciativa: 'Horta' } };
      products.aggregate.mockReturnValue({
        exec: vi.fn().mockResolvedValue([{ itens: [doc], total: [{ n: 5 }] }]),
      });

      const res = await service.list({
        produtor: userId,
        categoria: ProductCategory.EXPERIENCIA,
        pagina: 3,
        limite: 2,
      });

      const pipeline = products.aggregate.mock.calls[0][0];
      expect(pipeline[0].$match.categoria).toBe(ProductCategory.EXPERIENCIA);
      expect(pipeline[0].$match.produtor.toString()).toBe(userId);
      const facet = pipeline.find((s: Record<string, unknown>) => s.$facet);
      expect(facet.$facet.itens).toEqual([{ $skip: 4 }, { $limit: 2 }]);
      expect(res).toMatchObject({ total: 5, pagina: 3, limite: 2 });
      expect(res.itens[0].produtor.nomeIniciativa).toBe('Horta');
    });

    it('HU19: busca no nome e no produtor depois do $lookup e antes de paginar', async () => {
      const { service, products } = setup();
      await service.list({ busca: ' cafe ' });

      const pipeline: Array<Record<string, unknown>> =
        products.aggregate.mock.calls[0][0];
      const unwind = pipeline.findIndex((s) => s.$unwind);
      const facet = pipeline.findIndex((s) => s.$facet);
      expect(pipeline[unwind + 1]).toEqual({
        $match: buildProductSearch('cafe'),
      });
      expect(unwind + 1).toBeLessThan(facet);
    });

    it('HU19: sem termo de busca, não acrescenta filtro de texto', async () => {
      const { service, products } = setup();
      await service.list({ busca: '   ' });

      const pipeline: Array<Record<string, unknown>> =
        products.aggregate.mock.calls[0][0];
      expect(pipeline.filter((s) => s.$match)).toHaveLength(1);
    });

    it('resultado ausente do banco vira página vazia', async () => {
      const { service, products } = setup();
      products.aggregate.mockReturnValue({
        exec: vi.fn().mockResolvedValue([]),
      });
      expect((await service.list({})).total).toBe(0);
    });
  });
});
