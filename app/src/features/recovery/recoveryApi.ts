// Contrato proposto para a HU10 (ainda não existe no backend / shared/openapi.json).
// Quando o backend publicar as rotas, estes tipos passam a vir de components["schemas"].

// POST /auth/recuperar-acesso  { email }  ->  202 (sempre, exista a conta ou não)
export type RecoverAccessBody = { email: string };

// POST /auth/redefinir-senha  { token, novaSenha }  ->  204
//   400 token inválido ou expirado | 429 muitas tentativas
export type ResetPasswordBody = { token: string; novaSenha: string };

export function toRecoverAccessBody(input: {
    email: string;
}): RecoverAccessBody {
    return { email: input.email.trim().toLowerCase() };
}

export function toResetPasswordBody(input: {
    token: string;
    password: string;
}): ResetPasswordBody {
    return { token: input.token.trim(), novaSenha: input.password };
}