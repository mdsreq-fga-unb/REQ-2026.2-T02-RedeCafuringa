import {
    cleanup,
    fireEvent,
    render,
    screen,
    waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "@/app/App";
import { login } from "@/features/auth/authService";

vi.mock("@/features/auth/authService");
vi.mock("@/features/offers/productDetailsService", () => ({
    getProductDetails: vi.fn().mockResolvedValue({
        id: "mel",
        name: "Mel do Cerrado",
        producerId: "demo-maria",
        producerName: "Dona Maria",
        price: 32,
        unit: "unidade",
        image: "/folha-logo.svg",
        description: "Mel produzido no território da Cafuringa.",
    }),
}));
// Com a API real, experiências vêm de GET /experiences/{id} (HU21), não da
// lista fictícia da demonstração.
vi.mock("@/features/offers/catalogItems", async (original) => ({
    ...(await original<typeof import("@/features/offers/catalogItems")>()),
    getExperienceDetails: vi.fn().mockResolvedValue({
        id: "queijos",
        name: "Visita e Degustação de Queijos",
        category: "Experiências",
        producerId: "demo-maria",
        producerName: "Dona Maria",
        price: 45,
        unit: "pessoa",
        image: "/folha-logo.svg",
        description: "Visita guiada com degustação.",
    }),
}));
vi.mock("@/features/trajectory/trajectoryService", async (original) => ({
    ...(await original<
        typeof import("@/features/trajectory/trajectoryService")
    >()),
    getPublicTrajectory: vi.fn().mockResolvedValue({
        id: "demo-maria",
        nomeIniciativa: "Dona Maria",
        telefone: "61999999999",
    }),
}));

async function signInAsConsumer() {
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText("E-mail"), "ana@exemplo.com");
    await user.type(screen.getByLabelText("Senha"), "senha123");
    await user.click(screen.getByRole("button", { name: "Entrar" }));
}

beforeEach(() => {
    vi.mocked(login).mockResolvedValue({
        token: "token-falso",
        user: { id: 1, name: "Gabriela", role: "consumer" },
    });
    localStorage.clear();
    window.location.hash = "#/perfil";
});

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    localStorage.clear();
    window.location.hash = "";
});

describe("fluxo de contato da aplicação", () => {
    it("CA04: com a API real, o perfil de demonstração não usa o contato salvo no aparelho", () => {
        localStorage.setItem(
            "cafuringa-contact",
            JSON.stringify({
                whatsappNumber: "5561999999999",
                authorized: true,
            }),
        );
        render(<App />);

        expect(
            screen.queryByRole("link", { name: /Conversar pelo WhatsApp/ }),
        ).toBeNull();
        expect(
            screen.queryByRole("button", { name: /Conversar pelo WhatsApp/ }),
        ).toBeNull();
    });

    it.each([
        { route: "#/oferta/mel", subject: "produto/mel" },
        {
            route: "#/oferta/queijos?tipo=experiencia",
            subject: "experiencia/queijos",
        },
    ])(
        "RN17: visitante que toca no contato da oferta $subject vai ao login",
        async ({ route, subject }) => {
            window.location.hash = route;
            render(<App />);

            fireEvent.click(
                await screen.findByRole("button", {
                    name: /Conversar pelo WhatsApp/,
                }),
            );

            await waitFor(() =>
                expect(window.location.hash).toBe(
                    "#/entrar?contato=" + encodeURIComponent(subject),
                ),
            );
        },
    );

    it.each([
        { route: "#/oferta/mel", title: "Mel do Cerrado" },
        {
            route: "#/oferta/queijos?tipo=experiencia",
            title: "Visita e Degustação de Queijos",
        },
    ])(
        "RN17: consumidor autenticado abre o WhatsApp da oferta $title, sem conversa no app",
        async ({ route, title }) => {
            localStorage.setItem("cafuringa-token", "token-falso");
            localStorage.setItem("cafuringa-role", "consumer");
            window.location.hash = route;
            render(<App />);

            const link = await screen.findByRole("link", {
                name: /Conversar pelo WhatsApp/,
            });
            const contactUrl = new URL(link.getAttribute("href") ?? "");
            expect(contactUrl.origin + contactUrl.pathname).toBe(
                "https://wa.me/5561999999999",
            );
            expect(contactUrl.searchParams.get("text")).toContain(title);
            expect(link.getAttribute("target")).toBe("_blank");
            expect(link.getAttribute("rel")).toBe("noopener noreferrer");

            fireEvent.click(link);

            expect(window.location.hash).toBe(route);
            expect(screen.getByRole("heading", { name: title })).toBeTruthy();
            expect(localStorage.getItem("cafuringa-conversations")).toBeNull();
        },
    );

    it.each([
        ["produto/mel", "#/oferta/mel", "Mel do Cerrado"],
        [
            "experiencia/queijos",
            "#/oferta/queijos?tipo=experiencia",
            "Visita e Degustação de Queijos",
        ],
    ])(
        "login vindo de um pedido de contato (%s) volta para a oferta",
        async (subject, expectedHash, title) => {
            window.location.hash =
                "#/entrar?contato=" + encodeURIComponent(subject);
            render(<App />);

            await signInAsConsumer();

            await waitFor(() =>
                expect(window.location.hash).toBe(expectedHash),
            );
            expect(
                await screen.findByRole("heading", { name: title }),
            ).toBeTruthy();
        },
    );

    it("login vindo do contato de um perfil volta para o perfil público", async () => {
        window.location.hash = "#/entrar?contato=produtor%2Fdemo-maria";
        render(<App />);

        await signInAsConsumer();

        await waitFor(() =>
            expect(window.location.hash).toBe("#/produtor/demo-maria"),
        );
    });
});

describe("entrada e acesso público", () => {
    it("abre Explorar como página inicial e permite navegar como visitante", async () => {
        const user = userEvent.setup();
        window.location.hash = "";
        render(<App />);

        expect(
            await screen.findByRole("heading", {
                name: "Conheça nossos produtores",
            }),
        ).toBeTruthy();
        expect(
            screen.queryByRole("heading", { name: "Dona Maria" }),
        ).toBeNull();
        expect(
            screen.queryByRole("heading", { name: "Entre em sua conta" }),
        ).toBeNull();

        await user.click(
            screen.getByRole("button", { name: "Cafuringa, início" }),
        );
        expect(
            await screen.findByRole("heading", {
                name: "Conheça nossos produtores",
            }),
        ).toBeTruthy();
        await user.click(
            screen.getByRole("button", {
                name: "Produtos Alimentos artesanais e muito mais.",
            }),
        );
        expect(
            screen
                .getByRole("button", {
                    name: "Produtos Alimentos artesanais e muito mais.",
                })
                .getAttribute("aria-pressed"),
        ).toBe("true");
    });

    it.each(["Notificações", "Pré-reservas"])(
        "pede seleção de perfil ao visitante que abre %s",
        async (tab) => {
            const user = userEvent.setup();
            render(<App />);

            await user.click(screen.getByRole("button", { name: tab }));

            expect(
                await screen.findByRole("heading", {
                    name: "Entre em sua conta",
                }),
            ).toBeTruthy();
        },
    );
});
