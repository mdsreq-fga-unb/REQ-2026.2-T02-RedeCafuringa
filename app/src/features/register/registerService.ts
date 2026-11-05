import type { RegisterPayload } from "./registerForm";
import { isMockAuthEnabled } from "@/features/auth/authService";
import { ApiHttpError, getApiClient } from "@/shared/api";
import { toCreateProducerBody } from "./registerApi";
import {
    isMockCpfRegistered,
    registerMockUser,
} from "@/features/auth/mockAuth";

/** Campo que a API (ou o mock) apontou como já cadastrado. */
export type DuplicateField = "document" | "email" | "cnpj";

/** Traduz a mensagem do 409 do back no campo duplicado; desconhecida → sem campo. */
function duplicateFieldFromMessage(
    message: string,
): DuplicateField | undefined {
    const text = message.toLocaleLowerCase("pt-BR");
    if (text.includes("e-mail") || text.includes("email")) return "email";
    if (text.includes("cnpj")) return "cnpj";
    if (text.includes("cpf")) return "document";
    return undefined;
}

export type RegisterResult =
    | { ok: true }
    | { ok: false; reason: "duplicate"; field?: DuplicateField }
    | { ok: false; reason: "invalid"; messages: string[] }
    | { ok: false; reason: "rate_limit"; retryAfterSeconds?: number }
    | { ok: false; reason: "error" };

export type MockAccountDirectory = {
    hasDocument(document: string): boolean;
    add(payload: RegisterPayload): void;
};

const mockService = createMockRegisterService({
    hasDocument: isMockCpfRegistered,
    add: (payload) => {
        registerMockUser({
            cpf: payload.document,
            email: payload.email,
            password: payload.password,
            name: payload.name,
            role: "producer",
        });
    },
});

// POST /users/producers (corpo montado em registerApi.ts)  ->  201
//   400 dados inválidos | 409 CPF/CNPJ ou e-mail já cadastrado | 429 muitas tentativas
export async function registerProducer(
    payload: RegisterPayload,
): Promise<RegisterResult> {
    if (isMockAuthEnabled) return mockService.register(payload);

    try {
        await getApiClient().post<unknown>(
            "/users/producers",
            toCreateProducerBody(payload),
            {
                auth: false,
            },
        );
        return { ok: true };
    } catch (error) {
        if (error instanceof ApiHttpError) {
            if (error.status === 409) {
                const field = duplicateFieldFromMessage(error.message);
                return {
                    ok: false,
                    reason: "duplicate",
                    ...(field ? { field } : {}),
                };
            }
            if (error.status === 400) {
                const messages =
                    error.details.length > 0 ? error.details : [error.message];
                return { ok: false, reason: "invalid", messages };
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
}

export function createMockRegisterService(directory?: MockAccountDirectory) {
    const accounts: RegisterPayload[] = [];

    return {
        async register(payload: RegisterPayload): Promise<RegisterResult> {
            if (
                directory?.hasDocument(payload.document) ||
                accounts.some(
                    (account) => account.document === payload.document,
                )
            ) {
                return { ok: false, reason: "duplicate", field: "document" };
            }
            if (accounts.some((account) => account.email === payload.email)) {
                return { ok: false, reason: "duplicate", field: "email" };
            }
            if (
                payload.cnpj &&
                accounts.some((account) => account.cnpj === payload.cnpj)
            ) {
                return { ok: false, reason: "duplicate", field: "cnpj" };
            }
            accounts.push(payload);
            directory?.add(payload);
            return { ok: true };
        },
    };
}
