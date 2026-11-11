import type { components } from "@/shared/api/schema";
import type { RegisterPayload } from "./registerForm";

export type CreateProducerBody = components["schemas"]["CreateProducerDto"];

/** Monta o corpo de POST /users/producers (contrato CreateProducerDto, HU02). */
export function toCreateProducerBody(
    payload: RegisterPayload,
): CreateProducerBody {
    return {
        nomeIniciativa: payload.name,
        nomeResponsavel: payload.responsible,
        cpf: payload.document,
        ...(payload.cnpj ? { cnpj: payload.cnpj } : {}),
        localidade: payload.address,
        categoriaOfertada:
            payload.category as CreateProducerBody["categoriaOfertada"],
        formasPagamento: payload.paymentMethods,
        ...(payload.phone ? { telefone: payload.phone } : {}),
        email: payload.email,
        senha: payload.password,
    };
}
