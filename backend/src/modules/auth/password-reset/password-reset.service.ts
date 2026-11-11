import {
  BadRequestException,
  BeforeApplicationShutdown,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MailService } from '../../../common/mail/mail.service.js';
import {
  parseRetryDelays,
  sendWithRetry,
} from '../../../common/mail/send-with-retry.js';
import { MetricsRegistry } from '../../metrics/metrics.registry.js';
import { UsersService } from '../../users/users.service.js';
import { buildResetEmail } from './domain/reset-email.js';
import {
  buildResetLink,
  cooldownThreshold,
  generateResetToken,
  hashResetToken,
  isResetTokenFormat,
  resetTokenExpiry,
} from './domain/reset-token.js';
import { PasswordResetToken } from './schemas/password-reset-token.schema.js';

/** Mesma mensagem para token inexistente, usado, expirado ou de conta inativa (RNF03). */
const INVALID_LINK =
  'Link de recuperação inválido ou expirado. Solicite uma nova recuperação de acesso.';
const DUPLICATE_KEY = 11000;

const errorName = (error: unknown) =>
  error instanceof Error ? error.name : 'erro desconhecido';

@Injectable()
export class PasswordResetService
  implements OnModuleInit, BeforeApplicationShutdown
{
  private readonly logger = new Logger(PasswordResetService.name);
  /** Pedidos sendo processados depois da resposta (drenados no desligamento). */
  private readonly pending = new Set<Promise<void>>();

  constructor(
    @InjectModel(PasswordResetToken.name)
    private readonly tokens: Model<PasswordResetToken>,
    private readonly users: UsersService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
    private readonly metrics: MetricsRegistry,
  ) {}

  /**
   * CA02: aceita o pedido e devolve na hora. Todo o trabalho (busca da conta,
   * gravação do token, envio) roda depois, fora do caminho da resposta: o tempo
   * de resposta é o mesmo exista ou não a conta (RNF11, sem enumeração).
   */
  request(email: string): void {
    const task = this.processRequest(email)
      .catch((error: unknown) => {
        // Sem e-mail nem token no log (RNF11): só o tipo da falha.
        this.logger.warn(
          `Falha ao processar pedido de recuperação: ${errorName(error)}`,
        );
      })
      .finally(() => this.pending.delete(task));
    this.pending.add(task);
  }

  /**
   * As proteções do pedido (um por conta, intervalo mínimo) dependem do índice
   * único em `userId`. Em produção o Mongoose não cria índices no boot, então
   * esta coleção pequena os sincroniza na subida (idempotente), sem depender de
   * alguém lembrar do `indexes --prod`. `syncIndexes` (e não `createIndexes`)
   * também troca um índice antigo com opções diferentes, em vez de falhar.
   */
  async onModuleInit(): Promise<void> {
    await this.tokens.syncIndexes();
  }

  /** Antes de o banco fechar, termina os pedidos em andamento (SIGTERM, deploy). */
  async beforeApplicationShutdown(): Promise<void> {
    await Promise.allSettled(this.pending);
  }

  /** CA03: gera o token e o envia ao e-mail cadastrado da conta (RN05). */
  async processRequest(email: string): Promise<void> {
    const user = await this.users.findByEmail(email);
    if (!user?.ativo) return;

    const now = new Date();
    const ttl = this.config.get<number>('PASSWORD_RESET_TTL_MINUTES', 30);
    const cooldown = this.config.get<number>(
      'PASSWORD_RESET_COOLDOWN_SECONDS',
      60,
    );
    const token = generateResetToken();
    const tokenHash = hashResetToken(token);

    // Um pedido por conta (índice único em userId). O filtro só casa um pedido
    // anterior ao intervalo mínimo; se houver um recente (ou outro pedido
    // simultâneo acabou de inserir), o upsert tenta inserir e o índice único
    // recusa: nada é enviado. Substituir invalida o link anterior.
    try {
      await this.tokens
        .updateOne(
          {
            userId: user._id,
            createdAt: { $lte: cooldownThreshold(now, cooldown) },
          },
          {
            $set: {
              tokenHash,
              expiresAt: resetTokenExpiry(now, ttl),
              createdAt: now,
            },
            $unset: { usedAt: 1 },
          },
          { upsert: true },
        )
        .exec();
    } catch (error) {
      if ((error as { code?: number }).code === DUPLICATE_KEY) return;
      throw error;
    }

    const link = buildResetLink(
      this.config.getOrThrow<string>('APP_PUBLIC_URL'),
      token,
    );
    const result = await sendWithRetry(
      (message) => this.mail.send(message),
      { to: user.email, ...buildResetEmail({ link, ttlMinutes: ttl }) },
      parseRetryDelays(this.config.get<string>('MAIL_RETRY_DELAYS_MS')),
    );
    if (result.delivered) return;

    // E-mail perdido: desfaz o pedido para a pessoa poder pedir de novo na hora,
    // sem esperar o intervalo mínimo por um link que nunca chegou.
    await this.tokens.deleteMany({ userId: user._id, tokenHash }).exec();
    this.metrics.recordMailFailure('password_reset');
    this.logger.warn(
      `E-mail de recuperação não entregue após ${result.attempts} tentativas: ${result.errorName}`,
    );
  }

  /** CA04: informa se o link ainda permite redefinir a senha. */
  async validate(token: string): Promise<void> {
    if (!isResetTokenFormat(token)) throw new BadRequestException(INVALID_LINK);

    const record = await this.tokens
      .findOne({
        tokenHash: hashResetToken(token),
        usedAt: null,
        expiresAt: { $gt: new Date() },
      })
      .exec();
    if (!record) throw new BadRequestException(INVALID_LINK);

    const account = await this.users.findSessionState(record.userId.toString());
    if (!account?.ativo) throw new BadRequestException(INVALID_LINK);
  }

  /** CA05: troca a senha e consome o token. A senha já chega validada pelo DTO. */
  async confirm(token: string, novaSenha: string): Promise<void> {
    if (!isResetTokenFormat(token)) throw new BadRequestException(INVALID_LINK);

    // Consumo atômico: de dois envios simultâneos, só um encontra o token livre.
    const now = new Date();
    const record = await this.tokens
      .findOneAndUpdate(
        {
          tokenHash: hashResetToken(token),
          usedAt: null,
          expiresAt: { $gt: now },
        },
        { $set: { usedAt: now } },
      )
      .exec();
    if (!record) throw new BadRequestException(INVALID_LINK);

    const account = await this.users.findSessionState(record.userId.toString());
    if (!account?.ativo) throw new BadRequestException(INVALID_LINK);

    try {
      await this.users.setPassword(record.userId, novaSenha);
    } catch (error) {
      // Nada foi trocado: devolve o token para a pessoa tentar de novo.
      await this.tokens
        .updateOne({ _id: record._id }, { $unset: { usedAt: 1 } })
        .exec();
      throw error;
    }

    // Só o pedido consumido: se um pedido novo chegou no meio (e substituiu o
    // documento com outro hash), o link recém-enviado continua valendo.
    await this.tokens
      .deleteOne({ _id: record._id, tokenHash: record.tokenHash })
      .exec();
  }
}
