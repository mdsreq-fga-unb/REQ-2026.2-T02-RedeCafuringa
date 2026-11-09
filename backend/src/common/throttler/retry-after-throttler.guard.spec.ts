import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ThrottlerException } from '@nestjs/throttler';
import { RetryAfterThrottlerGuard } from './retry-after-throttler.guard.js';

// O método é protected no guard base; o teste o chama como o throttler faz ao bloquear.
interface Blocking {
  throwThrottlingException(
    context: ExecutionContext,
    detail: { timeToBlockExpire: number },
  ): Promise<void>;
}

async function trip(timeToBlockExpire: number) {
  const guard = new RetryAfterThrottlerGuard(
    { throttlers: [{ ttl: 60_000, limit: 5 }] },
    { increment: vi.fn() },
    new Reflector(),
  );
  await guard.onModuleInit();

  const header = vi.fn();
  const context = {
    switchToHttp: () => ({ getResponse: () => ({ header }) }),
  } as unknown as ExecutionContext;

  const error = await (guard as unknown as Blocking)
    .throwThrottlingException(context, { timeToBlockExpire })
    .then(
      () => undefined,
      (caught: unknown) => caught,
    );
  return { header, error };
}

describe('RetryAfterThrottlerGuard', () => {
  it('envia o tempo de espera no cabeçalho padrão Retry-After e recusa com 429', async () => {
    const { header, error } = await trip(42);

    expect(header).toHaveBeenCalledWith('Retry-After', '42');
    expect(error).toBeInstanceOf(ThrottlerException);
  });

  it('nunca informa espera menor que 1 segundo', async () => {
    const { header } = await trip(0);

    expect(header).toHaveBeenCalledWith('Retry-After', '1');
  });
});
