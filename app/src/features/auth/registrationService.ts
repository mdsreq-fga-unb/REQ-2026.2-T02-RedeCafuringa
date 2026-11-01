import { ApiHttpError, getApiClient } from "../../shared/api";
import { isMockAuthEnabled } from "./authMode";
import { registerMockConsumer } from "./mockAuth";

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
