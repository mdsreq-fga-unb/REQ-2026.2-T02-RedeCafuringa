import type { Role } from '../../users/domain/role.js';

/** Estado da conta que sustenta um JWT emitido para ela. */
export interface SessionState {
  ativo: boolean;
  perfil: Role;
  credenciaisAlteradasEm?: Date;
}

/** O que o guard extrai do JWT para decidir a revogação. */
export interface SessionToken {
  perfil: Role;
  /** Emissão em segundos (padrão do JWT). */
  iat?: number;
  /** Instante do login em milissegundos (claim próprio, ver AuthService.login). */
  sat?: number;
}

/**
 * Um JWT só vale enquanto a conta o sustenta (HU10, RNF08): a conta existe,
 * está ativa, mantém o perfil do token e a senha não foi trocada depois do
 * login. O instante do login vem de `sat` (ms); tokens sem ele usam `iat`
 * (segundos), o que, no mesmo segundo da troca, encerra a sessão na dúvida.
 */
export function isSessionValid(
  token: SessionToken,
  account: SessionState | null,
): boolean {
  if (!account?.ativo) return false;
  if (account.perfil !== token.perfil) return false;
  if (!account.credenciaisAlteradasEm) return true;

  const issuedAtMs =
    typeof token.sat === 'number'
      ? token.sat
      : typeof token.iat === 'number'
        ? token.iat * 1000
        : undefined;
  if (issuedAtMs === undefined) return false;

  return issuedAtMs >= account.credenciaisAlteradasEm.getTime();
}
