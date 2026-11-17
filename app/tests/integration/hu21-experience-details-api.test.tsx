import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { ProductOfferDetails } from "@/features/offers/ProductOfferDetails";

vi.mock("@/features/auth/authMode", () => ({ isMockAuthEnabled: false }));

const experience = {
    id: "64b0c0ffee0000000000e001",
    nome: "Trilha guiada da nascente",
    categoria: "Experiência",
    descricao: "Caminhada de 3 km até a nascente, com café da roça.",
    valorPorPessoa: 45.5,
    local: "Núcleo Rural Cafuringa",
    duracao: "2 horas",
    fotos: ["/experiences/64b0c0ffee0000000000e001/photos/f1?v=v1"],
    produtor: {
        id: "produtor-hu21",
        nomeIniciativa: "Sítio Boa Vista",
        localidade: "Fazenda Boa Vista",
    },
    criadoEm: "2026-11-16T12:00:00.000Z",
    disponivel: true,
};
const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
        status,
        headers: { "content-type": "application/json" },
    });

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

function api(detail: () => Response = () => json(experience)) {
    const fetch = vi
        .fn<typeof globalThis.fetch>()
        .mockImplementation(async (input) => {
            const path = new URL(String(input), "http://localhost").pathname;
            if (path === `/api/v1/experiences/${experience.id}`)
                return detail();
            if (path === "/api/v1/producers/produtor-hu21/trajectory")
                return json({ id: "produtor-hu21", nomeIniciativa: "x" });
            return json({ message: "Not found" }, 404);
        });
    vi.stubGlobal("fetch", fetch);
    return fetch;
}

const open = () =>
    render(
        <ProductOfferDetails
            id={experience.id}
            experience
            backPath="/experiencias"
            onNavigate={vi.fn()}
        />,
    );

it("CA08: detalhe vem de GET /experiences/{id} e identifica o responsável", async () => {
    const fetch = api();
    open();
    expect(
        await screen.findByRole("heading", { name: experience.nome }),
    ).toBeTruthy();
    // Protótipo: o responsável aparece como Anfitrião (CA08), com Duração e Local.
    expect(screen.getByText("Anfitrião: Sítio Boa Vista")).toBeTruthy();
    expect(screen.getByText("Local: Núcleo Rural Cafuringa")).toBeTruthy();
    expect(screen.getByText("Duração: 2 horas")).toBeTruthy();
    expect(screen.getByText(/R\$\s?45,50/)).toBeTruthy();
    // Não percorre o catálogo inteiro para achar uma experiência.
    expect(
        fetch.mock.calls.some(
            ([url]) =>
                new URL(String(url), "http://localhost").pathname ===
                "/api/v1/experiences",
        ),
    ).toBe(false);
});

it("experiência inexistente ou indisponível (404) informa que não foi encontrada", async () => {
    api(() => json({ message: "Experiência não encontrada" }, 404));
    open();
    expect((await screen.findByRole("alert")).textContent).toMatch(
        /não encontrad|indisponível/i,
    );
    expect(screen.queryByRole("heading", { name: experience.nome })).toBeNull();
});
