import type { components } from "@/shared/api/schema";

// Contrato publicado pelo backend (shared/openapi.json, tag `auth`):
//   POST /auth/password-reset/request  { email }            -> 202 (sempre, exista a conta ou não) | 400 | 429
//   POST /auth/password-reset/confirm  { token, novaSenha } -> 200 | 400 (link inválido ou senha fora da política) | 429
// Os corpos vêm dos tipos gerados: se o contrato mudar, o typecheck acusa.
export type RecoverAccessBody =
    components["schemas"]["RequestPasswordResetDto"];
export type ResetPasswordBody =
    components["schemas"]["ConfirmPasswordResetDto"];

export const REQUEST_RECOVERY_PATH = "/auth/password-reset/request";
export const CONFIRM_RESET_PATH = "/auth/password-reset/confirm";

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
