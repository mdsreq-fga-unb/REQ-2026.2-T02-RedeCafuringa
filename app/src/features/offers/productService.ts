import { ApiHttpError, getApiClient, type ApiClient } from "@/shared/api";
import { isMockAuthEnabled } from "@/features/auth/authMode";
import { prepareProfilePhoto } from "@/features/trajectory/photoResize";
import { toProductList } from "./productAdapter";
import type { ApiProduct, Product } from "./productTypes";
import { listMockProducts } from "./mockProductService";

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
    /** Presente nas respostas da API (RN10); as rotas públicas só trazem disponíveis. */
    disponivel?: boolean;
};

/**
 * Limite do backend (POST /products, PHOTO_GALLERY_POLICIES.produto): até 10
 * fotos, de até 5 MB cada após o preparo. A primeira é a capa.
 */
export const PRODUCT_PHOTOS_MAX = 10;

/**
 * HU15: cadastra o produto na API (`POST /products`, multipart).
 * `idempotencyKey` deve ser a mesma em todas as tentativas do mesmo
 * preenchimento: reenviar após uma queda de conexão não duplica o produto (CA07).
 */
export async function registerProduct(
    draft: ProductDraft,
    { idempotencyKey }: { idempotencyKey?: string } = {},
) {
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
    // RNF06/RNF11: reduz cada foto no aparelho e descarta o EXIF/GPS antes de
    // enviar (mesmo preparo da foto de perfil). Uma de cada vez, para poupar memória.
    for (const foto of draft.fotos)
        body.append("fotos", await prepareProfilePhoto(foto));
    return getApiClient().post<RegisteredProduct>("/products", body, {
        headers: {
            Authorization: `Bearer ${token}`,
            ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
        },
    });
}

export function listProducts(): Promise<Product[]> {
    return isMockAuthEnabled ? listMockProducts() : fetchProducts();
}

export async function fetchProducts(
    client: ApiClient = getApiClient(),
): Promise<Product[]> {
    const items = await client.get<ApiProduct[]>("/products", {
        auth: false,
    });
    return toProductList(items);
}
