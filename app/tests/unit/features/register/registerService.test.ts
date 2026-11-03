import { describe, expect, it } from 'vitest';
import type { RegisterPayload } from '@/features/register/registerForm';
import { createMockRegisterService } from '@/features/register/registerService';

const payload: RegisterPayload = {
  name: 'Maria da Silva',
  document: '52998224725',
  phone: '61912345678',
  email: 'maria@exemplo.com',
  address: 'Chácara 12, Núcleo Rural, Brasília - DF',
  password: 'senha-segura-1',
  isAdult: true,
};

describe('createMockRegisterService', () => {
  it('cadastra uma conta nova com sucesso', async () => {
    const service = createMockRegisterService();
    expect(await service.register(payload)).toEqual({ ok: true });
  });

  it('rejeita CPF/CNPJ já cadastrado', async () => {
    const service = createMockRegisterService();
    await service.register(payload);

    const result = await service.register({ ...payload, email: 'outra@exemplo.com' });
    expect(result).toEqual({ ok: false, reason: 'duplicate', field: 'document' });
  });

  it('rejeita e-mail já cadastrado', async () => {
    const service = createMockRegisterService();
    await service.register(payload);

    const result = await service.register({ ...payload, document: '11222333000181' });
    expect(result).toEqual({ ok: false, reason: 'duplicate', field: 'email' });
  });

  it('aponta o documento quando documento e e-mail estão duplicados', async () => {
    const service = createMockRegisterService();
    await service.register(payload);

    const result = await service.register(payload);
    expect(result).toEqual({ ok: false, reason: 'duplicate', field: 'document' });
  });
});