import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { VIDEO_URL_ERROR } from '../../../common/video/youtube.js';
import { CreateExperienceDto } from './create-experience.dto.js';

const LINK = 'https://youtu.be/dQw4w9WgXcQ';

/** Campos de texto como chegam do multipart. */
const base = {
  nome: 'Trilha guiada da nascente',
  categoria: 'Experiência',
  descricao: 'Caminhada de 3 km até a nascente.',
  valorPorPessoa: '45',
  local: 'Sítio Boa Vista',
  duracao: '2 horas',
};

async function check(extra: Record<string, unknown>) {
  const dto = plainToInstance(CreateExperienceDto, { ...base, ...extra });
  const errors = await validate(dto, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  return {
    dto,
    messages: errors.flatMap((e) => Object.values(e.constraints ?? {})),
  };
}

describe('experiência — link de vídeo do YouTube', () => {
  it('o vídeo é opcional', async () => {
    expect((await check({})).messages).toEqual([]);
  });

  it('aceita o link', async () => {
    const { dto, messages } = await check({ videoUrl: LINK });

    expect(messages).toEqual([]);
    expect(dto.videoUrl).toBe(LINK);
  });

  it('campo em branco do formulário equivale a sem vídeo', async () => {
    const { dto, messages } = await check({ videoUrl: '  ' });

    expect(messages).toEqual([]);
    expect(dto.videoUrl).toBeUndefined();
  });

  it('recusa link que não é do YouTube', async () => {
    expect(
      (await check({ videoUrl: 'https://vimeo.com/123' })).messages,
    ).toEqual([VIDEO_URL_ERROR]);
  });
});
