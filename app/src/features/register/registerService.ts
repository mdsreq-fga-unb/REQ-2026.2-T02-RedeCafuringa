import type { RegisterPayload } from './registerForm';
import { isMockAuthEnabled } from '@/features/auth/authService';
import { ApiHttpError, getApiClient } from '@/shared/api';
import { toCreateProducerBody } from './registerApi';

export type RegisterResult =
  | { ok: true }
  | { ok: false; reason: 'duplicate'; field?: 'document' | 'email' }
  | { ok: false; reason: 'invalid'; messages: string[] }
  | { ok: false; reason: 'rate_limit'; retryAfterSeconds?: number }
  | { ok: false; reason: 'error' };

const mockService = createMockRegisterService();

// POST /users/producers (corpo montado em registerApi.ts)  ->  201
//   400 dados inválidos | 409 CPF/CNPJ ou e-mail já cadastrado | 429 muitas tentativas
export async function registerProducer(payload: RegisterPayload): Promise<RegisterResult> {
  if (isMockAuthEnabled) return mockService.register(payload);

  try {
    await getApiClient().post<unknown>('/users/producers', toCreateProducerBody(payload), {
      auth: false,
    });
    return { ok: true };
  } catch (error) {
    if (error instanceof ApiHttpError) {
      if (error.status === 409) return { ok: false, reason: 'duplicate' };
      if (error.status === 400) {
        const messages = error.details.length > 0 ? error.details : [error.message];
        return { ok: false, reason: 'invalid', messages };
      }
      if (error.status === 429) {
        return { ok: false, reason: 'rate_limit', retryAfterSeconds: error.retryAfterSeconds };
      }
    }
    return { ok: false, reason: 'error' };
  }
}

export function createMockRegisterService() {
  const accounts: RegisterPayload[] = [];

  return {
    async register(payload: RegisterPayload): Promise<RegisterResult> {
      if (accounts.some((account) => account.document === payload.document)) {
        return { ok: false, reason: 'duplicate', field: 'document' };
      }
      if (accounts.some((account) => account.email === payload.email)) {
        return { ok: false, reason: 'duplicate', field: 'email' };
      }
      accounts.push(payload);
      return { ok: true };
    },
  };
}