import {
  BadRequestException,
  NotFoundException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { mongo, Types } from 'mongoose';
import type { Model } from 'mongoose';
import sharp from 'sharp';
import { Role } from '../users/domain/role.js';
import type { User } from '../users/schemas/user.schema.js';
import { ProducerPhotoService } from './producer-photo.service.js';
import type { ProducerPhoto } from './schemas/producer-photo.schema.js';

const { Binary } = mongo;

const NOW = new Date('2026-11-07T12:00:00.000Z');

function query<T>(value: T) {
  const q = {
    select: vi.fn(() => q),
    lean: vi.fn(() => q),
    exec: vi.fn().mockResolvedValue(value),
  };
  return q;
}

const jpeg = (width = 300, height = 200) =>
  sharp({ create: { width, height, channels: 3, background: '#c84' } })
    .jpeg()
    .toBuffer();

function setup() {
  const users = {
    exists: vi.fn().mockReturnValue(query(null)),
    updateOne: vi.fn().mockReturnValue(query({ matchedCount: 1 })),
  };
  const photos = {
    findById: vi.fn().mockReturnValue(query(null)),
    updateOne: vi.fn().mockReturnValue(query({ matchedCount: 1 })),
    deleteOne: vi.fn().mockReturnValue(query({ deletedCount: 1 })),
  };
  const service = new ProducerPhotoService(
    users as unknown as Model<User>,
    photos as unknown as Model<ProducerPhoto>,
  );
  return { service, users, photos };
}

const activeProducer = (id: string) => ({
  _id: id,
  perfil: Role.PRODUTOR,
  ativo: true,
});

describe('ProducerPhotoService (HU12/RF12)', () => {
  const id = new Types.ObjectId().toHexString();

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('save', () => {
    it('grava a foto processada e devolve a URL versionada', async () => {
      const { service, users, photos } = setup();

      const result = await service.save(id, { buffer: await jpeg() });

      const [filter, update, options] = photos.updateOne.mock.calls[0];
      expect(filter).toEqual({ _id: id });
      expect(options).toEqual({ upsert: true });
      const saved = update.$set;
      expect(saved).toMatchObject({
        tipo: 'image/webp',
        largura: 300,
        altura: 200,
        atualizadoEm: NOW,
      });
      expect((await sharp(saved.dados).metadata()).format).toBe('webp');

      expect(users.updateOne).toHaveBeenCalledWith(activeProducer(id), {
        $set: { fotoVersao: saved.versao },
      });
      expect(result).toEqual({
        fotoUrl: `/producers/${id}/photo?v=${saved.versao}`,
      });
    });

    it('400 quando nenhum arquivo é enviado', async () => {
      const { service, photos } = setup();

      await expect(service.save(id, undefined)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      await expect(
        service.save(id, { buffer: Buffer.alloc(0) }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(photos.updateOne).not.toHaveBeenCalled();
    });

    it('415 para formato não aceito, sem gravar nada', async () => {
      const { service, photos, users } = setup();

      const error = await service
        .save(id, { buffer: Buffer.from('não é imagem') })
        .catch((e: unknown) => e);

      expect(error).toBeInstanceOf(UnsupportedMediaTypeException);
      expect((error as Error).message).toMatch(/PNG, JPEG ou WebP/);
      expect(photos.updateOne).not.toHaveBeenCalled();
      expect(users.updateOne).not.toHaveBeenCalled();
    });

    it('400 para imagem pequena demais', async () => {
      const { service } = setup();

      await expect(
        service.save(id, { buffer: await jpeg(10, 10) }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('propaga erros inesperados sem disfarçá-los de erro do usuário', async () => {
      const { service, photos } = setup();
      photos.updateOne.mockReturnValue({
        exec: vi.fn().mockRejectedValue(new Error('banco fora')),
      });

      await expect(service.save(id, { buffer: await jpeg() })).rejects.toThrow(
        'banco fora',
      );
    });

    it('404 e descarta a foto se a conta deixou de ser um produtor ativo', async () => {
      const { service, users, photos } = setup();
      users.updateOne.mockReturnValue(query({ matchedCount: 0 }));

      await expect(
        service.save(id, { buffer: await jpeg() }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(photos.deleteOne).toHaveBeenCalledWith({ _id: id });
    });
  });

  describe('remove', () => {
    it('desvincula a foto da conta e apaga o binário', async () => {
      const { service, users, photos } = setup();

      await service.remove(id);

      expect(users.updateOne).toHaveBeenCalledWith(activeProducer(id), {
        $unset: { fotoVersao: 1 },
      });
      expect(photos.deleteOne).toHaveBeenCalledWith({ _id: id });
    });

    it('é idempotente: remover sem ter foto não é erro', async () => {
      const { service, photos } = setup();
      photos.deleteOne.mockReturnValue(query({ deletedCount: 0 }));

      await expect(service.remove(id)).resolves.toBeUndefined();
    });

    it('404 para conta inexistente ou desativada', async () => {
      const { service, users, photos } = setup();
      users.updateOne.mockReturnValue(query({ matchedCount: 0 }));

      await expect(service.remove(id)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(photos.deleteOne).not.toHaveBeenCalled();
    });
  });

  describe('getPublic', () => {
    const stored = {
      dados: Buffer.from('webp'),
      tipo: 'image/webp',
      versao: 'v1',
    };

    it('devolve a foto de um produtor ativo com trajetória publicada', async () => {
      const { service, users, photos } = setup();
      users.exists.mockReturnValue(query({ _id: id }));
      photos.findById.mockReturnValue(query(stored));

      await expect(service.getPublic(id)).resolves.toEqual(stored);
      expect(users.exists).toHaveBeenCalledWith({
        ...activeProducer(id),
        trajetoria: { $type: 'string', $ne: '' },
        fotoVersao: { $exists: true },
      });
      expect(photos.findById).toHaveBeenCalledWith(id);
    });

    it('converte o binário do BSON (lean) em Buffer', async () => {
      const { service, users, photos } = setup();
      users.exists.mockReturnValue(query({ _id: id }));
      photos.findById.mockReturnValue(
        query({ ...stored, dados: new Binary(Buffer.from('webp')) }),
      );

      const photo = await service.getPublic(id);

      expect(Buffer.isBuffer(photo.dados)).toBe(true);
      expect(photo.dados.toString()).toBe('webp');
    });

    it.each(['nao-e-id', '', '123'])(
      '404 para identificador inválido (%j) sem consultar o banco',
      async (bad) => {
        const { service, users } = setup();

        await expect(service.getPublic(bad)).rejects.toBeInstanceOf(
          NotFoundException,
        );
        expect(users.exists).not.toHaveBeenCalled();
      },
    );

    it('404 quando o perfil não está visível ou não tem foto', async () => {
      const { service, photos } = setup();

      await expect(service.getPublic(id)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(photos.findById).not.toHaveBeenCalled();
    });

    it('404 quando o binário sumiu', async () => {
      const { service, users } = setup();
      users.exists.mockReturnValue(query({ _id: id }));

      await expect(service.getPublic(id)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
