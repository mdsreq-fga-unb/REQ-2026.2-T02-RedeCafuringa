import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import type { Model } from 'mongoose';
import { PhotoOwnerType } from '../../common/photos/photo-gallery.policy.js';
import type { PhotoGalleryService } from '../../common/photos/photo-gallery.service.js';
import { Role } from '../users/domain/role.js';
import type { User } from '../users/schemas/user.schema.js';
import { ExperienceCategory } from './domain/experience.js';
import type { CreateExperienceDto } from './dto/create-experience.dto.js';
import { ExperiencesService } from './experiences.service.js';
import type { Experience } from './schemas/experience.schema.js';

const CREATED_AT = new Date('2026-11-16T12:00:00.000Z');

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

function experienceDoc(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    _id: new Types.ObjectId(),
    produtor: producerId,
    nome: 'Trilha guiada',
    categoria: ExperienceCategory.EXPERIENCIA,
    descricao: 'Caminhada até a nascente.',
    valorCentavos: 4550,
    local: 'Sítio Boa Vista',
    duracao: '2 horas',
    fotos: [photoRef],
    disponivel: true,
    criadoEm: CREATED_AT,
    ...overrides,
  };
}

const dto: CreateExperienceDto = {
  nome: 'Trilha guiada',
  categoria: ExperienceCategory.EXPERIENCIA,
  descricao: 'Caminhada até a nascente.',
  valorPorPessoa: 45.5,
  local: 'Sítio Boa Vista',
  duracao: '2 horas',
};

const PRODUCER = {
  nomeIniciativa: 'Sítio Boa Vista',
  localidade: 'Núcleo Rural Cafuringa',
};

function setup() {
  const users = {
    findOne: vi.fn().mockReturnValue(query(PRODUCER)),
    collection: { name: 'users' },
  };
  const experiences = {
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
  const service = new ExperiencesService(
    users as unknown as Model<User>,
    experiences as unknown as Model<Experience>,
    gallery as unknown as PhotoGalleryService,
  );
  return { service, users, experiences, gallery };
}

describe('ExperiencesService (HU21/RF21)', () => {
  const userId = producerId.toHexString();

  describe('create', () => {
    it('CA03, CA05: grava a experiência do dono do token, em centavos', async () => {
      const { service, users, experiences, gallery } = setup();

      const res = await service.create(userId, dto, [
        { buffer: Buffer.from('x') },
      ]);

      expect(users.findOne).toHaveBeenCalledWith({
        _id: userId,
        perfil: Role.PRODUTOR,
        ativo: true,
      });
      expect(gallery.prepare).toHaveBeenCalledWith(PhotoOwnerType.EXPERIENCIA, [
        { buffer: Buffer.from('x') },
      ]);
      const [saved] = experiences.create.mock.calls[0];
      expect(saved).toMatchObject({ valorCentavos: 4550, fotos: [photoRef] });
      expect(String(saved.produtor)).toBe(userId);
      expect(saved).not.toHaveProperty('chaveIdempotencia');
      expect(res).toMatchObject({
        valorPorPessoa: 45.5,
        local: 'Sítio Boa Vista',
        duracao: '2 horas',
        produtor: { id: userId, ...PRODUCER },
        criadoEm: CREATED_AT.toISOString(),
        disponivel: true,
      });
      expect(res.fotos[0]).toBe(
        `/experiences/${res.id}/photos/${photoRef.id.toHexString()}?v=v1`,
      );
    });

    it('omite a localidade quando o produtor não a informou', async () => {
      const { service, users } = setup();
      users.findOne.mockReturnValue(query({ nomeIniciativa: 'Sítio' }));

      const res = await service.create(userId, dto, []);

      expect(res.produtor).toEqual({ id: userId, nomeIniciativa: 'Sítio' });
    });

    it('404 quando a conta não é de produtor ativo', async () => {
      const { service, users, gallery } = setup();
      users.findOne.mockReturnValue(query(null));
      await expect(service.create(userId, dto, [])).rejects.toThrow(
        NotFoundException,
      );
      expect(gallery.prepare).not.toHaveBeenCalled();
    });

    it('404 quando o id do token não é um ObjectId', async () => {
      const { service, users } = setup();
      await expect(service.create('nao-e-id', dto, [])).rejects.toThrow(
        NotFoundException,
      );
      expect(users.findOne).not.toHaveBeenCalled();
    });

    it('recusa Idempotency-Key fora do formato', async () => {
      const { service } = setup();
      await expect(service.create(userId, dto, [], 'curta')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('trata Idempotency-Key vazia como ausente', async () => {
      const { service, experiences } = setup();
      await service.create(userId, dto, [], '');
      expect(experiences.create.mock.calls[0][0]).not.toHaveProperty(
        'chaveIdempotencia',
      );
    });

    it('CA07: mesma chave devolve a experiência já criada, sem gravar de novo', async () => {
      const { service, experiences, gallery } = setup();
      const existing = experienceDoc();
      experiences.findOne.mockReturnValue(query(existing));

      const res = await service.create(userId, dto, [], 'chave-0001');

      expect(res.id).toBe(existing._id.toHexString());
      expect(experiences.create).not.toHaveBeenCalled();
      expect(gallery.store).not.toHaveBeenCalled();
    });

    it('CA07: grava a chave quando é o primeiro envio', async () => {
      const { service, experiences } = setup();
      await service.create(userId, dto, [], 'chave-0001');
      expect(experiences.create.mock.calls[0][0]).toMatchObject({
        chaveIdempotencia: 'chave-0001',
      });
    });

    it('envios simultâneos com a mesma chave: remove as fotos e devolve a que venceu', async () => {
      const { service, experiences, gallery } = setup();
      const winner = experienceDoc();
      experiences.findOne
        .mockReturnValueOnce(query(null))
        .mockReturnValueOnce(query(winner));
      experiences.create.mockRejectedValueOnce({ code: 11000 });

      const res = await service.create(userId, dto, [], 'chave-0001');

      expect(gallery.removeAll).toHaveBeenCalled();
      expect(res.id).toBe(winner._id.toHexString());
    });

    it('outra falha ao gravar: remove as fotos e propaga o erro', async () => {
      const { service, experiences, gallery } = setup();
      experiences.create.mockRejectedValueOnce(new Error('banco fora'));

      await expect(service.create(userId, dto, [])).rejects.toThrow(
        'banco fora',
      );
      expect(gallery.removeAll).toHaveBeenCalledWith({
        tipo: PhotoOwnerType.EXPERIENCIA,
        id: expect.any(Types.ObjectId),
      });
    });

    it('duplicada sem chave encontrada depois: propaga o erro', async () => {
      const { service, experiences } = setup();
      experiences.create.mockRejectedValueOnce({ code: 11000 });
      await expect(
        service.create(userId, dto, [], 'chave-0001'),
      ).rejects.toEqual({ code: 11000 });
    });
  });

  describe('getPublic', () => {
    it('CA08: devolve a experiência disponível com o responsável', async () => {
      const { service, experiences, users } = setup();
      const doc = experienceDoc();
      experiences.findOne.mockReturnValue(query(doc));
      users.findOne.mockReturnValue(
        query({ ...PRODUCER, nome: 'Joana Silva' }),
      );

      const res = await service.getPublic(doc._id.toHexString());

      expect(experiences.findOne).toHaveBeenCalledWith({
        _id: doc._id.toHexString(),
        disponivel: true,
      });
      expect(res.produtor).toEqual({
        id: userId,
        ...PRODUCER,
        primeiroNome: 'Joana',
      });
    });

    it('404 para id inválido, inexistente ou de produtor desativado', async () => {
      const { service, experiences, users } = setup();
      await expect(service.getPublic('x')).rejects.toThrow(
        'Experiência não encontrada',
      );
      await expect(
        service.getPublic(new Types.ObjectId().toHexString()),
      ).rejects.toThrow(NotFoundException);

      experiences.findOne.mockReturnValue(query(experienceDoc()));
      users.findOne.mockReturnValue(query(null));
      await expect(
        service.getPublic(new Types.ObjectId().toHexString()),
      ).rejects.toThrow(NotFoundException);
    });

    it('usa valores padrão quando o documento não traz data nem disponibilidade', async () => {
      const { service, experiences, users } = setup();
      experiences.findOne.mockReturnValue(
        query(experienceDoc({ criadoEm: undefined, disponivel: undefined })),
      );
      users.findOne.mockReturnValue(query({}));

      const res = await service.getPublic(new Types.ObjectId().toHexString());

      expect(res.disponivel).toBe(true);
      expect(res.produtor.nomeIniciativa).toBe('');
      expect(typeof res.criadoEm).toBe('string');
    });
  });

  describe('list', () => {
    it('catálogo público: só disponíveis, produtor ativo, paginado', async () => {
      const { service, experiences } = setup();
      const doc = { ...experienceDoc(), responsavel: PRODUCER };
      experiences.aggregate.mockReturnValue({
        exec: vi.fn().mockResolvedValue([{ itens: [doc], total: [{ n: 7 }] }]),
      });

      const res = await service.list({ pagina: 2, limite: 5 });

      const [pipeline] = experiences.aggregate.mock.calls[0];
      expect(pipeline[0]).toEqual({ $match: { disponivel: true } });
      expect(pipeline[2].$lookup.pipeline[0]).toEqual({
        $match: { perfil: Role.PRODUTOR, ativo: true },
      });
      expect(pipeline.at(-1).$facet.itens).toEqual([
        { $skip: 5 },
        { $limit: 5 },
      ]);
      expect(res).toMatchObject({ total: 7, pagina: 2, limite: 5 });
      expect(res.itens[0].produtor).toEqual({ id: userId, ...PRODUCER });
    });

    it('filtra pelo produtor e usa a página padrão', async () => {
      const { service, experiences } = setup();

      const res = await service.list({ produtor: userId });

      const [pipeline] = experiences.aggregate.mock.calls[0];
      expect(String(pipeline[0].$match.produtor)).toBe(userId);
      expect(res).toEqual({ itens: [], total: 0, pagina: 1, limite: 20 });
    });

    it('resultado vazio do banco vira página vazia', async () => {
      const { service, experiences } = setup();
      experiences.aggregate.mockReturnValue({
        exec: vi.fn().mockResolvedValue([]),
      });
      const res = await service.list({});
      expect(res.itens).toEqual([]);
      expect(res.total).toBe(0);
    });
  });

  describe('getPublicPhoto', () => {
    it('serve só foto que pertence à experiência visível', async () => {
      const { service, experiences, gallery } = setup();
      const doc = experienceDoc();
      experiences.findOne.mockReturnValue(query(doc));

      await service.getPublicPhoto(
        doc._id.toHexString(),
        photoRef.id.toHexString(),
      );

      expect(gallery.find).toHaveBeenCalledWith(
        { tipo: PhotoOwnerType.EXPERIENCIA, id: doc._id },
        photoRef.id.toHexString(),
      );
      await expect(
        service.getPublicPhoto(
          doc._id.toHexString(),
          new Types.ObjectId().toHexString(),
        ),
      ).rejects.toThrow('Foto não encontrada');
    });
  });
});
