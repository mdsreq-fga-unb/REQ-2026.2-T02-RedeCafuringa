import { describe, expect, it, vi } from "vitest";
import { ApiHttpError, createApiClient } from "@/shared/api";
import { fetchProducts } from "@/features/offers/productService";
import type { ApiProduct } from "@/features/offers/productTypes";

const mel: ApiProduct = {
    id: "mel",
    nome: "Mel do Cerrado",
    produtor: "Dona Maria",
    preco: 32,
    unidade: "unidade",
    imagemUrl: "https://exemplo.com/mel.jpg",
    disponivel: true,
};
const retirado: ApiProduct = { ...mel, id: "retirado", disponivel: false };

function jsonResponse(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { "content-type": "application/json" },
    });
}

function setup(response: Response) {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(response);
    const client = createApiClient({
        baseUrl: "http://api.test",
        fetch: fetchMock,
        getAccessToken: () => "token-de-teste",
    });
    return { client, fetchMock };
}

describe("fetchProducts", () => {
    it("busca GET /products e devolve só os disponíveis", async () => {
        const { client, fetchMock } = setup(jsonResponse([mel, retirado]));

        const products = await fetchProducts(client);

        const [url, init] = fetchMock.mock.calls[0];
        expect(url).toBe("http://api.test/products");
        expect(init?.method).toBe("GET");
        expect(products.map((product) => product.id)).toEqual(["mel"]);
        expect(products[0]).toMatchObject({
            name: "Mel do Cerrado",
            producerName: "Dona Maria",
        });
    });

        it("consulta sem enviar o token de acesso (CA07)", async () => {
        const { client, fetchMock } = setup(jsonResponse([mel]));

        await fetchProducts(client);

        const headers = fetchMock.mock.calls[0][1]?.headers as Record<
            string,
            string
        >;
        expect(headers.Authorization).toBeUndefined();
    });

    it("propaga o erro da API para a tela tratar (CA08)", async () => {
        const { client } = setup(
            jsonResponse({ statusCode: 500, message: "Erro interno" }, 500),
        );

        await expect(fetchProducts(client)).rejects.toBeInstanceOf(
            ApiHttpError,
        );
    });
});