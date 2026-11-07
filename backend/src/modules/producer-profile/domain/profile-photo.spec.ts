import { crc32 } from 'node:zlib';
import sharp from 'sharp';
import {
  InvalidPhotoError,
  PHOTO_MAX_DIMENSION,
  PHOTO_MAX_INPUT_PIXELS,
  PHOTO_MIN_DIMENSION,
  photoPath,
  processProfilePhoto,
} from './profile-photo.js';

/** Imagem sólida gerada em memória, no formato pedido. */
function image(
  width: number,
  height: number,
  format: 'jpeg' | 'png' | 'webp' | 'gif' | 'tiff' = 'jpeg',
) {
  return sharp({
    create: { width, height, channels: 3, background: '#c84' },
  })
    .toFormat(format)
    .toBuffer();
}

/** JPEG como sai de um celular: girado pelo EXIF e com GPS da propriedade. */
function phonePhoto(width: number, height: number) {
  return sharp({
    create: { width, height, channels: 3, background: '#3a6' },
  })
    .jpeg()
    .withMetadata({ orientation: 6 })
    .withExif({
      IFD0: { Make: 'Celular', Model: 'Teste' },
      IFD3: {
        GPSLatitudeRef: 'S',
        GPSLatitude: '15/1 47/1 0/1',
        GPSLongitudeRef: 'W',
        GPSLongitude: '47/1 52/1 0/1',
      },
    })
    .toBuffer();
}

/** Reescreve largura e altura do cabeçalho IHDR de um PNG (com CRC válido). */
function withPngSize(png: Buffer, side: number): Buffer {
  const out = Buffer.from(png);
  // Assinatura (8) + tamanho do chunk (4): o chunk IHDR começa no byte 12.
  out.writeUInt32BE(side, 16);
  out.writeUInt32BE(side, 20);
  out.writeUInt32BE(crc32(out.subarray(12, 29)), 29);
  return out;
}

async function rejection(input: Buffer): Promise<InvalidPhotoError> {
  const error = await processProfilePhoto(input).catch((e: unknown) => e);
  expect(error).toBeInstanceOf(InvalidPhotoError);
  return error as InvalidPhotoError;
}

describe('HU12/RF12 — foto de perfil do produtor', () => {
  describe('formato aceito (pelos bytes, não pela extensão)', () => {
    it.each(['jpeg', 'png', 'webp'] as const)(
      'aceita %s e devolve sempre WebP',
      async (format) => {
        const photo = await processProfilePhoto(await image(300, 200, format));

        expect(photo.tipo).toBe('image/webp');
        const meta = await sharp(photo.dados).metadata();
        expect(meta.format).toBe('webp');
        expect(photo.bytes).toBe(photo.dados.length);
      },
    );

    it.each(['gif', 'tiff'] as const)('recusa %s', async (format) => {
      const error = await rejection(await image(300, 200, format));
      expect(error.motivo).toBe('formato');
    });

    it('recusa arquivo que não é imagem, mesmo que se diga JPEG', async () => {
      const error = await rejection(Buffer.from('<svg onload="alert(1)"/>'));
      expect(error.motivo).toBe('formato');
    });

    it('recusa imagem truncada (corrompida)', async () => {
      const full = await image(800, 600, 'jpeg');
      const error = await rejection(full.subarray(0, full.length / 3));
      expect(error.motivo).toBe('corrompida');
    });
  });

  describe('dimensões', () => {
    it('reduz fotos grandes para caber no limite, mantendo a proporção', async () => {
      const photo = await processProfilePhoto(await image(4000, 3000));

      expect(photo.largura).toBe(PHOTO_MAX_DIMENSION);
      expect(photo.altura).toBe(PHOTO_MAX_DIMENSION * 0.75);
    });

    it('não amplia fotos pequenas', async () => {
      const photo = await processProfilePhoto(await image(320, 240));

      expect([photo.largura, photo.altura]).toEqual([320, 240]);
    });

    it('recusa foto menor que o mínimo útil para um perfil', async () => {
      const error = await rejection(await image(PHOTO_MIN_DIMENSION - 1, 400));
      expect(error.motivo).toBe('dimensao');
    });

    it('recusa imagem acima do limite de pixels (bomba de descompressão)', async () => {
      // Um arquivo de poucos bytes que declara dimensões gigantes: sem o
      // limite, decodificá-lo alocaria gigabytes de memória.
      const side = Math.ceil(Math.sqrt(PHOTO_MAX_INPUT_PIXELS)) + 1;
      const error = await rejection(
        withPngSize(await image(1, 1, 'png'), side),
      );
      expect(error.motivo).toBe('dimensao');
    });
  });

  describe('privacidade (RNF11/LGPD)', () => {
    it('remove EXIF, inclusive a localização GPS, e aplica a rotação', async () => {
      const original = await phonePhoto(1200, 600);
      expect((await sharp(original).metadata()).exif).toBeDefined();

      const photo = await processProfilePhoto(original);
      const meta = await sharp(photo.dados).metadata();

      expect(meta.exif).toBeUndefined();
      expect(meta.xmp).toBeUndefined();
      expect(meta.orientation).toBeUndefined();
      // Orientação 6 = girar 90°: a foto deitada passa a ficar em pé.
      expect([photo.largura, photo.altura]).toEqual([480, PHOTO_MAX_DIMENSION]);
    });
  });

  describe('versão', () => {
    it('é estável para o mesmo conteúdo e muda quando a foto muda', async () => {
      const a = await processProfilePhoto(await image(300, 200));
      const again = await processProfilePhoto(await image(300, 200));
      const b = await processProfilePhoto(await image(300, 201));

      expect(a.versao).toMatch(/^[\w-]{16}$/);
      expect(again.versao).toBe(a.versao);
      expect(b.versao).not.toBe(a.versao);
    });
  });

  describe('photoPath', () => {
    it('monta o caminho relativo à API com a versão', () => {
      expect(photoPath('abc', 'v-1_x')).toBe('/producers/abc/photo?v=v-1_x');
    });
  });
});
