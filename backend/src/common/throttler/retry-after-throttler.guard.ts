import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { ThrottlerLimitDetail } from '@nestjs/throttler/dist/throttler.guard.interface.js';

interface ResponseWithHeader {
  header(name: string, value: string): unknown;
}

/**
 * O limitador nomeado "auth" do throttler envia o tempo de espera em
 * `Retry-After-auth`, que nenhum cliente HTTP entende. O contrato OpenAPI e o
 * front leem o cabeçalho padrão `Retry-After` (segundos); este guard o
 * acrescenta, sem remover o original.
 */
@Injectable()
export class RetryAfterThrottlerGuard extends ThrottlerGuard {
  protected override async throwThrottlingException(
    context: ExecutionContext,
    detail: ThrottlerLimitDetail,
  ): Promise<void> {
    const res = context.switchToHttp().getResponse<ResponseWithHeader>();
    res.header('Retry-After', String(Math.max(1, detail.timeToBlockExpire)));
    return super.throwThrottlingException(context, detail);
  }
}
