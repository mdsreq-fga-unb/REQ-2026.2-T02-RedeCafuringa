import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    vi.stubEnv("VITE_USE_MOCK_AUTH", "true");
});

afterEach(() => {
    localStorage.clear();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
});

describe("HU04 — diretório mock compartilhado com o cadastro", () => {
    it("preserva detalhes de um produtor cadastrado e mascara os documentos", async () => {
        const { registerProducer } =
            await import("@/features/register/registerService");
        const { listUsers, getUser } =
            await import("@/features/users/usersService");
        await expect(
            registerProducer({
                name: "Sítio Raízes",
                responsible: "Ana Júlia Bezerra",
                document: "12345678909",
                cnpj: "11222333000181",
                category: "Produtos",
                address: "Cafuringa, Brasília, DF",
                paymentMethods: ["Pix", "Dinheiro"],
                phone: "61999990000",
                email: "raizes@exemplo.com",
                password: "SenhaQueNaoPodeAparecer123",
            }),
        ).resolves.toEqual({ ok: true });
        const page = await listUsers({
            busca: "Sítio Raízes",
            perfil: "PRODUTOR",
        });
        expect(page.total).toBe(1);
        expect(page.itens[0].nome).toBe("Ana Júlia Bezerra");
        expect(page.itens[0]).not.toHaveProperty("cpf");
        const detail = await getUser(page.itens[0].id);
        expect(detail).toMatchObject({
            nomeIniciativa: "Sítio Raízes",
            nomeResponsavel: "Ana Júlia Bezerra",
            cpf: "***.456.789-**",
            cnpj: "**.222.333/0001-**",
            formasPagamento: ["Pix", "Dinheiro"],
            telefone: "61999990000",
        });
        expect(JSON.stringify(detail)).not.toMatch(
            /SenhaQueNaoPodeAparecer|password|senha|12345678909|11222333000181/,
        );
    });

    it("pagina em ordem alfabética com total independente da página", async () => {
        const { registerMockAdmin } = await import("@/features/auth/mockAuth");
        const { listUsers } = await import("@/features/users/usersService");
        for (let i = 0; i < 22; i++)
            await registerMockAdmin({
                email: `admin${i}@exemplo.com`,
                senha: "Teste12345",
            });
        const first = await listUsers({ perfil: "ADMINISTRADOR" });
        const second = await listUsers({ perfil: "ADMINISTRADOR", pagina: 2 });
        expect(first.itens).toHaveLength(20);
        expect(second.itens).toHaveLength(3);
        expect(second.total).toBe(23);
        const ids = [...first.itens, ...second.itens].map((item) => item.id);
        expect(new Set(ids).size).toBe(23);
        const all = await listUsers({});
        const names = all.itens.map((item) => item.nome);
        expect(names).toEqual(
            [...names].sort((a, b) => a.localeCompare(b, "pt-BR")),
        );
    });

    it("retorna 404 para detalhe inexistente, sem inventar uma conta", async () => {
        const { getUser } = await import("@/features/users/usersService");
        await expect(getUser("inexistente")).rejects.toMatchObject({
            status: 404,
        });
    });

    it("modo real sem sessão não envia requisições nem usa o diretório mock", async () => {
        vi.stubEnv("VITE_USE_MOCK_AUTH", "false");
        const fetchMock = vi.fn<typeof fetch>();
        vi.stubGlobal("fetch", fetchMock);
        const { listUsers, getUser } =
            await import("@/features/users/usersService");
        await expect(listUsers({})).rejects.toMatchObject({ status: 401 });
        await expect(getUser("1")).rejects.toMatchObject({ status: 401 });
        expect(fetchMock).not.toHaveBeenCalled();
    });
});
