import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { PasswordHasher } from '../../common/crypto/password-hasher.js';
import { PiiCipher } from '../../common/crypto/pii-cipher.js';
import { maskCpf } from '../../common/validators/documento.js';
import { isAdult } from './domain/age.js';
import { Role } from './domain/role.js';
import { CreateConsumerDto } from './dto/create-consumer.dto.js';
import { CreateProducerDto } from './dto/create-producer.dto.js';
import { UserResponse } from './dto/user.response.js';
import { ProducerResponse } from './dto/producer.response.js';
import { User, UserDocument } from './schemas/user.schema.js';

const DUPLICATE_KEY = 11000;

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

    try {
      return await this.users.create({
        nome: dto.nome,
        email: dto.email.toLowerCase(),
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

  async findById(id: string): Promise<UserDocument | null> {
    if (!isValidObjectId(id)) return null;
    return this.users.findById(id).exec();
  }

  toResponseProducer(user: UserDocument): ProducerResponse {
    return {
      id: user.id as string,
      nome: user.nome,
      nomeIniciativa: user.nomeIniciativa,
      nomeResponsavel: user.nomeResponsavel,
      email: user.email,
      localidade: user.localidade,
      categoriaOfertada: user.categoriaOfertada,
      formasPagamento: user.formasPagamento,
      perfil: user.perfil,
      cpf: maskCpf(this.cipher.decrypt(user.cpfCifrado)),
    };
  }

  toResponse(user: UserDocument): UserResponse {
    return {
      id: user.id as string,
      nome: user.nome,
      email: user.email,
      telefone: user.telefone,
      perfil: user.perfil,
      cpf: maskCpf(this.cipher.decrypt(user.cpfCifrado)),
    };
  }
}
