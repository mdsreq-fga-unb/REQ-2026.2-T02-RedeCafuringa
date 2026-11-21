import { describe, expect, it, vi } from "vitest";
import { ApiHttpError, apiResourceUrl, createApiClient } from "@/shared/api";
import { searchOffers } from "@/features/search/searchService";

const maria = {
    id: "p1",
    nomeIniciativa: "Dona Maria",
    categoriaOfertada: "Produtos e Experiências",
    trajetoria: "Plantamos café há 20 anos.",
};

const cafe = {
    id: "cafe",
    nome: "Café torrado",
    categoria: "Produtos",
    descricao: "Grãos da safra.",
    precoPorUnidade: 32,
    gramasPorUnidade: 250,
    fotos: ["/products/cafe/photos/f1?v=a"],
    produtor: { id: "p1", nomeIniciativa: "Dona Maria", localidade: "Núcleo" },
    criadoEm: "2026-11-13T12:00:00.000Z",
    disponivel: true,
};

const trilha = {
    id: "trilha",
    nome: "Trilha do café",
    categoria: "Experiência",
    descricao: "Caminhada até a nascente.",
    valorPorPessoa: 45.5,
    local: "Sítio Boa Vista",
    duracao: "2 horas",
    fotos: [],
    produtor: { id: "p1", nomeIniciativa: "Dona Maria" },
    criadoEm: "2026-11-13T12:00:00.000Z",
    disponivel: true,
};

const resposta = {
    termo: "cafe",
    produtores: { itens: [maria], total: 1 },
    produtos: { itens: [cafe], total: 1 },
    experiencias: { itens: [trilha], total: 1 },
};

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

describe("HU36 — searchOffers (API real)", () => {
    it("consulta GET /search com o termo codificado", async () => {
        const { client, fetchMock } = setup(jsonResponse(resposta));

        await searchOffers("café & mel", { client });

        const [url, init] = fetchMock.mock.calls[0];
        const parsed = new URL(String(url));
        expect(parsed.origin + parsed.pathname).toBe("http://api.test/search");
        expect(parsed.searchParams.get("busca")).toBe("café & mel");
        expect(init?.method).toBe("GET");
    });

    it("CA09: busca sem enviar o token de acesso", async () => {
        const { client, fetchMock } = setup(jsonResponse(resposta));

        await searchOffers("cafe", { client });

        const headers = fetchMock.mock.calls[0][1]?.headers as Record<
            string,
            string
        >;
        expect(headers.Authorization).toBeUndefined();
    });

    it("CA03, CA04: devolve produtores, produtos e experiências prontos para a tela", async () => {
        const { client } = setup(jsonResponse(resposta));

        const result = await searchOffers("cafe", { client });

        expect(result.termo).toBe("cafe");
        expect(result.produtores).toEqual({ itens: [maria], total: 1 });
        expect(result.produtos.total).toBe(1);
        expect(result.produtos.itens[0]).toMatchObject({
            id: "cafe",
            name: "Café torrado",
            producerName: "Dona Maria",
            producerLocation: "Núcleo",
            price: 32,
            unit: "unidade",
            image: apiResourceUrl("/products/cafe/photos/f1?v=a"),
        });
        expect(result.experiencias.total).toBe(1);
        expect(result.experiencias.itens[0]).toMatchObject({
            id: "trilha",
            name: "Trilha do café",
            category: "Experiências",
            unit: "pessoa",
            local: "Sítio Boa Vista",
            duracao: "2 horas",
        });
    });

    it("CA06: grupos vazios continuam vazios", async () => {
        const vazio = { itens: [], total: 0 };
        const { client } = setup(
            jsonResponse({
                termo: "xyz",
                produtores: vazio,
                produtos: vazio,
                experiencias: vazio,
            }),
        );

        await expect(searchOffers("xyz", { client })).resolves.toEqual({
            termo: "xyz",
            produtores: vazio,
            produtos: vazio,
            experiencias: vazio,
        });
    });

    it("CA08: repassa as orientações do 400 do servidor", async () => {
        const { client } = setup(
            jsonResponse(
                {
                    statusCode: 400,
                    message: ["Digite pelo menos 2 caracteres para buscar."],
                    error: "Bad Request",
                },
                400,
            ),
        );

        const error = await searchOffers("a", { client }).catch(
            (e: unknown) => e,
        );

        expect(error).toBeInstanceOf(ApiHttpError);
        expect((error as ApiHttpError).details).toEqual([
            "Digite pelo menos 2 caracteres para buscar.",
        ]);
    });

    it("propaga falhas de conexão para a tela tratar", async () => {
        const { client } = setup(
            jsonResponse({ statusCode: 500, message: "Erro interno" }, 500),
        );

        await expect(searchOffers("cafe", { client })).rejects.toBeInstanceOf(
            ApiHttpError,
        );
    });
});
