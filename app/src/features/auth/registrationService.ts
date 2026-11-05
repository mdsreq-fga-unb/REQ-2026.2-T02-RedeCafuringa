import { ApiHttpError, getApiClient } from "../../shared/api";
import { isMockAuthEnabled } from "./authMode";
import { registerMockConsumer } from "./mockAuth";

export type AdminSignupData = { email: string; senha: string };

/** Contrato proposto para HU03; a autorização definitiva pertence ao backend. */
export async function registerAdmin(data: AdminSignupData): Promise<void> {
    const email = data.email.trim().toLowerCase();
    if (isMockAuthEnabled) {
        const key = "cafuringa-mock-admin-emails";
        const saved: unknown = JSON.parse(localStorage.getItem(key) || "[]");
        const emails = Array.isArray(saved)
            ? saved.filter((item): item is string => typeof item === "string")
            : [];
        if (emails.includes(email)) throw new Error("E-mail já cadastrado");
        localStorage.setItem(key, JSON.stringify([...emails, email]));
        return;
    }
    const token = localStorage.getItem("cafuringa-token");
    if (!token)
        throw new Error(
            "Entre com uma conta autorizada para cadastrar administradores.",
        );
    try {
        await getApiClient().post<unknown>(
            "/users/admins",
            {
                email,
                senha: data.senha,
            },
            { headers: { Authorization: `Bearer ${token}` } },
        );
    } catch (error) {
        if (error instanceof ApiHttpError) {
            if (error.status === 409)
                throw new Error("E-mail já cadastrado", { cause: error });
            if (error.status === 401 || error.status === 403) {
                throw new Error(
                    "Entre com uma conta autorizada para cadastrar administradores.",
                    { cause: error },
                );
            }
        }
        throw new Error("Falha na conexão. Tente novamente.", { cause: error });
    }
}

export type ConsumerSignupData = {
    nome: string;
    cpf: string;
    email: string;
    senha: string;
};

export async function registerConsumer(
    data: ConsumerSignupData,
): Promise<void> {
    if (isMockAuthEnabled) {
        await registerMockConsumer(data);
        return;
    }

    try {
        await getApiClient().post<unknown>(
            "/users/consumers",
            {
                nome: data.nome.trim(),
                cpf: data.cpf.replace(/\D/g, ""),
                email: data.email.trim().toLowerCase(),
                senha: data.senha,
            },
            { auth: false },
        );
    } catch (error) {
        if (error instanceof ApiHttpError && error.status === 409) {
            const message = error.message.toLocaleLowerCase("pt-BR");
            if (message.includes("e-mail") || message.includes("email")) {
                throw new Error("E-mail já cadastrado", { cause: error });
            }
            if (message.includes("cpf")) {
                throw new Error("CPF já cadastrado", { cause: error });
            }
        }
        throw error;
    }
}
