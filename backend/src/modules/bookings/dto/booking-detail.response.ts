import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentStatus } from '../domain/booking-payment.js';
import { BookingResponse } from './booking.response.js';

/** Pagamento por Pix, criado no aceite: valores em reais e situação do sinal. */
export class BookingPaymentResponse {
  @ApiProperty({
    example: 182,
    description: 'Total em reais, com o preço congelado no aceite',
  })
  total: number;

  @ApiProperty({
    example: 91,
    description: 'Sinal em reais (50%), pago antes para garantir a vaga',
  })
  sinal: number;

  @ApiProperty({
    example: 91,
    description: 'Restante em reais, pago no dia com a produtora',
  })
  restante: number;

  @ApiProperty({
    enum: PaymentStatus,
    example: PaymentStatus.AGUARDANDO_SINAL,
    description:
      'Situação do sinal valendo agora: o prazo vencido já aparece como expirado',
  })
  situacao: PaymentStatus;

  @ApiPropertyOptional({
    example: '2026-11-22T13:30:00.000Z',
    description:
      'Prazo para pagar o sinal; ausente quando o sinal é dispensado',
  })
  prazoSinal?: string;
}

/**
 * Dados para o app montar o código Pix do sinal. Só a consumidora dona da
 * pré-reserva aceita recebe, só enquanto o sinal está por pagar e só se a
 * produtora autorizou mostrar a chave.
 */
export class BookingPixResponse {
  @ApiProperty({ example: '+5561999998888', description: 'Chave normalizada' })
  chave: string;

  @ApiProperty({ example: 'Maria da Silva' })
  nomeRecebedor: string;

  @ApiProperty({ example: 'BRASILIA' })
  cidade: string;

  @ApiProperty({
    example: '65f0c0ffee0000000000abcd',
    description: 'Identificador da cobrança: o id da pré-reserva',
  })
  txid: string;
}

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
  @ApiPropertyOptional({ description: 'Resposta do produtor à solicitação' })
  mensagemResposta?: string;

  @ApiProperty({ type: BookingExperienceResponse })
  experiencia: BookingExperienceResponse;

  @ApiProperty({ type: BookingCounterpartResponse })
  contraparte: BookingCounterpartResponse;

  @ApiProperty({
    example: '2026-11-21T12:30:00.000Z',
    description: 'Última alteração (mudança de situação, por exemplo)',
  })
  atualizadoEm: string;

  @ApiPropertyOptional({
    type: BookingPaymentResponse,
    description: 'Só existe depois do aceite',
  })
  pagamento?: BookingPaymentResponse;

  @ApiPropertyOptional({
    type: BookingPixResponse,
    description:
      'Só no detalhe da consumidora, enquanto o sinal está por pagar e se a produtora autorizou',
  })
  pix?: BookingPixResponse;
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
