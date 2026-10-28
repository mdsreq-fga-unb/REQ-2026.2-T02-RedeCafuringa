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
import { UserResponse } from './dto/user.response.js';
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

  /**
   * Cria uma conta com o perfil informado. Não é exposto publicamente para
   * PRODUTOR/ADMINISTRADOR: esses fluxos chegam com as HU02 e HU03.
   */
  async create(dto: CreateConsumerDto, perfil: Role): Promise<UserDocument> {
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

  /** RN08: o login identifica a conta pelo CPF, via blind index. */
  findByCpf(cpf: string): Promise<UserDocument | null> {
    return this.users.findOne({ cpfHash: this.cipher.blindIndex(cpf) }).exec();
  }

  async findById(id: string): Promise<UserDocument | null> {
    if (!isValidObjectId(id)) return null;
    return this.users.findById(id).exec();
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
