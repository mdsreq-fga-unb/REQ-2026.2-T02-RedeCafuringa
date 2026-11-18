import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { DeletionReason } from '../domain/deletion-reason.js';

/** RN04: a exclusão administrativa exige um motivo. */
export class DeleteUserQuery {
  @ApiProperty({
    enum: DeletionReason,
    example: DeletionReason.DESCUMPRIMENTO_REGRAS,
    description:
      'Por que a conta está sendo excluída (RN04). INATIVIDADE permite um novo cadastro com os mesmos dados; DESCUMPRIMENTO_REGRAS (banimento) bloqueia novos cadastros com o mesmo CPF, CNPJ ou e-mail. Fica no log de auditoria, sem dados pessoais.',
  })
  @IsEnum(DeletionReason, {
    message: 'Motivo deve ser INATIVIDADE ou DESCUMPRIMENTO_REGRAS',
  })
  motivo: DeletionReason;
}
