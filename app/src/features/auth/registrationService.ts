import { ApiHttpError, getApiClient } from "../../shared/api";
import { isMockAuthEnabled } from "./authMode";
import { toIsoBirthDate } from "./birthDate";
import { registerMockAdmin, registerMockConsumer } from "./mockAuth";

export type AdminSignupData = { email: string; senha: string };

const notAuthorized =
    "Entre com uma conta autorizada para cadastrar administradores.";

/**
 * HU03: só um administrador autenticado cadastra outro (RN03). A autorização
 * definitiva é do backend (POST /users/admins, 401/403); aqui só traduzimos erros.
 */
export async function registerAdmin(data: AdminSignupData): Promise<void> {
    const email = data.email.trim().toLowerCase();
    if (isMockAuthEnabled) {
        await registerMockAdmin({ email, senha: data.senha });
        return;
    }
    const token = localStorage.getItem("cafuringa-token");
    if (!token) throw new Error(notAuthorized);
    try {
        await getApiClient().post<unknown>(
            "/users/admins",
            { email, senha: data.senha },
            { headers: { Authorization: `Bearer ${token}` } },
        );
    } catch (error) {
        if (error instanceof ApiHttpError) {
            if (error.status === 409)
                throw new Error("E-mail já cadastrado", { cause: error });
            if (error.status === 401 || error.status === 403)
                throw new Error(notAuthorized, { cause: error });
            if (error.status === 400) {
                const detail = error.details.length
                    ? error.details.join(" ")
                    : error.message;
                throw new Error(detail, { cause: error });
            }
        }
        throw new Error("Falha na conexão. Tente novamente.", {
            cause: error,
        });
    }
}

export type ConsumerSignupData = {
    nome: string;
    cpf: string;
    email: string;
    /** DD-MM-AAAA, como digitado no formulário. */
    dataNascimento: string;
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
                dataNascimento: toIsoBirthDate(data.dataNascimento),
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
