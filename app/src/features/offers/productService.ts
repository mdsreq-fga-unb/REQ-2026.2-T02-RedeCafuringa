import { ApiHttpError, getApiClient } from "@/shared/api";
import { isMockAuthEnabled } from "@/features/auth/authMode";

export type ProductDraft = {
    nome: string;
    categoria: string;
    descricao: string;
    preco: string;
    gramas: string;
    fotos: File[];
};

export type RegisteredProduct = {
    id: string;
    nome: string;
    categoria: string;
    descricao: string;
    precoPorUnidade: number;
    gramasPorUnidade: number;
    fotos: string[];
    produtor: { id: string; nomeIniciativa: string };
};

// Contrato proposto nos testes HU15; a API de produtos ainda não está implementada.
export async function registerProduct(draft: ProductDraft) {
    const token = localStorage.getItem("cafuringa-token");
    if (!token || localStorage.getItem("cafuringa-role") !== "producer") {
        throw new ApiHttpError({
            status: 401,
            message:
                "Entre com seu perfil de produtor para cadastrar produtos.",
        });
    }
    if (isMockAuthEnabled) {
        const fotos = await Promise.all(
            draft.fotos.map(
                (file) =>
                    new Promise<string>((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(String(reader.result));
                        reader.onerror = () =>
                            reject(
                                new Error(
                                    "Não foi possível ler a foto selecionada.",
                                ),
                            );
                        reader.readAsDataURL(file);
                    }),
            ),
        );
        return {
            id: `demo-product-${crypto.randomUUID()}`,
            nome: draft.nome.trim(),
            categoria: draft.categoria,
            descricao: draft.descricao.trim(),
            precoPorUnidade: Number(draft.preco),
            gramasPorUnidade: Number(draft.gramas),
            fotos,
            produtor: {
                id:
                    localStorage.getItem("cafuringa-user-id") ??
                    "demo-producer",
                nomeIniciativa:
                    localStorage.getItem("cafuringa-name") ??
                    "Produtor de teste",
            },
        } satisfies RegisteredProduct;
    }
    const body = new FormData();
    body.set("nome", draft.nome.trim());
    body.set("categoria", draft.categoria);
    body.set("descricao", draft.descricao.trim());
    body.set("precoPorUnidade", String(Number(draft.preco)));
    body.set("gramasPorUnidade", String(Number(draft.gramas)));
    for (const foto of draft.fotos) body.append("fotos", foto);
    return getApiClient().post<RegisteredProduct>("/products", body, {
        headers: { Authorization: `Bearer ${token}` },
    });
}
