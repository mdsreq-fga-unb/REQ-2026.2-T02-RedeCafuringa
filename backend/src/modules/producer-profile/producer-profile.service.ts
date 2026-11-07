import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isObjectIdOrHexString, Model } from 'mongoose';
import { Role } from '../users/domain/role.js';
import { User } from '../users/schemas/user.schema.js';
import { photoPath } from './domain/profile-photo.js';
import { publicPhone } from './domain/trajectory.js';
import type { SaveTrajectoryDto } from './dto/save-trajectory.dto.js';
import type {
  OwnTrajectoryResponse,
  PublicTrajectoryResponse,
} from './dto/trajectory.response.js';

const NOT_FOUND = 'Produtor não encontrado';

/**
 * Só os campos que as respostas usam. Senha, hashes, CPF/CNPJ cifrados e e-mail
 * nunca são lidos do banco aqui (RNF11), nem por acidente.
 */
const OWN_FIELDS =
  'trajetoria atividades telefone telefonePublico trajetoriaAtualizadaEm fotoVersao';
const PUBLIC_FIELDS =
  'nomeIniciativa categoriaOfertada trajetoria atividades telefone telefonePublico fotoVersao';

type OwnFields = Pick<
  User,
  | 'trajetoria'
  | 'atividades'
  | 'telefone'
  | 'telefonePublico'
  | 'trajetoriaAtualizadaEm'
  | 'fotoVersao'
>;
type PublicFields = Pick<
  User,
  | 'nomeIniciativa'
  | 'categoriaOfertada'
  | 'trajetoria'
  | 'atividades'
  | 'telefone'
  | 'telefonePublico'
  | 'fotoVersao'
> & { _id: unknown };

@Injectable()
export class ProducerProfileService {
  constructor(@InjectModel(User.name) private readonly users: Model<User>) {}

  /** CA01: a trajetória do próprio produtor autenticado. */
  async getOwn(userId: string): Promise<OwnTrajectoryResponse> {
    const user = await this.users
      .findOne(this.activeProducer(userId))
      .select(OWN_FIELDS)
      .lean<OwnFields>()
      .exec();
    if (!user) throw new NotFoundException(NOT_FOUND);
    return this.toOwn(userId, user);
  }

  /**
   * CA04: grava a trajetória na conta de quem está autenticado. O dono vem do
   * token, nunca do corpo. Só os campos do contrato entram no `$set`, então
   * nenhum outro dado da conta (perfil, e-mail, senha) pode ser alterado aqui.
   * Repetir o mesmo envio grava o mesmo conteúdo (idempotente no conteúdo; só
   * `atualizadoEm` avança), o que torna seguro reenviar após queda (CA07).
   */
  async save(
    userId: string,
    dto: SaveTrajectoryDto,
  ): Promise<OwnTrajectoryResponse> {
    // `telefone: null` remove o telefone; sem número não há o que divulgar,
    // então a visibilidade volta a privada mesmo que o pedido diga o contrário.
    const removePhone = dto.telefone === null;
    const telefonePublico = removePhone ? false : dto.telefonePublico;
    const user = await this.users
      .findOneAndUpdate(
        this.activeProducer(userId),
        {
          $set: {
            trajetoria: dto.trajetoria,
            atividades: dto.atividades ?? '',
            trajetoriaAtualizadaEm: new Date(),
            ...(dto.telefone === undefined || removePhone
              ? {}
              : { telefone: dto.telefone }),
            ...(telefonePublico === undefined ? {} : { telefonePublico }),
          },
          ...(removePhone ? { $unset: { telefone: 1 } } : {}),
        },
        { returnDocument: 'after', projection: OWN_FIELDS },
      )
      .lean<OwnFields>()
      .exec();
    if (!user) throw new NotFoundException(NOT_FOUND);
    return this.toOwn(userId, user);
  }

  /** CA05/RN07: o que consumidores e visitantes podem ver. */
  async getPublic(id: string): Promise<PublicTrajectoryResponse> {
    if (!isObjectIdOrHexString(id)) throw new NotFoundException(NOT_FOUND);

    const user = await this.users
      .findOne(this.activeProducer(id))
      .select(PUBLIC_FIELDS)
      .lean<PublicFields>()
      .exec();
    // O perfil só aparece depois que o produtor publica a trajetória.
    if (!user?.trajetoria) throw new NotFoundException(NOT_FOUND);

    const telefone = publicPhone(user.telefone, user.telefonePublico);
    return {
      id: String(user._id),
      ...(user.nomeIniciativa ? { nomeIniciativa: user.nomeIniciativa } : {}),
      ...(user.categoriaOfertada
        ? { categoriaOfertada: user.categoriaOfertada }
        : {}),
      trajetoria: user.trajetoria,
      ...(user.atividades ? { atividades: user.atividades } : {}),
      ...(telefone ? { telefone } : {}),
      ...(user.fotoVersao
        ? { fotoUrl: photoPath(String(user._id), user.fotoVersao) }
        : {}),
    };
  }

  private activeProducer(id: string) {
    return { _id: id, perfil: Role.PRODUTOR, ativo: true };
  }

  private toOwn(userId: string, user: OwnFields): OwnTrajectoryResponse {
    return {
      ...(user.trajetoria ? { trajetoria: user.trajetoria } : {}),
      ...(user.atividades ? { atividades: user.atividades } : {}),
      ...(user.telefone ? { telefone: user.telefone } : {}),
      telefonePublico: user.telefonePublico === true,
      ...(user.trajetoriaAtualizadaEm
        ? { atualizadoEm: user.trajetoriaAtualizadaEm.toISOString() }
        : {}),
      ...(user.fotoVersao
        ? { fotoUrl: photoPath(userId, user.fotoVersao) }
        : {}),
    };
  }
}
