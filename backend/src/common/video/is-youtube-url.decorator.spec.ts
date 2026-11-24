import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { IsYoutubeUrl, NormalizeVideoUrl } from './is-youtube-url.decorator.js';
import { VIDEO_URL_ERROR } from './youtube.js';

const LINK = 'https://youtu.be/dQw4w9WgXcQ';

class Payload {
  @NormalizeVideoUrl()
  @IsYoutubeUrl()
  videoUrl: unknown;
}

const toPayload = (videoUrl: unknown) => plainToInstance(Payload, { videoUrl });

describe('@IsYoutubeUrl', () => {
  it('aceita link de vídeo do YouTube', async () => {
    expect(await validate(toPayload(LINK))).toHaveLength(0);
  });

  it.each([
    'https://vimeo.com/123',
    'não é link',
    `<iframe src="${LINK}"></iframe>`,
    42,
  ])('recusa %j com a orientação em português', async (videoUrl) => {
    const [error] = await validate(toPayload(videoUrl));

    expect(error.constraints).toEqual({ isYoutubeUrl: VIDEO_URL_ERROR });
  });
});

describe('@NormalizeVideoUrl', () => {
  it('tira os espaços em volta do link', () => {
    expect(toPayload(`  ${LINK}  `).videoUrl).toBe(LINK);
  });

  it.each(['', '   '])(
    'campo em branco (%j) equivale a não informar',
    (videoUrl) => {
      expect(toPayload(videoUrl).videoUrl).toBeUndefined();
    },
  );

  it.each([null, 42])('não mexe em valor que não é texto (%j)', (videoUrl) => {
    expect(toPayload(videoUrl).videoUrl).toBe(videoUrl);
  });
});
