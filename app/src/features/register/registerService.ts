import type { RegisterPayload } from './registerForm';

export type RegisterResult =
  | { ok: true }
  | { ok: false; reason: 'duplicate'; field: 'document' | 'email' };

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