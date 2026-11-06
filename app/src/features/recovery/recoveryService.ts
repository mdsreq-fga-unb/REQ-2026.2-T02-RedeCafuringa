import { isMockAuthEnabled } from "@/features/auth/authMode";
import { ApiHttpError, getApiClient } from "@/shared/api";
import { requestMockRecovery, resetMockPassword } from "./mockRecovery";
import { toRecoverAccessBody, toResetPasswordBody } from "./recoveryApi";

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
        // POST /auth/recuperar-acesso { email } -> 202 (sempre, exista a conta ou não)
        //   429 muitas tentativas
        async requestAccessRecovery(email: string): Promise<RecoverAccessResult> {
            if (deps.useMock) {
                await requestMockRecovery(email);
                return { ok: true };
            }

            try {
                await deps
                    .getClient()
                    .post<unknown>(
                        "/auth/recuperar-acesso",
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

        // POST /auth/redefinir-senha { token, novaSenha } -> 204
        //   400 token inválido ou expirado | 429 muitas tentativas
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
                        "/auth/redefinir-senha",
                        toResetPasswordBody(input),
                        { auth: false },
                    );
                return { ok: true };
            } catch (error) {
                if (error instanceof ApiHttpError) {
                    if (error.status === 400) {
                        return { ok: false, reason: "invalid_token" };
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