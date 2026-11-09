import { BadRequestException, Logger } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { Types } from 'mongoose';
import type { Model } from 'mongoose';
import type { MailService } from '../../../common/mail/mail.service.js';
import type { MetricsRegistry } from '../../metrics/metrics.registry.js';
import type { UserDocument } from '../../users/schemas/user.schema.js';
import type { UsersService } from '../../users/users.service.js';
import { generateResetToken, hashResetToken } from './domain/reset-token.js';
import { PasswordResetService } from './password-reset.service.js';
import type { PasswordResetToken } from './schemas/password-reset-token.schema.js';

const NOW = new Date('2026-11-06T12:00:00.000Z');
const INVALID_LINK =
  'Link de recuperação inválido ou expirado. Solicite uma nova recuperação de acesso.';

function query<T>(value: T) {
  return { exec: vi.fn().mockResolvedValue(value) };
}

function makeUser(overrides: Partial<UserDocument> = {}): UserDocument {
  return {
    _id: new Types.ObjectId(),
    email: 'maria@exemplo.com',
    ativo: true,
    ...overrides,
  } as unknown as UserDocument;
}

function setup(config: Record<string, unknown> = {}) {
  const tokens = {
    findOne: vi.fn().mockReturnValue(query(null)),
    deleteMany: vi.fn().mockReturnValue(query({ deletedCount: 0 })),
    deleteOne: vi.fn().mockReturnValue(query({ deletedCount: 1 })),
    findOneAndUpdate: vi.fn().mockReturnValue(query(null)),
    updateOne: vi.fn().mockReturnValue(query({ modifiedCount: 1 })),
    syncIndexes: vi.fn().mockResolvedValue([]),
  };

  const users = {
    findByEmail: vi.fn().mockResolvedValue(null),
    findSessionState: vi.fn().mockResolvedValue(null),
    setPassword: vi.fn().mockResolvedValue(undefined),
  };
  const mail = { send: vi.fn().mockResolvedValue(undefined) };
  const metrics = { recordMailFailure: vi.fn() };
  const settings: Record<string, unknown> = {
    APP_PUBLIC_URL: 'https://app.cafuringa.example',
    PASSWORD_RESET_TTL_MINUTES: 30,
    PASSWORD_RESET_COOLDOWN_SECONDS: 60,
    MAIL_RETRY_DELAYS_MS: '',
    ...config,
  };
  const configService = {
    get: vi.fn((key: string, fallback?: unknown) => settings[key] ?? fallback),
    getOrThrow: vi.fn((key: string) => settings[key]),
  };

  const service = new PasswordResetService(
    tokens as unknown as Model<PasswordResetToken>,
    users as unknown as UsersService,
    mail as unknown as MailService,
    configService as unknown as ConfigService,
    metrics as unknown as MetricsRegistry,
  );

  return { service, tokens, users, mail, metrics };
}

/** Upsert do pedido: o primeiro argumento de `tokens.updateOne` com `upsert`. */
function upsertCall(tokens: ReturnType<typeof setup>['tokens']) {
  const call = tokens.updateOne.mock.calls.find(
    (args) => (args[2] as { upsert?: boolean } | undefined)?.upsert,
  );
  expect(call).toBeDefined();
  return call as [
    Record<string, unknown>,
    { $set: Record<string, unknown>; $unset: Record<string, unknown> },
    { upsert: boolean },
  ];
}

function duplicateKey() {
  return Object.assign(new Error('E11000 duplicate key'), { code: 11000 });
}

describe('PasswordResetService', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('request (RNF11: tempo de resposta não revela a conta)', () => {
    it('devolve na hora, sem esperar o banco nem o e-mail', () => {
      const { service, users } = setup();
      // Uma busca que nunca termina: se request a aguardasse, o teste travaria.
      users.findByEmail.mockReturnValue(new Promise(() => undefined));

      expect(service.request('maria@exemplo.com')).toBeUndefined();
      expect(users.findByEmail).toHaveBeenCalledWith('maria@exemplo.com');
    });

    it('erro inesperado no processamento vira só um aviso no log, sem e-mail', async () => {
      const { service, users } = setup();
      users.findByEmail.mockRejectedValue(new Error('db fora'));
      const warn = vi
        .spyOn(Logger.prototype, 'warn')
        .mockImplementation(() => undefined);

      service.request('maria@exemplo.com');
      await vi.waitFor(() => expect(warn).toHaveBeenCalledOnce());

      expect(JSON.stringify(warn.mock.calls)).not.toContain(
        'maria@exemplo.com',
      );
    });
  });

  describe('processRequest (HU10 CA02/CA03)', () => {
    it('e-mail sem conta: não cria token nem envia e-mail', async () => {
      const { service, tokens, mail } = setup();

      await service.processRequest('ninguem@exemplo.com');

      expect(tokens.updateOne).not.toHaveBeenCalled();
      expect(mail.send).not.toHaveBeenCalled();
    });

    it('conta desativada: não cria token nem envia e-mail', async () => {
      const { service, users, tokens, mail } = setup();
      users.findByEmail.mockResolvedValue(makeUser({ ativo: false }));

      await service.processRequest('maria@exemplo.com');

      expect(tokens.updateOne).not.toHaveBeenCalled();
      expect(mail.send).not.toHaveBeenCalled();
    });

    it('conta ativa: grava só o hash do token, com validade de 30 min', async () => {
      const { service, users, tokens, mail } = setup();
      const user = makeUser();
      users.findByEmail.mockResolvedValue(user);

      await service.processRequest('maria@exemplo.com');

      const [, update] = upsertCall(tokens);
      expect(update.$set.tokenHash).toMatch(/^[0-9a-f]{64}$/);
      expect(update.$set.expiresAt).toEqual(
        new Date('2026-11-06T12:30:00.000Z'),
      );
      expect(update.$set.createdAt).toEqual(NOW);

      // O e-mail leva o token em claro; o banco, só o hash dele.
      const sent = mail.send.mock.calls[0][0] as { to: string; text: string };
      const token = /token=([A-Za-z0-9_-]{43})/.exec(sent.text)?.[1];
      expect(token).toBeDefined();
      expect(hashResetToken(token as string)).toBe(update.$set.tokenHash);
      expect(JSON.stringify(update)).not.toContain(token as string);
    });

    it('um pedido por conta, substituído de forma atômica: só o último link vale', async () => {
      const { service, users, tokens } = setup();
      const user = makeUser();
      users.findByEmail.mockResolvedValue(user);

      await service.processRequest('maria@exemplo.com');

      const [filter, update, options] = upsertCall(tokens);
      // Só casa (e substitui) um pedido anterior criado antes do intervalo mínimo.
      expect(filter).toEqual({
        userId: user._id,
        createdAt: { $lte: new Date('2026-11-06T11:59:00.000Z') },
      });
      expect(options).toEqual({ upsert: true });
      // Um link já usado volta a ser um pedido novo, não usado.
      expect(update.$unset).toEqual({ usedAt: 1 });
    });

    it('pedido recente (ou concorrente) da mesma conta: o índice único barra e nada é enviado', async () => {
      const { service, users, tokens, mail } = setup();
      users.findByEmail.mockResolvedValue(makeUser());
      tokens.updateOne.mockReturnValue({
        exec: vi.fn().mockRejectedValue(duplicateKey()),
      });

      await expect(
        service.processRequest('maria@exemplo.com'),
      ).resolves.toBeUndefined();

      expect(mail.send).not.toHaveBeenCalled();
    });

    it('outra falha do banco é propagada (vira aviso em request)', async () => {
      const { service, users, tokens } = setup();
      users.findByEmail.mockResolvedValue(makeUser());
      tokens.updateOne.mockReturnValue({
        exec: vi.fn().mockRejectedValue(new Error('db fora')),
      });

      await expect(service.processRequest('maria@exemplo.com')).rejects.toThrow(
        'db fora',
      );
    });

    it('envia ao e-mail cadastrado, com o token no fragmento do link (rota por hash do app)', async () => {
      const { service, users, mail } = setup();
      users.findByEmail.mockResolvedValue(makeUser());

      await service.processRequest('maria@exemplo.com');

      const sent = mail.send.mock.calls[0][0] as { to: string; text: string };
      expect(sent.to).toBe('maria@exemplo.com');
      expect(sent.text).toContain(
        'https://app.cafuringa.example/#/nova-senha?token=',
      );
      expect(sent.text).toContain('30 minutos');
    });

    it('falha passageira do SMTP: reenvia com espera e entrega', async () => {
      const { service, users, mail, metrics } = setup({
        MAIL_RETRY_DELAYS_MS: '0,0',
      });
      users.findByEmail.mockResolvedValue(makeUser());
      mail.send
        .mockRejectedValueOnce(new Error('SMTP fora'))
        .mockResolvedValueOnce(undefined);

      await service.processRequest('maria@exemplo.com');

      expect(mail.send).toHaveBeenCalledTimes(2);
      expect(metrics.recordMailFailure).not.toHaveBeenCalled();
    });

    it('falha persistente: desiste, registra a métrica e avisa no log sem e-mail nem token (RNF11)', async () => {
      const { service, users, mail, metrics } = setup({
        MAIL_RETRY_DELAYS_MS: '0,0',
      });
      users.findByEmail.mockResolvedValue(makeUser());
      mail.send.mockRejectedValue(new Error('SMTP fora'));
      const warn = vi
        .spyOn(Logger.prototype, 'warn')
        .mockImplementation(() => undefined);

      await expect(
        service.processRequest('maria@exemplo.com'),
      ).resolves.toBeUndefined();

      expect(mail.send).toHaveBeenCalledTimes(3);
      expect(metrics.recordMailFailure).toHaveBeenCalledExactlyOnceWith(
        'password_reset',
      );
      expect(warn).toHaveBeenCalledOnce();
      const logged = JSON.stringify(warn.mock.calls);
      expect(logged).not.toContain('maria@exemplo.com');
      expect(logged).not.toMatch(/[A-Za-z0-9_-]{43}/);
    });

    it('e-mail perdido não deixa a conta presa no intervalo: o pedido é desfeito', async () => {
      const { service, users, mail, tokens } = setup();
      const user = makeUser();
      users.findByEmail.mockResolvedValue(user);
      mail.send.mockRejectedValue(new Error('SMTP fora'));
      vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);

      await service.processRequest('maria@exemplo.com');

      const [, update] = upsertCall(tokens);
      expect(tokens.deleteMany).toHaveBeenCalledWith({
        userId: user._id,
        tokenHash: update.$set.tokenHash,
      });
    });
  });

  describe('validate (HU10 CA04)', () => {
    it.each([
      ['vazio', ''],
      ['curto', 'abc'],
      ['objeto de operador', { $ne: null }],
      ['número', 123],
    ])('token %s: recusa sem consultar o banco', async (_nome, token) => {
      const { service, tokens } = setup();

      await expect(service.validate(token as string)).rejects.toThrow(
        new BadRequestException(INVALID_LINK),
      );
      expect(tokens.findOne).not.toHaveBeenCalled();
    });

    it('token desconhecido, usado ou expirado: recusa com a mensagem orientativa', async () => {
      const { service } = setup();

      await expect(service.validate(generateResetToken())).rejects.toThrow(
        INVALID_LINK,
      );
    });

    it('consulta pelo hash, apenas tokens não usados e não expirados', async () => {
      const { service, tokens, users } = setup();
      const token = generateResetToken();
      const user = makeUser();
      tokens.findOne.mockReturnValue(query({ userId: user._id }));
      users.findSessionState.mockResolvedValue(user);

      await service.validate(token);

      expect(tokens.findOne).toHaveBeenCalledWith({
        tokenHash: hashResetToken(token),
        usedAt: null,
        expiresAt: { $gt: NOW },
      });
    });

    it('token válido de conta ativa: aceita', async () => {
      const { service, tokens, users } = setup();
      const user = makeUser();
      tokens.findOne.mockReturnValue(query({ userId: user._id }));
      users.findSessionState.mockResolvedValue(user);

      await expect(
        service.validate(generateResetToken()),
      ).resolves.toBeUndefined();
    });

    it('token válido de conta que foi desativada: recusa', async () => {
      const { service, tokens, users } = setup();
      const user = makeUser({ ativo: false });
      tokens.findOne.mockReturnValue(query({ userId: user._id }));
      users.findSessionState.mockResolvedValue(user);

      await expect(service.validate(generateResetToken())).rejects.toThrow(
        INVALID_LINK,
      );
    });
  });

  describe('confirm (HU10 CA05/CA06)', () => {
    it('token com formato inválido: recusa sem tocar no banco nem na senha', async () => {
      const { service, tokens, users } = setup();

      await expect(service.confirm('lixo', 'NovaSenha123')).rejects.toThrow(
        INVALID_LINK,
      );
      expect(tokens.findOneAndUpdate).not.toHaveBeenCalled();
      expect(users.setPassword).not.toHaveBeenCalled();
    });

    it('token inexistente, usado ou expirado: recusa e não altera a senha', async () => {
      const { service, users } = setup();

      await expect(
        service.confirm(generateResetToken(), 'NovaSenha123'),
      ).rejects.toThrow(INVALID_LINK);
      expect(users.setPassword).not.toHaveBeenCalled();
    });

    it('consome o token de forma atômica, só se ainda for válido', async () => {
      const { service, tokens } = setup();
      const token = generateResetToken();

      await service.confirm(token, 'NovaSenha123').catch(() => undefined);

      expect(tokens.findOneAndUpdate).toHaveBeenCalledWith(
        {
          tokenHash: hashResetToken(token),
          usedAt: null,
          expiresAt: { $gt: NOW },
        },
        { $set: { usedAt: NOW } },
      );
    });

    it('sucesso: troca a senha da conta dona do token e apaga só o pedido consumido', async () => {
      const { service, tokens, users } = setup();
      const user = makeUser();
      const record = {
        _id: new Types.ObjectId(),
        userId: user._id,
        tokenHash: 'h'.repeat(64),
      };
      tokens.findOneAndUpdate.mockReturnValue(query(record));
      users.findSessionState.mockResolvedValue(user);

      await service.confirm(generateResetToken(), 'NovaSenha123');

      expect(users.findSessionState).toHaveBeenCalledWith(String(user._id));
      expect(users.setPassword).toHaveBeenCalledExactlyOnceWith(
        user._id,
        'NovaSenha123',
      );
      // Por _id + hash: um pedido novo, feito ao mesmo tempo, sobrevive.
      expect(tokens.deleteOne).toHaveBeenCalledWith({
        _id: record._id,
        tokenHash: record.tokenHash,
      });
      expect(tokens.deleteMany).not.toHaveBeenCalled();
    });

    it('conta desativada depois do pedido: recusa e não troca a senha', async () => {
      const { service, tokens, users } = setup();
      const user = makeUser({ ativo: false });
      tokens.findOneAndUpdate.mockReturnValue(
        query({ _id: new Types.ObjectId(), userId: user._id }),
      );
      users.findSessionState.mockResolvedValue(user);

      await expect(
        service.confirm(generateResetToken(), 'NovaSenha123'),
      ).rejects.toThrow(INVALID_LINK);
      expect(users.setPassword).not.toHaveBeenCalled();
    });

    it('conta removida: recusa e não troca a senha', async () => {
      const { service, tokens, users } = setup();
      tokens.findOneAndUpdate.mockReturnValue(
        query({ _id: new Types.ObjectId(), userId: new Types.ObjectId() }),
      );
      users.findSessionState.mockResolvedValue(null);

      await expect(
        service.confirm(generateResetToken(), 'NovaSenha123'),
      ).rejects.toThrow(INVALID_LINK);
      expect(users.setPassword).not.toHaveBeenCalled();
    });

    it('falha ao gravar a senha: devolve o token ao estado de não usado e propaga o erro', async () => {
      const { service, tokens, users } = setup();
      const user = makeUser();
      const record = { _id: new Types.ObjectId(), userId: user._id };
      tokens.findOneAndUpdate.mockReturnValue(query(record));
      users.findSessionState.mockResolvedValue(user);
      users.setPassword.mockRejectedValue(new Error('db fora'));

      await expect(
        service.confirm(generateResetToken(), 'NovaSenha123'),
      ).rejects.toThrow('db fora');

      expect(tokens.updateOne).toHaveBeenCalledWith(
        { _id: record._id },
        { $unset: { usedAt: 1 } },
      );
      expect(tokens.deleteOne).not.toHaveBeenCalled();
    });
  });

  describe('ciclo de vida', () => {
    it('na subida, garante os índices da coleção (único por conta, único do hash e TTL)', async () => {
      const { service, tokens } = setup();

      await service.onModuleInit();

      expect(tokens.syncIndexes).toHaveBeenCalledOnce();
    });

    it('no desligamento, espera os pedidos em andamento antes de o banco fechar', async () => {
      const { service, users } = setup();
      let finish: (value: null) => void = () => undefined;
      users.findByEmail.mockReturnValue(
        new Promise<null>((resolve) => (finish = resolve)),
      );
      service.request('maria@exemplo.com');

      let drained = false;
      const shutdown = service
        .beforeApplicationShutdown()
        .then(() => (drained = true));
      await new Promise((resolve) => setImmediate(resolve));
      expect(drained).toBe(false);

      finish(null);
      await shutdown;
      expect(drained).toBe(true);
    });

    it('desligamento sem pedidos pendentes termina na hora', async () => {
      const { service } = setup();

      await expect(
        service.beforeApplicationShutdown(),
      ).resolves.toBeUndefined();
    });
  });
});
