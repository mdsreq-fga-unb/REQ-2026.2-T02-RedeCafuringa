import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProducerCategory } from '../../users/domain/producer-category.js';

/** Trajetória como o próprio produtor a vê (área logada). */
export class OwnTrajectoryResponse {
  @ApiPropertyOptional({
    example: 'Começamos a plantar café em 1990.',
    description: 'Ausente enquanto o produtor não registrou a trajetória',
  })
  trajetoria?: string;

  @ApiPropertyOptional({
    example: 'Horta orgânica e visitas guiadas.',
    description: 'Ausente enquanto não houver atividades registradas',
  })
  atividades?: string;

  @ApiPropertyOptional({
    example: '61999990000',
    description:
      'Telefone de contato cadastrado (privado, só o titular vê aqui)',
  })
  telefone?: string;

  @ApiProperty({
    example: false,
    description: 'Se verdadeiro, o telefone aparece no perfil público',
  })
  telefonePublico: boolean;

  @ApiPropertyOptional({
    example: '2026-11-06T12:00:00.000Z',
    description: 'Data da última gravação da trajetória',
  })
  atualizadoEm?: string;
}

/** Trajetória como consumidores e visitantes a veem (RN07: só dados públicos). */
export class PublicTrajectoryResponse {
  @ApiProperty({
    example: '64b0c0ffee0000000000abcd',
    description: 'Identificador do produtor',
  })
  id: string;

  @ApiPropertyOptional({
    example: 'Horta Comunitária Cafuringa',
    description: 'Nome da iniciativa',
  })
  nomeIniciativa?: string;

  @ApiPropertyOptional({
    enum: ProducerCategory,
    example: ProducerCategory.PRODUTOS,
    description: 'Tipo de oferta do produtor',
  })
  categoriaOfertada?: ProducerCategory;

  @ApiProperty({
    example: 'Começamos a plantar café em 1990.',
    description:
      'História do produtor, em texto simples; exiba escapando HTML. Sempre presente: o perfil só é público depois de publicada.',
  })
  trajetoria: string;

  @ApiPropertyOptional({
    example: 'Horta orgânica e visitas guiadas.',
    description:
      'Atividades desenvolvidas, em texto simples. Ausente se vazio.',
  })
  atividades?: string;

  @ApiPropertyOptional({
    example: '61999990000',
    description:
      'Telefone de contato, presente somente quando o produtor autorizou a divulgação',
  })
  telefone?: string;
}
