import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { VIDEO_URL_ERROR } from '../../../common/video/youtube.js';
import { CreateProductDto } from './create-product.dto.js';

const LINK = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

/** Campos de texto como chegam do multipart. */
const base = {
  nome: 'Queijo minas',
  categoria: 'Produtos',
  descricao: 'Queijo curado no sítio.',
  precoPorUnidade: '30',
  gramasPorUnidade: '500',
};

async function check(extra: Record<string, unknown>) {
  const dto = plainToInstance(CreateProductDto, { ...base, ...extra });
  const errors = await validate(dto, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  return {
    dto,
    messages: errors.flatMap((e) => Object.values(e.constraints ?? {})),
  };
}

describe('produto — link de vídeo do YouTube', () => {
  it('o vídeo é opcional', async () => {
    expect((await check({})).messages).toEqual([]);
  });

  it('aceita o link e tira os espaços em volta', async () => {
    const { dto, messages } = await check({ videoUrl: ` ${LINK} ` });

    expect(messages).toEqual([]);
    expect(dto.videoUrl).toBe(LINK);
  });

  it('campo em branco do formulário equivale a sem vídeo', async () => {
    const { dto, messages } = await check({ videoUrl: '' });

    expect(messages).toEqual([]);
    expect(dto.videoUrl).toBeUndefined();
  });

  it.each([
    ['de outro site', 'https://vimeo.com/123'],
    ['longo demais', `https://youtu.be/x${'a'.repeat(3000)}`],
  ])('recusa link %s', async (_caso, videoUrl) => {
    expect((await check({ videoUrl })).messages).toEqual([VIDEO_URL_ERROR]);
  });
});
