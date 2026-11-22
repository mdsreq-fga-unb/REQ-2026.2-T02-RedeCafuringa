import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import {
  DEFAULT_PRODUCTS_PAGE,
  MAX_PRODUCTS_PAGE,
} from '../../products/dto/list-products.query.js';
import { BookingStatus } from '../domain/booking.js';

/**
 * Filtros da consulta de pré-reservas (HU45): situação e paginação. O dono da
 * consulta vem sempre do token (RNF08), nunca da query string.
 */
export class ListBookingsQuery {
  @ApiPropertyOptional({
    enum: BookingStatus,
    example: BookingStatus.PENDENTE,
    description: 'Só as solicitações nesta situação (RN21)',
  })
  @IsOptional()
  @IsEnum(BookingStatus, {
    message: `Situação inválida. Use: ${Object.values(BookingStatus).join(', ')}`,
  })
  status?: BookingStatus;

  @ApiPropertyOptional({
    example: 1,
    default: 1,
    minimum: 1,
    description: 'Página desejada, a partir de 1',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Página deve ser um número inteiro' })
  @Min(1, { message: 'Página deve ser maior ou igual a 1' })
  pagina?: number;

  @ApiPropertyOptional({
    example: DEFAULT_PRODUCTS_PAGE,
    default: DEFAULT_PRODUCTS_PAGE,
    minimum: 1,
    maximum: MAX_PRODUCTS_PAGE,
    description: 'Quantidade de solicitações por página',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limite deve ser um número inteiro' })
  @Min(1, { message: 'Limite deve ser maior ou igual a 1' })
  @Max(MAX_PRODUCTS_PAGE, {
    message: `Limite deve ser no máximo ${MAX_PRODUCTS_PAGE}`,
  })
  limite?: number;
}
