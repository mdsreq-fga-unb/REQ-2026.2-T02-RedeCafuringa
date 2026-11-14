import {
    cleanup,
    fireEvent,
    render,
    screen,
    waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import axe from "axe-core";
import { ProductOfferDetails } from "@/features/offers/ProductOfferDetails";

vi.mock("@/features/auth/authMode", () => ({ isMockAuthEnabled: false }));
const product = {
    id: "produto-hu20",
    nome: "Mel do Cerrado",
    categoria: "Produtos",
    descricao:
        "Mel produzido no território da Cafuringa. Consulte disponibilidade e formas de retirada diretamente com o produtor.",
    precoPorUnidade: 32.5,
    gramasPorUnidade: 500,
    fotos: [
        "/products/produto-hu20/photos/1",
        "/products/produto-hu20/photos/2",
    ],
    produtor: {
        id: "produtor-hu20",
        nomeIniciativa: "Dona Maria",
        cpf: "CPF-PRIVADO",
        email: "privado@example.com",
    },
    disponivel: true,
};
const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
        status,
        headers: { "content-type": "application/json" },
    });
beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
});
afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});
function api(
    save: () => Response | Promise<Response> = () => json(product),
    phone?: string,
) {
    const fetch = vi
        .fn<typeof globalThis.fetch>()
        .mockImplementation(async (input) => {
            const path = new URL(String(input), "http://localhost").pathname;
            if (path === "/api/v1/products/produto-hu20") return save();
            if (path === "/api/v1/producers/produtor-hu20/trajectory")
                return json({
                    id: "produtor-hu20",
                    nomeIniciativa: "Dona Maria",
                    ...(phone ? { telefone: phone } : {}),
                });
            return json({ message: "Not found" }, 404);
        });
    vi.stubGlobal("fetch", fetch);
    return fetch;
}
const open = (consumer = false) =>
    render(
        <ProductOfferDetails
            id={product.id}
            consumer={consumer}
            backPath="/explorar"
            onNavigate={vi.fn()}
        />,
    );

it("CA01–CA05/CA07: consulta individual pública com descrição, preço, peso, responsável e sem dados privados", async () => {
    const fetch = api();
    localStorage.setItem("cafuringa-token", "nao-enviar");
    const { container } = open();
    expect(
        await screen.findByRole("heading", { name: product.nome }),
    ).toBeTruthy();
    expect(screen.getByText(product.descricao)).toBeTruthy();
    expect(screen.getByText("R$ 32,50 / unidade")).toBeTruthy();
    expect(screen.getByText("500 g por unidade")).toBeTruthy();
    expect(screen.getByText("Produtor: Dona Maria")).toBeTruthy();
    expect(container.textContent).not.toMatch(
        /CPF-PRIVADO|privado@example.com/,
    );
    expect(
        fetch.mock.calls.some(([url]) =>
            String(url).endsWith("/products/produto-hu20"),
        ),
    ).toBe(true);
    for (const [, init] of fetch.mock.calls)
        expect(new Headers(init?.headers).has("Authorization")).toBe(false);
});

it.each([404, 410])(
    "CA06/CA08: HTTP %s não apresenta oferta ativa",
    async (status) => {
        api(() => json({ message: "Indisponível" }, status));
        open();
        expect((await screen.findByRole("alert")).textContent).toMatch(
            /não encontrad|indisponível/i,
        );
        expect(
            screen.queryByRole("heading", { name: product.nome }),
        ).toBeNull();
        expect(screen.queryByText("Conhecer a Cafuringa Store")).toBeNull();
    },
);

it("CA06: resposta com disponivel=false não exibe detalhes nem ações", async () => {
    api(() => json({ ...product, disponivel: false }));
    open();
    expect((await screen.findByRole("alert")).textContent).toMatch(
        /indisponível/i,
    );
    expect(screen.queryByText(product.descricao)).toBeNull();
});

it("CA09: informa falha, permite tentar novamente e mantém Voltar", async () => {
    let calls = 0;
    api(() =>
        ++calls === 1 ? json({ message: "Falha" }, 500) : json(product),
    );
    open();
    expect((await screen.findByRole("alert")).textContent).toMatch(
        /não foi possível/i,
    );
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(
        await screen.findByRole("heading", { name: product.nome }),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Voltar" })).toBeTruthy();
});

it("exibe carregamento enquanto aguarda a consulta individual", () => {
    api(() => new Promise(() => {}));
    open();
    expect(screen.getByRole("status").textContent).toMatch(/carregando/i);
});

it("permite selecionar as fotos e usa o endereço real da Cafuringa Store", async () => {
    api();
    open();
    await screen.findByRole("heading", { name: product.nome });
    fireEvent.click(screen.getByRole("button", { name: /Ver foto 2/i }));
    expect(
        screen.getByRole("img", { name: product.nome }).getAttribute("src"),
    ).toContain("/photos/2");
    const store = screen.getByRole("link", {
        name: "Conhecer a Cafuringa Store",
    });
    expect(store.getAttribute("href")).toBe("https://cafuringa.store/");
    expect(store.getAttribute("rel")).toMatch(/noopener/);
});

it("privacidade: não usa o telefone salvo na conta local para o produto de outro produtor", async () => {
    api();
    localStorage.setItem(
        "cafuringa-contact",
        JSON.stringify({ authorized: true, whatsappNumber: "5561999999999" }),
    );
    open(true);
    await screen.findByRole("heading", { name: product.nome });
    await waitFor(() =>
        expect(
            screen.queryByRole("button", { name: "Conversar pelo WhatsApp" }),
        ).toBeNull(),
    );
});

it("contato autorizado vem do perfil público do responsável", async () => {
    api(undefined, "61988887777");
    const external = vi.spyOn(window, "open").mockReturnValue(null);
    open(true);
    fireEvent.click(
        await screen.findByRole("button", { name: "Conversar pelo WhatsApp" }),
    );
    expect(external).toHaveBeenCalledWith(
        expect.stringContaining("https://wa.me/5561988887777"),
        "_blank",
        "noopener,noreferrer",
    );
});

it("RNF04: detalhes sem violações WCAG A/AA detectáveis pelo axe", async () => {
    api();
    const { container } = open();
    await screen.findByRole("heading", { name: product.nome });
    const result = await axe.run(container, {
        runOnly: {
            type: "tag",
            values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
        },
        rules: { "color-contrast": { enabled: false } },
    });
    expect(result.violations.map((item) => item.id)).toEqual([]);
});
