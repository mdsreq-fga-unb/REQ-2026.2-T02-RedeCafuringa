import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BookingResponse } from './booking.response.js';

/** Experiência solicitada, como o protótipo da HU45 a mostra no cartão. */
export class BookingExperienceResponse {
  @ApiProperty({ example: 'Trilha guiada da nascente' })
  nome: string;

  @ApiProperty({ example: 'Sítio Boa Vista, Núcleo Rural Cafuringa' })
  local: string;

  @ApiProperty({ example: 45, description: 'Reais por pessoa, até 2 casas' })
  valorPorPessoa: number;

  @ApiProperty({
    example: true,
    description:
      'Se a experiência ainda está na oferta pública (RN10). A solicitação continua consultável mesmo depois que ela sai.',
  })
  disponivel: boolean;

  @ApiPropertyOptional({
    example:
      '/experiences/64b0c0ffee0000000000e001/photos/64b0c0ffee0000000000f001?v=Q2FmdXJpbmdhRm90',
    description:
      'Caminho da primeira foto, relativo à URL base da API. Ausente quando a experiência não está mais disponível, porque a foto pública deixa de existir.',
  })
  foto?: string;
}

/** O outro lado da solicitação: o produtor para o consumidor e vice-versa. */
export class BookingCounterpartResponse {
  @ApiProperty({ example: '64b0c0ffee0000000000a001' })
  id: string;

  @ApiProperty({
    example: 'Sítio Raízes',
    description:
      'Para o consumidor: nome da iniciativa do produtor (ou o nome dele, se não houver). Para o produtor: nome do consumidor. Nunca e-mail, telefone ou documentos (RNF11).',
  })
  nome: string;
}

/**
 * Pré-reserva como consultada (HU45): a resposta da HU44 mais a experiência,
 * o outro lado e a última alteração. Mostra sempre a situação gravada agora
 * (CA07).
 */
export class BookingDetailResponse extends BookingResponse {
  @ApiProperty({ type: BookingExperienceResponse })
  experiencia: BookingExperienceResponse;

  @ApiProperty({ type: BookingCounterpartResponse })
  contraparte: BookingCounterpartResponse;

  @ApiProperty({
    example: '2026-11-21T12:30:00.000Z',
    description: 'Última alteração (mudança de situação, por exemplo)',
  })
  atualizadoEm: string;
}

/** Página de pré-reservas, da mais nova à mais antiga. */
export class BookingListResponse {
  @ApiProperty({
    type: [BookingDetailResponse],
    description:
      'Solicitações da página; vazio quando não há nenhuma (CA06), nunca erro.',
  })
  itens: BookingDetailResponse[];

  @ApiProperty({ example: 12, description: 'Total que atende aos filtros' })
  total: number;

  @ApiProperty({ example: 1, description: 'Página devolvida' })
  pagina: number;

  @ApiProperty({ example: 20, description: 'Tamanho da página' })
  limite: number;
}
