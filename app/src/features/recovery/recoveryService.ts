import { isMockAuthEnabled } from "@/features/auth/authMode";
import { ApiHttpError, getApiClient } from "@/shared/api";
import { requestMockRecovery, resetMockPassword } from "./mockRecovery";
import {
    CONFIRM_RESET_PATH,
    REQUEST_RECOVERY_PATH,
    toRecoverAccessBody,
    toResetPasswordBody,
} from "./recoveryApi";

export type RecoverAccessResult =
    | { ok: true }
    | { ok: false; reason: "rate_limit"; retryAfterSeconds?: number }
    | { ok: false; reason: "error" };

export type ResetPasswordResult =
    | { ok: true }
    | { ok: false; reason: "invalid_token" }
    | { ok: false; reason: "rate_limit"; retryAfterSeconds?: number }
    | { ok: false; reason: "error" };

type RecoveryApiClient = Pick<ReturnType<typeof getApiClient>, "post">;

export type RecoveryServiceDeps = {
    useMock: boolean;
    getClient: () => RecoveryApiClient;
};

export function createRecoveryService(deps: RecoveryServiceDeps) {
    return {
        // POST /auth/password-reset/request { email } -> 202 (sempre, exista a conta ou não)
        //   400 e-mail inválido | 429 muitas tentativas
        async requestAccessRecovery(
            email: string,
        ): Promise<RecoverAccessResult> {
            if (deps.useMock) {
                await requestMockRecovery(email);
                return { ok: true };
            }

            try {
                await deps
                    .getClient()
                    .post<unknown>(
                        REQUEST_RECOVERY_PATH,
                        toRecoverAccessBody({ email }),
                        { auth: false },
                    );
                return { ok: true };
            } catch (error) {
                if (error instanceof ApiHttpError && error.status === 429) {
                    return {
                        ok: false,
                        reason: "rate_limit",
                        retryAfterSeconds: error.retryAfterSeconds,
                    };
                }
                return { ok: false, reason: "error" };
            }
        },

        // POST /auth/password-reset/confirm { token, novaSenha } -> 200
        //   400 link inválido/expirado (mensagem única) ou senha fora da política (lista de
        //   mensagens; nesse caso o link continua valendo) | 429 muitas tentativas
        async resetPassword(input: {
            token: string;
            password: string;
        }): Promise<ResetPasswordResult> {
            if (deps.useMock) {
                return (await resetMockPassword(input))
                    ? { ok: true }
                    : { ok: false, reason: "invalid_token" };
            }

            try {
                await deps
                    .getClient()
                    .post<unknown>(
                        CONFIRM_RESET_PATH,
                        toResetPasswordBody(input),
                        { auth: false },
                    );
                return { ok: true };
            } catch (error) {
                if (error instanceof ApiHttpError) {
                    if (error.status === 400) {
                        // Lista de mensagens = senha recusada pela política: o link
                        // ainda vale, então não pode ser mostrado como link inválido.
                        return error.details.length > 0
                            ? { ok: false, reason: "error" }
                            : { ok: false, reason: "invalid_token" };
                    }
                    if (error.status === 429) {
                        return {
                            ok: false,
                            reason: "rate_limit",
                            retryAfterSeconds: error.retryAfterSeconds,
                        };
                    }
                }
                return { ok: false, reason: "error" };
            }
        },
    };
}

const recoveryService = createRecoveryService({
    useMock: isMockAuthEnabled,
    getClient: getApiClient,
});

export const requestAccessRecovery = recoveryService.requestAccessRecovery;
export const resetPassword = recoveryService.resetPassword;
