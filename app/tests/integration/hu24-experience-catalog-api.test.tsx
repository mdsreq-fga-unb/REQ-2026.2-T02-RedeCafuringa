import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { App } from "@/app/App";

vi.mock("@/features/auth/authMode", () => ({ isMockAuthEnabled: false }));

const CATALOG = "/api/v1/experiences";

const item = (
    id: string,
    nome: string,
    extra: Record<string, unknown> = {},
) => ({
    id,
    nome,
    categoria: "Experiência",
    descricao: "Caminhe pelo sítio e prove sabores da estação.",
    valorPorPessoa: 45,
    local: "Cafuringa, DF",
    duracao: "2 horas",
    fotos: [`/experiences/${id}/photos/f1?v=v1`],
    produtor: { id: "produtor-1", nomeIniciativa: "Jefferson Sooma" },
    criadoEm: "2026-11-16T12:00:00.000Z",
    disponivel: true,
    ...extra,
});

const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
        status,
        headers: { "content-type": "application/json" },
    });
const page = (itens: unknown[]) =>
    json({ itens, total: itens.length, pagina: 1, limite: 50 });

/** API simulada: o catálogo devolve o que `catalog()` tiver no momento. */
function api(catalog: () => unknown[]) {
    const fetch = vi
        .fn<typeof globalThis.fetch>()
        .mockImplementation(async (input) => {
            const path = new URL(String(input), "http://localhost").pathname;
            if (path === CATALOG) return page(catalog());
            const detail = catalog().find(
                (entry) =>
                    path === `${CATALOG}/${(entry as { id: string }).id}`,
            );
            if (detail) return json(detail);
            return json({ message: "Not found" }, 404);
        });
    vi.stubGlobal("fetch", fetch);
    return fetch;
}

const catalogCalls = (fetch: ReturnType<typeof api>) =>
    fetch.mock.calls.filter(
        ([url]) =>
            new URL(String(url), "http://localhost").pathname === CATALOG,
    );

function openCatalog() {
    window.location.hash = "#/experiencias";
    return render(<App />);
}

beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.hash = "";
});
afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    localStorage.clear();
    sessionStorage.clear();
});

it("CA01, CA02, CA07: visitante vê o catálogo vindo da API pública", async () => {
    const fetch = api(() => [
        item("e1", "Visita e Degustação de Queijos"),
        item("e2", "Manhã de Agroecologia", {
            valorPorPessoa: 35,
            produtor: { id: "p2", nomeIniciativa: "Sítio Raízes" },
        }),
    ]);
    openCatalog();

    const cards = await screen.findAllByRole("listitem");
    expect(cards).toHaveLength(2);
    expect(within(cards[0]).getByText("Jefferson Sooma")).toBeTruthy();
    expect(within(cards[1]).getByText("Sítio Raízes")).toBeTruthy();
    expect(within(cards[1]).getByText("R$ 35 / pessoa")).toBeTruthy();
    // Consulta pública: sem token na requisição.
    const [, init] = catalogCalls(fetch)[0];
    expect(new Headers(init?.headers).has("authorization")).toBe(false);
});

it("CA03: indisponível vinda por engano na resposta não aparece", async () => {
    api(() => [
        item("e1", "Disponível"),
        item("e2", "Retirada da oferta", { disponivel: false }),
    ]);
    openCatalog();

    await screen.findByText("Disponível");
    expect(screen.queryByText("Retirada da oferta")).toBeNull();
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
});

it("CA04: sem experiências disponíveis, informa o catálogo vazio", async () => {
    api(() => []);
    openCatalog();

    expect(
        await screen.findByText("Não há experiências disponíveis no momento."),
    ).toBeTruthy();
});

it("CA05: selecionar a experiência abre a página de detalhes", async () => {
    api(() => [item("e1", "Visita e Degustação de Queijos")]);
    openCatalog();
    const user = userEvent.setup();

    await user.click(
        await screen.findByRole("button", { name: /Visita e Degustação/ }),
    );

    expect(window.location.hash).toBe("#/oferta/e1?tipo=experiencia");
    expect(
        await screen.findByRole("heading", {
            level: 1,
            name: "Visita e Degustação de Queijos",
        }),
    ).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Voltar" }));
    expect(window.location.hash).toBe("#/experiencias");
});

it("CA06: ao acessar de novo, mostra o que está disponível agora", async () => {
    let current = [item("e1", "Antiga")];
    const fetch = api(() => current);
    openCatalog();
    await screen.findByText("Antiga");

    current = [item("e2", "Recém-cadastrada")];
    cleanup();
    openCatalog();

    expect(await screen.findByText("Recém-cadastrada")).toBeTruthy();
    expect(screen.queryByText("Antiga")).toBeNull();
    expect(catalogCalls(fetch)).toHaveLength(2);
});

it("CA08: catálogo grande é navegável em partes", async () => {
    api(() =>
        Array.from({ length: 30 }, (_, i) => item(`e${i}`, `Atividade ${i}`)),
    );
    openCatalog();
    const user = userEvent.setup();

    await screen.findByText("Mostrando 12 de 30 experiências");
    await user.click(
        screen.getByRole("button", { name: "Mostrar mais experiências" }),
    );
    expect(screen.getAllByRole("listitem")).toHaveLength(24);
    await user.click(
        screen.getByRole("button", { name: "Mostrar mais experiências" }),
    );
    expect(screen.getAllByRole("listitem")).toHaveLength(30);
});
