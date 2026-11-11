import { ApiProperty } from '@nestjs/swagger';

/** Resposta do envio da foto de perfil. */
export class PhotoResponse {
  @ApiProperty({
    example: '/producers/64b0c0ffee0000000000abcd/photo?v=Q2FmdXJpbmdhRm90',
    description:
      'Caminho da foto, relativo à URL base da API (ex.: prefixe com `VITE_API_URL`). Muda a cada nova foto, então pode ficar em cache indefinidamente.',
  })
  fotoUrl: string;
}
