import { VIDEO_URL_ERROR, extractYoutubeId } from './youtube.js';

const ID = 'dQw4w9WgXcQ';

describe('vídeo do YouTube — extractYoutubeId', () => {
  it.each([
    `https://www.youtube.com/watch?v=${ID}`,
    `https://youtube.com/watch?v=${ID}&t=42s`,
    `https://m.youtube.com/watch?v=${ID}`,
    `https://youtu.be/${ID}`,
    `https://youtu.be/${ID}?si=abc`,
    `https://www.youtube.com/shorts/${ID}`,
    `https://www.youtube.com/embed/${ID}`,
    `https://www.youtube-nocookie.com/embed/${ID}`,
    `  https://youtu.be/${ID}  `,
    `http://www.youtube.com/watch?v=${ID}`,
    `HTTPS://WWW.YOUTUBE.COM/watch?v=${ID}`,
  ])('aceita %s', (url) => {
    expect(extractYoutubeId(url)).toBe(ID);
  });

  it.each([
    '',
    '   ',
    'não é um link',
    ID,
    `https://vimeo.com/${ID}`,
    `https://youtube.com.evil.com/watch?v=${ID}`,
    `https://evil.com/youtu.be/${ID}`,
    `javascript:alert(1)//youtube.com/watch?v=${ID}`,
    `ftp://youtube.com/watch?v=${ID}`,
    `https://youtube-nocookie.com/watch?v=${ID}`,
    'https://www.youtube.com/watch?v=curto',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ<script>',
    'https://youtu.be/',
    'https://www.youtube.com/',
    `<iframe src="https://www.youtube.com/embed/${ID}"></iframe>`,
  ])('recusa %j', (url) => {
    expect(extractYoutubeId(url)).toBeNull();
  });

  it.each([undefined, null, 42, {}, ['https://youtu.be/' + ID]])(
    'valor que não é texto (%j) não tem vídeo',
    (value) => {
      expect(extractYoutubeId(value)).toBeNull();
    },
  );

  it('recusa link longo demais antes de analisar', () => {
    expect(
      extractYoutubeId(`https://youtu.be/${ID}?x=${'a'.repeat(3000)}`),
    ).toBeNull();
  });
});

describe('vídeo do YouTube — mensagem de erro', () => {
  it('orienta em português, igual ao formulário do app', () => {
    expect(VIDEO_URL_ERROR).toBe(
      'Cole um link de vídeo do YouTube, como https://www.youtube.com/watch?v=…',
    );
  });
});
