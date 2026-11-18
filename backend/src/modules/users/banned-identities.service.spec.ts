import { BannedIdentitiesService } from './banned-identities.service.js';

function setup(found: unknown = null) {
  const model = {
    bulkWrite: vi.fn().mockResolvedValue({}),
    exists: vi.fn(() => ({ exec: vi.fn().mockResolvedValue(found) })),
  };
  const cipher = { blindIndex: vi.fn((value: string) => `idx:${value}`) };
  const service = new BannedIdentitiesService(model as never, cipher as never);
  return { service, model, cipher };
}

describe('BannedIdentitiesService (banimento impede novo cadastro)', () => {
  it('guarda só os hashes do CPF, do CNPJ e do e-mail normalizado, sem repetir', async () => {
    const { service, model } = setup();

    await service.ban({
      cpfHash: 'h-cpf',
      cnpjHash: 'h-cnpj',
      email: ' Pessoa@Exemplo.COM ',
    });

    const ops = model.bulkWrite.mock.calls[0][0] as Array<{
      updateOne: { filter: { hash: string }; upsert: boolean };
    }>;
    expect(ops.map((op) => op.updateOne.filter.hash)).toEqual([
      'h-cpf',
      'h-cnpj',
      'idx:email:pessoa@exemplo.com',
    ]);
    expect(ops.every((op) => op.updateOne.upsert)).toBe(true);
  });

  it('administrador (sem CPF nem CNPJ) é bloqueado pelo e-mail', async () => {
    const { service, model } = setup();

    await service.ban({ email: 'adm@exemplo.com' });

    expect(model.bulkWrite.mock.calls[0][0]).toHaveLength(1);
  });

  it('consulta qualquer um dos identificadores do novo cadastro', async () => {
    const { service, model } = setup({ _id: 'x' });

    await expect(
      service.isBanned({ cpfHash: 'h-cpf', email: 'Nova@Exemplo.com' }),
    ).resolves.toBe(true);

    expect(model.exists).toHaveBeenCalledWith({
      hash: { $in: ['h-cpf', 'idx:email:nova@exemplo.com'] },
    });
  });

  it('cadastro sem registro de banimento segue normalmente', async () => {
    const { service } = setup(null);
    await expect(
      service.isBanned({ email: 'livre@exemplo.com' }),
    ).resolves.toBe(false);
  });

  it('sem nenhum identificador não grava nem consulta nada', async () => {
    const { service, model } = setup({ _id: 'x' });

    await service.ban({});
    await expect(service.isBanned({})).resolves.toBe(false);

    expect(model.bulkWrite).not.toHaveBeenCalled();
    expect(model.exists).not.toHaveBeenCalled();
  });
});
