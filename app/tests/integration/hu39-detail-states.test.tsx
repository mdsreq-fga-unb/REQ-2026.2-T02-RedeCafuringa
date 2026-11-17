import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProductOfferDetails } from "@/features/offers/ProductOfferDetails";
import { PublicTrajectoryPage } from "@/features/trajectory/PublicTrajectoryPage";

vi.mock("@/features/auth/authMode", () => ({ isMockAuthEnabled: false }));

/**
 * Estados das telas que levam ao contato (HU39), apontados na validação
 * da HU24: textos de experiência, 404 sem "Tentar novamente" e o detalhe da
 * experiência como no protótipo (Anfitrião, Duração e Local, sem repetir).
 */

const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
        status,
        headers: { "content-type": "application/json" },
    });

function api(routes: Record<string, () => Response>) {
    vi.stubGlobal(
        "fetch",
        vi.fn<typeof globalThis.fetch>().mockImplementation(async (input) => {
            const path = new URL(String(input), "http://localhost").pathname;
            const route = routes[path];
            return route ? route() : json({ message: "Not found" }, 404);
        }),
    );
}

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

const experience = {
    id: "64b0c0ffee0000000000e001",
    nome: "Trilha guiada da nascente",
    categoria: "Experiência",
    descricao: "Caminhada até a nascente.",
    valorPorPessoa: 45,
    local: "Núcleo Rural Cafuringa",
    duracao: "2 horas",
    fotos: [],
    produtor: {
        id: "produtor-a",
        nomeIniciativa: "Sítio Boa Vista",
        localidade: "Núcleo Rural Cafuringa",
    },
    criadoEm: "2026-11-16T12:00:00.000Z",
    disponivel: true,
};

describe("detalhe da oferta", () => {
    it("link antigo de experiência (404) fala em experiência, não em produto", async () => {
        api({});
        render(
            <ProductOfferDetails
                id="64b0c0ffee0000000000dead"
                experience
                onNavigate={vi.fn()}
            />,
        );

        expect(
            await screen.findByRole("heading", {
                name: "Experiência indisponível",
            }),
        ).toBeTruthy();
        expect(screen.getByRole("alert").textContent).toBe(
            "Experiência não encontrada ou indisponível para consulta.",
        );
        expect(screen.queryByText(/Produto/)).toBeNull();
    });

    it("protótipo HU39/HU24: experiência mostra Anfitrião, Duração e Local, sem repetir o local", async () => {
        api({
            [`/api/v1/experiences/${experience.id}`]: () => json(experience),
        });
        render(
            <ProductOfferDetails
                id={experience.id}
                experience
                onNavigate={vi.fn()}
            />,
        );

        await screen.findByRole("heading", { name: experience.nome });
        expect(screen.getByText("Anfitrião: Sítio Boa Vista")).toBeTruthy();
        expect(screen.getByText("Duração: 2 horas")).toBeTruthy();
        expect(screen.getByText("Local: Núcleo Rural Cafuringa")).toBeTruthy();
        expect(screen.queryByText(/^Produtor:/)).toBeNull();
        expect(screen.queryByText(/^Propriedade:/)).toBeNull();
        expect(screen.getAllByText(/Núcleo Rural Cafuringa/)).toHaveLength(1);
    });
});

describe("perfil público do produtor", () => {
    it("perfil inexistente (404) não oferece Tentar novamente", async () => {
        api({});
        render(<PublicTrajectoryPage id="inexistente" onNavigate={vi.fn()} />);

        expect((await screen.findByRole("alert")).textContent).toBe(
            "Perfil indisponível ou não encontrado.",
        );
        expect(
            screen.queryByRole("button", { name: "Tentar novamente" }),
        ).toBeNull();
    });

    it("falha do servidor (5xx) mantém Tentar novamente", async () => {
        api({
            "/api/v1/producers/produtor-a/trajectory": () =>
                json({ message: "erro" }, 503),
        });
        render(<PublicTrajectoryPage id="produtor-a" onNavigate={vi.fn()} />);

        await screen.findByRole("alert");
        expect(
            screen.getByRole("button", { name: "Tentar novamente" }),
        ).toBeTruthy();
    });
});
