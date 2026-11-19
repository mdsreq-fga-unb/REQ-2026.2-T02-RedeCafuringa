import type { RegisterPayload } from "./registerForm";
import { isMockAuthEnabled } from "@/features/auth/authService";
import { ApiHttpError, getApiClient } from "@/shared/api";
import { toCreateProducerBody } from "./registerApi";
import {
    isMockCpfRegistered,
    isMockEmailRegistered,
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
    /** CPF, CNPJ ou e-mail de conta banida; `message` orienta a pessoa. */
    | { ok: false; reason: "blocked"; message: string }
    | { ok: false; reason: "error" };

export type MockAccountDirectory = {
    hasDocument(document: string): boolean;
    hasEmail?(email: string): boolean;
    add(payload: RegisterPayload): void;
};

const mockService = createMockRegisterService({
    hasDocument: isMockCpfRegistered,
    hasEmail: isMockEmailRegistered,
    add: (payload) => {
        registerMockUser({
            cpf: payload.document,
            email: payload.email,
            password: payload.password,
            name: payload.name,
            role: "producer",
            producerDetails: {
                nomeIniciativa: payload.name,
                nomeResponsavel: payload.responsible,
                cnpj: payload.cnpj,
                localidade: payload.address,
                categoriaOfertada:
                    toCreateProducerBody(payload).categoriaOfertada,
                formasPagamento: [...payload.paymentMethods],
                telefone: payload.phone,
            },
        });
    },
});

// POST /users/producers (corpo montado em registerApi.ts)  ->  201
//   400 dados inválidos | 403 pessoa banida | 409 CPF/CNPJ ou e-mail já cadastrado
//   429 muitas tentativas
export async function registerProducer(
    payload: RegisterPayload,
): Promise<RegisterResult> {
    if (isMockAuthEnabled) return mockService.register(payload);
    return submitRegistration(
        "/users/producers",
        toCreateProducerBody(payload),
    );
}

export async function checkProducerIdentity(
    payload: RegisterPayload,
    signal?: AbortSignal,
): Promise<RegisterResult> {
    if (isMockAuthEnabled) return mockService.checkIdentity(payload);
    return submitRegistration(
        "/users/producers/check-identity",
        {
            cpf: payload.document,
            cnpj: payload.cnpj,
            email: payload.email,
        },
        signal,
    );
}

async function submitRegistration(
    path: string,
    body: object,
    signal?: AbortSignal,
): Promise<RegisterResult> {
    try {
        await getApiClient().post<unknown>(path, body, { auth: false, signal });
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
            if (error.status === 403)
                return { ok: false, reason: "blocked", message: error.message };
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

    function checkIdentity(payload: RegisterPayload): RegisterResult {
        if (
            directory?.hasDocument(payload.document) ||
            accounts.some((account) => account.document === payload.document)
        ) {
            return { ok: false, reason: "duplicate", field: "document" };
        }
        if (
            directory?.hasEmail?.(payload.email) ||
            accounts.some((account) => account.email === payload.email)
        ) {
            return { ok: false, reason: "duplicate", field: "email" };
        }
        if (
            payload.cnpj &&
            accounts.some((account) => account.cnpj === payload.cnpj)
        ) {
            return { ok: false, reason: "duplicate", field: "cnpj" };
        }
        return { ok: true };
    }

    return {
        checkIdentity,
        async register(payload: RegisterPayload): Promise<RegisterResult> {
            const result = checkIdentity(payload);
            if (!result.ok) return result;
            accounts.push(payload);
            directory?.add(payload);
            return { ok: true };
        },
    };
}
