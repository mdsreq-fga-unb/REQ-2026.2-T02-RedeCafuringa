import { PaymentMethod } from '../../bookings/domain/booking.js';
import { ApiProperty } from '@nestjs/swagger';
import { ProductProducerResponse } from '../../products/dto/product.response.js';
import { ExperienceCategory } from '../domain/experience.js';

/** Experiência como apresentada ao produtor e ao público (HU21). */
export class ExperienceResponse {
  @ApiProperty({ example: '64b0c0ffee0000000000e001' })
  id: string;

  @ApiProperty({ example: 'Trilha guiada da nascente' })
  nome: string;

  @ApiProperty({
    enum: ExperienceCategory,
    example: ExperienceCategory.EXPERIENCIA,
  })
  categoria: ExperienceCategory;

  @ApiProperty({
    example: 'Caminhada de 3 km até a nascente, com parada para café da roça.',
  })
  descricao: string;

  @ApiProperty({ example: 45, description: 'Reais, até 2 casas decimais' })
  valorPorPessoa: number;

  @ApiProperty({ example: 'Sítio Boa Vista, Núcleo Rural Cafuringa' })
  local: string;

  @ApiProperty({ example: '2 horas' })
  duracao: string;

  @ApiProperty({
    type: [String],
    example: [
      '/experiences/64b0c0ffee0000000000e001/photos/64b0c0ffee0000000000f001?v=Q2FmdXJpbmdhRm90',
    ],
    description:
      'Caminhos das fotos, na ordem enviada, relativos à URL base da API. Mudam a cada foto nova, então podem ficar em cache indefinidamente.',
  })
  fotos: string[];

  @ApiProperty({
    type: ProductProducerResponse,
    description:
      'Responsável pela oferta (CA03, CA08, RN09): só dados de divulgação, nunca e-mail, telefone ou documentos',
  })
  produtor: ProductProducerResponse;

  @ApiProperty({
    example: '2026-11-16T12:00:00.000Z',
    description: 'Data do cadastro',
  })
  criadoEm: string;

  @ApiProperty({
    example: true,
    description:
      'Se a oferta está disponível (RN10). As rotas públicas só devolvem disponíveis.',
  })
  disponivel: boolean;

  @ApiProperty({
    example: true,
    description:
      'Pagamento por Pix: se o aceite pede sinal de 50% para garantir a vaga',
  })
  exigeSinal: boolean;

  @ApiProperty({
    enum: PaymentMethod,
    isArray: true,
    example: ['dinheiro', 'pix'],
    description:
      'Formas que a produtora aceita no dia; vazio é combinar com ela',
  })
  formasPagamentoNoDia: PaymentMethod[];
}

/** Página do catálogo público de experiências (mesmo formato de `GET /products`). */
export class ExperienceListResponse {
  @ApiProperty({
    type: [ExperienceResponse],
    description:
      'Experiências da página, da mais nova à mais antiga; vazio quando não há registros.',
  })
  itens: ExperienceResponse[];

  @ApiProperty({ example: 12, description: 'Total que atende aos filtros' })
  total: number;

  @ApiProperty({ example: 1, description: 'Página devolvida' })
  pagina: number;

  @ApiProperty({ example: 20, description: 'Tamanho da página' })
  limite: number;
}
