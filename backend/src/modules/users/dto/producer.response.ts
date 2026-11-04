import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProducerCategory } from '../domain/producer-category.js';
import { Role } from '../domain/role.js';

/** Dados públicos de retorno para o perfil do produtor titular. */
export class ProducerResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nome: string;

  @ApiProperty()
  nomeIniciativa?: string;

  @ApiProperty()
  nomeResponsavel?: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  localidade?: string;

  @ApiProperty({ enum: ProducerCategory })
  categoriaOfertada?: ProducerCategory;

  @ApiProperty({ type: [String] })
  formasPagamento?: string[];

  @ApiProperty({ enum: Role })
  perfil: Role;

  @ApiPropertyOptional({ example: '***.982.247-**' })
  cpf?: string;
}
