import {
  BadRequestException,
  NotFoundException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { mongo, Types } from 'mongoose';
import type { Model } from 'mongoose';
import sharp from 'sharp';
import {
  PHOTO_GALLERY_POLICIES,
  PhotoOwnerType,
} from './photo-gallery.policy.js';
import { PhotoGalleryService } from './photo-gallery.service.js';
import type { Photo } from './photo.schema.js';

const { Binary } = mongo;

function query<T>(value: T) {
  const q = {
    select: vi.fn(() => q),
    lean: vi.fn(() => q),
    exec: vi.fn().mockResolvedValue(value),
  };
  return q;
}

const jpeg = (width = 300, height = 200, background = '#c84') =>
  sharp({ create: { width, height, channels: 3, background } })
    .jpeg()
    .toBuffer();

function setup() {
  const photos = {
    insertMany: vi.fn().mockResolvedValue([]),
    deleteMany: vi.fn().mockReturnValue(query({ deletedCount: 1 })),
    findOne: vi.fn().mockReturnValue(query(null)),
  };
  const service = new PhotoGalleryService(photos as unknown as Model<Photo>);
  return { service, photos };
}

const PRODUTO = PhotoOwnerType.PRODUTO;

describe('PhotoGalleryService — galeria de fotos', () => {
  const ownerId = new Types.ObjectId();

  describe('prepare', () => {
    it('processa as fotos na ordem, em WebP', async () => {
      const { service } = setup();
      const result = await service.prepare(PRODUTO, [
        { buffer: await jpeg(300, 200) },
        { buffer: await jpeg(200, 300, '#38c') },
      ]);
      expect(result.map((p) => [p.tipo, p.largura, p.altura])).toEqual([
        ['image/webp', 300, 200],
        ['image/webp', 200, 300],
      ]);
    });

    it('recusa envio sem fotos (ou só com arquivos vazios)', async () => {
      const { service } = setup();
      await expect(service.prepare(PRODUTO, undefined)).rejects.toThrow(
        BadRequestException,
      );
      await expect(
        service.prepare(PRODUTO, [{ buffer: Buffer.alloc(0) }]),
      ).rejects.toMatchObject({
        response: {
          message: ['Adicione ao menos uma foto no campo "fotos"'],
        },
      });
    });

    it('usa o mínimo da política na mensagem quando é maior que 1', async () => {
      const policy = PHOTO_GALLERY_POLICIES[PRODUTO];
      const original = policy.min;
      policy.min = 2;
      try {
        const { service } = setup();
        await expect(
          service.prepare(PRODUTO, [{ buffer: await jpeg() }]),
        ).rejects.toMatchObject({
          response: { message: ['Adicione ao menos 2 fotos no campo "fotos"'] },
        });
      } finally {
        policy.min = original;
      }
    });

    it('recusa mais fotos que o máximo da política, sem processar', async () => {
      const { service } = setup();
      const files = Array.from({ length: 11 }, () => ({
        buffer: Buffer.from('x'),
      }));
      await expect(service.prepare(PRODUTO, files)).rejects.toMatchObject({
        response: {
          message: ['Envie no máximo 10 fotos, todas no campo "fotos"'],
        },
      });
    });

    it('415 para arquivo que não é imagem', async () => {
      const { service } = setup();
      await expect(
        service.prepare(PRODUTO, [{ buffer: Buffer.from('<svg/>') }]),
      ).rejects.toThrow(UnsupportedMediaTypeException);
    });

    it('400 para imagem pequena demais', async () => {
      const { service } = setup();
      await expect(
        service.prepare(PRODUTO, [{ buffer: await jpeg(10, 10) }]),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('store', () => {
    it('grava a galeria com dono e ordem e devolve as referências', async () => {
      const { service, photos } = setup();
      const processed = await service.prepare(PRODUTO, [
        { buffer: await jpeg() },
        { buffer: await jpeg(320, 240, '#38c') },
      ]);

      const refs = await service.store(
        { tipo: PRODUTO, id: ownerId.toHexString() },
        processed,
      );

      const [docs] = photos.insertMany.mock.calls[0];
      expect(docs).toHaveLength(2);
      expect(docs.map((d: { ordem: number }) => d.ordem)).toEqual([0, 1]);
      expect(docs[0].dono.tipo).toBe(PRODUTO);
      expect(docs[0].dono.id.toString()).toBe(ownerId.toHexString());
      expect(refs.map((r) => r.id.toString())).toEqual(
        docs.map((d: { _id: Types.ObjectId }) => d._id.toString()),
      );
      expect(refs[0].versao).toBe(processed[0].versao);
    });

    it('não chama o banco para galeria vazia', async () => {
      const { service, photos } = setup();
      expect(await service.store({ tipo: PRODUTO, id: ownerId }, [])).toEqual(
        [],
      );
      expect(photos.insertMany).not.toHaveBeenCalled();
    });
  });

  it('removeAll apaga só a galeria do dono', async () => {
    const { service, photos } = setup();
    await service.removeAll({ tipo: PRODUTO, id: ownerId.toHexString() });
    const [filter] = photos.deleteMany.mock.calls[0];
    expect(filter['dono.tipo']).toBe(PRODUTO);
    expect(filter['dono.id'].toString()).toBe(ownerId.toHexString());
  });

  describe('find', () => {
    const photoId = new Types.ObjectId().toHexString();

    it('404 para id inválido, sem consultar o banco', async () => {
      const { service, photos } = setup();
      await expect(
        service.find({ tipo: PRODUTO, id: ownerId }, 'nao-e-id'),
      ).rejects.toThrow(NotFoundException);
      expect(photos.findOne).not.toHaveBeenCalled();
    });

    it('404 quando a foto não pertence ao dono', async () => {
      const { service } = setup();
      await expect(
        service.find({ tipo: PRODUTO, id: ownerId }, photoId),
      ).rejects.toThrow(NotFoundException);
    });

    it('converte o Binary do driver em Buffer', async () => {
      const { service, photos } = setup();
      const bytes = Buffer.from([1, 2, 3]);
      photos.findOne.mockReturnValue(
        query({ dados: new Binary(bytes), tipo: 'image/webp', versao: 'v1' }),
      );
      const photo = await service.find({ tipo: PRODUTO, id: ownerId }, photoId);
      expect(Buffer.isBuffer(photo.dados)).toBe(true);
      expect([...photo.dados]).toEqual([1, 2, 3]);
      const [filter] = photos.findOne.mock.calls[0];
      expect(filter).toMatchObject({ _id: photoId, 'dono.tipo': PRODUTO });
    });

    it('mantém o Buffer quando já vem como Buffer', async () => {
      const { service, photos } = setup();
      const dados = Buffer.from([9]);
      photos.findOne.mockReturnValue(
        query({ dados, tipo: 'image/webp', versao: 'v1' }),
      );
      const photo = await service.find({ tipo: PRODUTO, id: ownerId }, photoId);
      expect(photo.dados).toBe(dados);
    });
  });
});
