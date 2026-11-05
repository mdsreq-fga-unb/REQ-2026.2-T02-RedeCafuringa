import type { RegisterPayload } from "./registerForm";

export type CreateProducerBody = {
    nome: string;
    cpf?: string;
    cnpj?: string;
    telefone: string;
    email: string;
    endereco: string;
    senha: string;
};

export function toCreateProducerBody(
    payload: RegisterPayload,
): CreateProducerBody {
    const { document } = payload;
    return {
        nome: payload.name,
        ...(document.length === 14 ? { cnpj: document } : { cpf: document }),
        telefone: payload.phone,
        email: payload.email,
        endereco: payload.address,
        senha: payload.password,
    };
}
