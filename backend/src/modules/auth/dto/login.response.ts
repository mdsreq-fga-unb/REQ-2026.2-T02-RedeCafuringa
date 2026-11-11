import { ApiProperty } from '@nestjs/swagger';
import { UserResponse } from '../../users/dto/user.response.js';

export class LoginResponse {
  @ApiProperty({ description: 'JWT a enviar em Authorization: Bearer <token>' })
  accessToken: string;

  @ApiProperty({ example: 'Bearer' })
  tokenType: 'Bearer';

  @ApiProperty({ example: 900, description: 'Validade do token, em segundos' })
  expiresIn: number;

  @ApiProperty({ type: UserResponse })
  usuario: UserResponse;
}
