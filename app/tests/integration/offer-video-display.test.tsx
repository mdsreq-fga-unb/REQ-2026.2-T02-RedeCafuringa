import { cleanup, render, screen } from "@testing-library/react";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProductOfferDetails } from "@/features/offers/ProductOfferDetails";
import { PublicTrajectoryPage } from "@/features/trajectory/PublicTrajectoryPage";

vi.mock("@/features/auth/authMode", () => ({ isMockAuthEnabled: false }));

const ID = "dQw4w9WgXcQ";
const EMBED = `https://www.youtube-nocookie.com/embed/${ID}`;

const producer = { id: "produtor-video", nomeIniciativa: "Horta da Maria" };

const product = {
    id: "produto-video",
    nome: "Mel do Cerrado",
    categoria: "Produtos",
    descricao: "Mel produzido no território da Cafuringa.",
    precoPorUnidade: 32,
    gramasPorUnidade: 500,
    fotos: ["/products/produto-video/photos/1"],
    produtor: producer,
    disponivel: true,
};

const experience = {
    id: "experiencia-video",
    nome: "Visita ao sítio",
    categoria: "Experiência",
    descricao: "Caminhada e degustação.",
    valorPorPessoa: 45,
    local: "Sítio Raízes",
    duracao: "2 horas",
    fotos: ["/experiences/experiencia-video/photos/1"],
    produtor: producer,
    disponivel: true,
};

const trajectory = {
    id: producer.id,
    nomeIniciativa: producer.nomeIniciativa,
    categoriaOfertada: "Produtos",
    trajetoria: "Começamos em 1990.",
    atividades: "Visitas guiadas.",
};

const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
        status,
        headers: { "content-type": "application/json" },
    });

function api(videoId?: string) {
    const extra = videoId ? { videoId } : {};
    vi.stubGlobal(
        "fetch",
        vi.fn<typeof fetch>().mockImplementation(async (input) => {
            const path = new URL(String(input), "http://localhost").pathname;
            if (path === `/api/v1/products/${product.id}`)
                return json({ ...product, ...extra });
            if (path === `/api/v1/experiences/${experience.id}`)
                return json({ ...experience, ...extra });
            if (path === `/api/v1/producers/${producer.id}/trajectory`)
                return json({ ...trajectory, ...extra });
            return json({ message: "Not found" }, 404);
        }),
    );
}

beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
});

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

const videoHeading = () => screen.queryByRole("heading", { name: "Vídeo" });

describe("exibição do vídeo do YouTube", () => {
    it("detalhe do produto mostra o vídeo cadastrado", async () => {
        api(ID);
        render(<ProductOfferDetails id={product.id} onNavigate={vi.fn()} />);

        expect(
            (await screen.findByTitle("Vídeo: Mel do Cerrado")).getAttribute(
                "src",
            ),
        ).toBe(EMBED);
        expect(videoHeading()).toBeTruthy();
    });

    it("detalhe do produto sem vídeo não mostra a seção", async () => {
        api();
        render(<ProductOfferDetails id={product.id} onNavigate={vi.fn()} />);

        await screen.findByRole("heading", {
            level: 1,
            name: "Mel do Cerrado",
        });
        expect(videoHeading()).toBeNull();
        expect(document.querySelector("iframe")).toBeNull();
    });

    it("detalhe da experiência mostra o vídeo cadastrado", async () => {
        api(ID);
        render(
            <ProductOfferDetails
                id={experience.id}
                experience
                onNavigate={vi.fn()}
            />,
        );

        expect(
            (await screen.findByTitle("Vídeo: Visita ao sítio")).getAttribute(
                "src",
            ),
        ).toBe(EMBED);
    });

    it("perfil público mostra o vídeo da trajetória", async () => {
        api(ID);
        render(<PublicTrajectoryPage id={producer.id} onNavigate={vi.fn()} />);

        expect(
            (await screen.findByTitle("Vídeo: Horta da Maria")).getAttribute(
                "src",
            ),
        ).toBe(EMBED);
        expect(videoHeading()).toBeTruthy();
    });

    it("perfil público sem vídeo não mostra a seção", async () => {
        api();
        render(<PublicTrajectoryPage id={producer.id} onNavigate={vi.fn()} />);

        await screen.findByRole("heading", { name: "Minha Trajetória" });
        expect(videoHeading()).toBeNull();
    });

    it("id fora do formato vindo da API não vira embed", async () => {
        api("../../evil");
        render(<ProductOfferDetails id={product.id} onNavigate={vi.fn()} />);

        await screen.findByRole("heading", {
            level: 1,
            name: "Mel do Cerrado",
        });
        expect(videoHeading()).toBeNull();
        expect(document.querySelector("iframe")).toBeNull();
    });

    it("RNF04: detalhe com vídeo sem violações WCAG A/AA", async () => {
        api(ID);
        const { container } = render(
            <ProductOfferDetails id={product.id} onNavigate={vi.fn()} />,
        );
        await screen.findByTitle("Vídeo: Mel do Cerrado");

        const report = await axe.run(container, {
            iframes: false,
            runOnly: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
            rules: { "color-contrast": { enabled: false } },
        });

        expect(report.violations).toEqual([]);
    });
});
