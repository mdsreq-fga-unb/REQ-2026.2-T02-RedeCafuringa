import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model, Types } from 'mongoose';
import { PasswordHasher } from '../../common/crypto/password-hasher.js';
import { PiiCipher } from '../../common/crypto/pii-cipher.js';
import { maskCnpj, maskCpf } from '../../common/validators/documento.js';
import type { SessionState } from '../auth/domain/session.js';
import { isAdult } from './domain/age.js';
import { Role } from './domain/role.js';
import { buildUserFilter } from './domain/user-filter.js';
import { DEFAULT_PAGE_SIZE, ListUsersQuery } from './dto/list-users.query.js';
import { UserDetailResponse } from './dto/user-detail.response.js';
import { UserListResponse } from './dto/user-list.response.js';
import { UserSummaryResponse } from './dto/user-summary.response.js';
import { AdminResponse } from './dto/admin.response.js';
import { CreateAdminDto } from './dto/create-admin.dto.js';
import { CreateConsumerDto } from './dto/create-consumer.dto.js';
import { CreateProducerDto } from './dto/create-producer.dto.js';
import { UserResponse } from './dto/user.response.js';
import { ProducerResponse } from './dto/producer.response.js';
import { User, UserDocument } from './schemas/user.schema.js';

const DUPLICATE_KEY = 11000;
/** CA06/RNF11: a consulta administrativa nem carrega senha e hashes do banco. */
const DETAIL_EXCLUDED_FIELDS = '-senhaHash -cpfHash -cnpjHash';
const SUMMARY_EXCLUDED_FIELDS = `${DETAIL_EXCLUDED_FIELDS} -cpfCifrado -cnpjCifrado`;
/** Conta administrativa só tem e-mail e senha (HU03); o nome é fixo. */
const ADMIN_DISPLAY_NAME = 'Administrador';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly users: Model<User>,
    private readonly cipher: PiiCipher,
    private readonly hasher: PasswordHasher,
  ) {}

  /** HU01: o cadastro público sempre cria um consumidor (RN01). */
  createConsumer(dto: CreateConsumerDto): Promise<UserDocument> {
    return this.create(dto, Role.CONSUMIDOR);
  }

  /** HU03: cria uma conta ADMINISTRADOR só com e-mail e senha (RF03). */
  async createAdmin(dto: CreateAdminDto): Promise<UserDocument> {
    const email = dto.email.toLowerCase();
    if (await this.users.exists({ email }).exec()) {
      throw new ConflictException('E-mail já cadastrado');
    }

    try {
      return await this.users.create({
        nome: ADMIN_DISPLAY_NAME,
        email,
        perfil: Role.ADMINISTRADOR,
        senhaHash: await this.hasher.hash(dto.senha),
      });
    } catch (error) {
      const { code, keyPattern } = error as {
        code?: number;
        keyPattern?: Record<string, number>;
      };
      // Outra chave duplicada (ex.: índice de cpfHash desatualizado) é falha de
      // infraestrutura, não "e-mail repetido": vide npm run db:sync-indexes.
      if (code === DUPLICATE_KEY && keyPattern?.email) {
        throw new ConflictException('E-mail já cadastrado');
      }
      throw error;
    }
  }

  /** HU02: cria uma conta pública com perfil PRODUTOR. */
  async createProducer(dto: CreateProducerDto): Promise<UserDocument> {
    const email = dto.email.toLowerCase();
    const cpfHash = this.cipher.blindIndex(dto.cpf);

    if (await this.users.exists({ cpfHash }).exec()) {
      throw new ConflictException('CPF já cadastrado');
    }
    if (await this.users.exists({ email }).exec()) {
      throw new ConflictException('E-mail já cadastrado');
    }

    const cnpjHash = dto.cnpj ? this.cipher.blindIndex(dto.cnpj) : undefined;
    if (cnpjHash && (await this.users.exists({ cnpjHash }).exec())) {
      throw new ConflictException('CNPJ já cadastrado');
    }

    const producerData = {
      nome: dto.nomeResponsavel,
      nomeIniciativa: dto.nomeIniciativa,
      nomeResponsavel: dto.nomeResponsavel,
      localidade: dto.localidade,
      ...(dto.telefone ? { telefone: dto.telefone } : {}),
      categoriaOfertada: dto.categoriaOfertada,
      formasPagamento: dto.formasPagamento,
      email,
      perfil: Role.PRODUTOR,
      cpfHash,
      cpfCifrado: this.cipher.encrypt(dto.cpf),
      ...(cnpjHash
        ? {
            cnpjHash,
            cnpjCifrado: this.cipher.encrypt(dto.cnpj as string),
          }
        : {}),
      senhaHash: await this.hasher.hash(dto.senha),
    };

    try {
      return await this.users.create(producerData);
    } catch (error) {
      if ((error as { code?: number }).code === DUPLICATE_KEY) {
        throw new ConflictException('Dados já cadastrados');
      }
      throw error;
    }
  }

  /**
   * Cria uma conta com o perfil informado. Não é exposto publicamente para
   * PRODUTOR/ADMINISTRADOR: esses fluxos chegam com as HU02 e HU03.
   */
  async create(dto: CreateConsumerDto, perfil: Role): Promise<UserDocument> {
    // RNF15: a data de nascimento afere a maioridade e por isso é obrigatória.
    if (!isAdult(new Date(dto.dataNascimento))) {
      throw new BadRequestException(
        'É necessário ter 18 anos ou mais para se cadastrar',
      );
    }

    const cpfHash = this.cipher.blindIndex(dto.cpf);
    if (await this.users.exists({ cpfHash }).exec()) {
      throw new ConflictException('CPF já cadastrado');
    }
    const email = dto.email.toLowerCase();
    if (await this.users.exists({ email }).exec()) {
      throw new ConflictException('E-mail já cadastrado');
    }

    try {
      return await this.users.create({
        nome: dto.nome,
        email,
        telefone: dto.telefone,
        dataNascimento: new Date(dto.dataNascimento),
        perfil,
        cpfHash,
        cpfCifrado: this.cipher.encrypt(dto.cpf),
        senhaHash: await this.hasher.hash(dto.senha),
      });
    } catch (error) {
      // Dois cadastros simultâneos com o mesmo CPF: o índice único decide.
      if ((error as { code?: number }).code === DUPLICATE_KEY) {
        throw new ConflictException('CPF já cadastrado');
      }
      throw error;
    }
  }

  /** RN05: o login identifica a conta pelo e-mail. */
  findByEmail(email: string): Promise<UserDocument | null> {
    return this.users.findOne({ email: email.toLowerCase() }).exec();
  }

  /**
   * HU10: grava a nova senha (somente o hash argon2id) e registra a troca, o que
   * encerra as sessões abertas antes dela.
   */
  async setPassword(id: Types.ObjectId, senha: string): Promise<void> {
    const senhaHash = await this.hasher.hash(senha);
    await this.users
      .updateOne(
        { _id: id },
        { $set: { senhaHash, credenciaisAlteradasEm: new Date() } },
      )
      .exec();
  }

  /** O mínimo para o JwtAuthGuard decidir se a sessão do token ainda vale. */
  async findSessionState(id: string): Promise<SessionState | null> {
    if (!isValidObjectId(id)) return null;
    const doc = await this.users
      .findById(id)
      .select('ativo perfil credenciaisAlteradasEm')
      .lean<Partial<SessionState> & Pick<SessionState, 'perfil'>>()
      .exec();
    if (!doc) return null;

    // `.lean()` não aplica o default do schema: sem o campo, a conta é ativa,
    // como o login (documento hidratado) já a trata.
    return {
      perfil: doc.perfil,
      ativo: doc.ativo !== false,
      ...(doc.credenciaisAlteradasEm
        ? { credenciaisAlteradasEm: doc.credenciaisAlteradasEm }
        : {}),
    };
  }

  async findById(id: string): Promise<UserDocument | null> {
    if (!isValidObjectId(id)) return null;
    return this.users.findById(id).exec();
  }

  /** HU04: consulta paginada de todos os perfis, só para administradores. */
  async list(query: ListUsersQuery): Promise<UserListResponse> {
    const pagina = query.pagina ?? 1;
    const limite = query.limite ?? DEFAULT_PAGE_SIZE;
    const filter = buildUserFilter(query);

    const [users, total] = await Promise.all([
      this.users
        .find(filter)
        .select(SUMMARY_EXCLUDED_FIELDS)
        .sort({ nome: 1, _id: 1 })
        .collation({ locale: 'pt', strength: 1 })
        .skip((pagina - 1) * limite)
        .limit(limite)
        .exec(),
      this.users.countDocuments(filter).exec(),
    ]);

    return {
      itens: users.map((user) => this.toSummary(user)),
      total,
      pagina,
      limite,
    };
  }

  /** HU04: detalhe de qualquer conta para o administrador. */
  async findDetail(id: string): Promise<UserDetailResponse> {
    const user = isValidObjectId(id)
      ? await this.users.findById(id).select(DETAIL_EXCLUDED_FIELDS).exec()
      : null;
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return this.toDetail(user);
  }

  toSummary(user: UserDocument): UserSummaryResponse {
    return {
      id: user.id as string,
      nome: user.nome,
      email: user.email,
      perfil: user.perfil,
      ...(user.nomeIniciativa ? { nomeIniciativa: user.nomeIniciativa } : {}),
    };
  }

  toDetail(user: UserDocument): UserDetailResponse {
    const optional = {
      telefone: user.telefone,
      cpf: user.cpfCifrado && maskCpf(this.cipher.decrypt(user.cpfCifrado)),
      cnpj: user.cnpjCifrado && maskCnpj(this.cipher.decrypt(user.cnpjCifrado)),
      nomeIniciativa: user.nomeIniciativa,
      nomeResponsavel: user.nomeResponsavel,
      localidade: user.localidade,
      categoriaOfertada: user.categoriaOfertada,
      formasPagamento: user.formasPagamento,
    };

    return {
      id: user.id as string,
      nome: user.nome,
      email: user.email,
      perfil: user.perfil,
      // Campos que não se aplicam ao perfil ficam fora da resposta.
      ...Object.fromEntries(
        Object.entries(optional).filter(([, value]) => value !== undefined),
      ),
    };
  }

  toResponseProducer(user: UserDocument): ProducerResponse {
    return {
      id: user.id as string,
      nome: user.nome,
      nomeIniciativa: user.nomeIniciativa,
      nomeResponsavel: user.nomeResponsavel,
      email: user.email,
      localidade: user.localidade,
      ...(user.telefone ? { telefone: user.telefone } : {}),
      categoriaOfertada: user.categoriaOfertada,
      formasPagamento: user.formasPagamento,
      perfil: user.perfil,
      cpf: maskCpf(this.cipher.decrypt(user.cpfCifrado as string)),
    };
  }

  toResponseAdmin(user: UserDocument): AdminResponse {
    return { id: user.id as string, email: user.email, perfil: user.perfil };
  }

  toResponse(user: UserDocument): UserResponse {
    return {
      id: user.id as string,
      nome: user.nome,
      email: user.email,
      telefone: user.telefone,
      perfil: user.perfil,
      ...(user.cpfCifrado
        ? { cpf: maskCpf(this.cipher.decrypt(user.cpfCifrado)) }
        : {}),
    };
  }
}
