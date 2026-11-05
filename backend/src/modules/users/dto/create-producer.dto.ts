import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  IsCnpj,
  NormalizeDocument as NormalizeCnpj,
} from '../../../common/validators/is-cnpj.decorator.js';
import {
  IsCpf,
  NormalizeDocument as NormalizeCpf,
} from '../../../common/validators/is-cpf.decorator.js';
import { ProducerCategory } from '../domain/producer-category.js';

/** Dados obrigatórios do produtor (RN02) + senha. */
export class CreateProducerDto {
  @ApiProperty({ example: 'Horta Comunitária Cafuringa' })
  @IsString({ message: 'Nome da iniciativa deve ser um texto' })
  @IsNotEmpty({ message: 'Nome da iniciativa é obrigatório' })
  @MaxLength(120, {
    message: 'Nome da iniciativa deve ter no máximo 120 caracteres',
  })
  nomeIniciativa: string;

  @ApiProperty({ example: 'João da Silva' })
  @IsString({ message: 'Nome do responsável deve ser um texto' })
  @IsNotEmpty({ message: 'Nome do responsável é obrigatório' })
  @MaxLength(120, {
    message: 'Nome do responsável deve ter no máximo 120 caracteres',
  })
  nomeResponsavel: string;

  @ApiProperty({ example: '529.982.247-25', description: 'Com ou sem máscara' })
  @NormalizeCpf()
  @IsCpf()
  cpf: string;

  @ApiPropertyOptional({
    example: '12.345.678/0001-95',
    description: 'Com ou sem máscara; opcional quando não houver CNPJ',
  })
  @IsOptional()
  @NormalizeCnpj()
  @IsCnpj()
  cnpj?: string;

  @ApiProperty({ example: 'Fazenda da Cafuringa, Núcleo Rural de Planaltina' })
  @IsString({ message: 'Localidade deve ser um texto' })
  @IsNotEmpty({ message: 'Localidade é obrigatória' })
  @MaxLength(200, {
    message: 'Localidade deve ter no máximo 200 caracteres',
  })
  localidade: string;

  @ApiProperty({
    enum: ProducerCategory,
    example: ProducerCategory.PRODUTOS_E_EXPERIENCIAS,
    description: 'Tipo de oferta do produtor',
  })
  @IsEnum(ProducerCategory, {
    message:
      'Categoria ofertada deve ser Produtos, Experiências ou Produtos e Experiências',
  })
  categoriaOfertada: ProducerCategory;

  @ApiProperty({
    example: ['PIX', 'Dinheiro'],
    description: 'Formas de pagamento aceitas',
  })
  @IsArray({ message: 'Formas de pagamento deve ser uma lista' })
  @ArrayMinSize(1, {
    message: 'Informe pelo menos uma forma de pagamento',
  })
  @IsString({
    each: true,
    message: 'Cada forma de pagamento deve ser um texto',
  })
  formasPagamento: string[];

  @ApiProperty({ example: 'produtor@exemplo.com' })
  @IsEmail({}, { message: 'E-mail inválido' })
  @MaxLength(254, { message: 'E-mail deve ter no máximo 254 caracteres' })
  email: string;

  @ApiProperty({
    example: 'SenhaForte123',
    description: '8 a 128 caracteres, com pelo menos uma letra e um número',
  })
  @IsString({ message: 'Senha deve ser um texto' })
  @MinLength(8, { message: 'Senha deve ter pelo menos 8 caracteres' })
  // Limite superior evita DoS pelo custo do argon2 com entradas gigantes.
  @MaxLength(128, { message: 'Senha deve ter no máximo 128 caracteres' })
  @Matches(/[A-Za-z]/, { message: 'Senha deve conter pelo menos uma letra' })
  @Matches(/\d/, { message: 'Senha deve conter pelo menos um número' })
  senha: string;
}
