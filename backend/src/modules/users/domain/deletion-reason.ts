/**
 * RN04: por que a administração exclui a conta.
 *
 * - INATIVIDADE (necessidade administrativa): a pessoa pode se cadastrar de
 *   novo com os mesmos dados.
 * - DESCUMPRIMENTO_REGRAS (banimento): CPF, CNPJ e e-mail ficam bloqueados
 *   para novos cadastros (só os hashes, ver BannedIdentity).
 *
 * O motivo vai para o log de auditoria (sem dados pessoais).
 */
export enum DeletionReason {
  INATIVIDADE = 'INATIVIDADE',
  DESCUMPRIMENTO_REGRAS = 'DESCUMPRIMENTO_REGRAS',
}
