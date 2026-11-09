import { parseRetryDelays, sendWithRetry } from './send-with-retry.js';

const message = { to: 'a@b.co', subject: 's', text: 't' };

describe('HU10 — reenvio de e-mail com espera crescente', () => {
  const sleep = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => sleep.mockClear());

  it('primeira tentativa bem-sucedida: não espera nem repete', async () => {
    const send = vi.fn().mockResolvedValue(undefined);

    const result = await sendWithRetry(send, message, [1000, 5000], sleep);

    expect(result).toEqual({ delivered: true, attempts: 1 });
    expect(send).toHaveBeenCalledOnce();
    expect(sleep).not.toHaveBeenCalled();
  });

  it('falha passageira: repete após a espera e entrega', async () => {
    const send = vi
      .fn()
      .mockRejectedValueOnce(new Error('SMTP fora'))
      .mockResolvedValueOnce(undefined);

    const result = await sendWithRetry(send, message, [1000, 5000], sleep);

    expect(result).toEqual({ delivered: true, attempts: 2 });
    expect(sleep).toHaveBeenCalledExactlyOnceWith(1000);
  });

  it('falha persistente: tenta 1 + N vezes e desiste sem lançar', async () => {
    const send = vi.fn().mockRejectedValue(new TypeError('SMTP fora'));

    const result = await sendWithRetry(send, message, [1000, 5000], sleep);

    expect(result).toEqual({
      delivered: false,
      attempts: 3,
      errorName: 'TypeError',
    });
    expect(send).toHaveBeenCalledTimes(3);
    expect(sleep.mock.calls).toEqual([[1000], [5000]]);
  });

  it('sem esperas configuradas: uma única tentativa', async () => {
    const send = vi.fn().mockRejectedValue(new Error('x'));

    const result = await sendWithRetry(send, message, [], sleep);

    expect(result.attempts).toBe(1);
    expect(result.delivered).toBe(false);
  });

  it('erro que não é Error vira nome genérico', async () => {
    const send = vi.fn().mockRejectedValue('texto');

    const result = await sendWithRetry(send, message, [], sleep);

    expect(result.errorName).toBe('Erro');
  });

  describe('parseRetryDelays', () => {
    it.each([
      ['2000,10000', [2000, 10000]],
      [' 500 , 1000 ', [500, 1000]],
      ['0', [0]],
      ['', []],
      [undefined, []],
    ])('"%s" vira %j', (raw, expected) => {
      expect(parseRetryDelays(raw)).toEqual(expected);
    });
  });
});
