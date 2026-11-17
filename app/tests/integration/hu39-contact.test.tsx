import {
    cleanup,
    fireEvent,
    render,
    screen,
    waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "@/app/App";
import { login } from "@/features/auth/authService";

vi.mock("@/features/auth/authMode", () => ({ isMockAuthEnabled: false }));
vi.mock("@/features/auth/authService");

/**
 * HU39 — Disponibilizar contato direto, com a API real (sem demonstração).
 * O contato vem do perfil público do responsável, que só traz o telefone
 * quando o produtor autorizou (RN07); o app nunca usa dados locais.
 * RN17: qualquer pessoa vê a opção (CA05), mas só usuário autenticado inicia
 * o contato; o visitante vai ao login e volta para a mesma tela.
 */

const AUTHORIZED = "61988887777";
const PRIVATE = "61977776666";

const product = {
    id: "64b0c0ffee0000000000beef",
    nome: "Mel do Cerrado",
    categoria: "Produtos",
    descricao: "Mel produzido no território da Cafuringa.",
    precoPorUnidade: 32,
    gramasPorUnidade: 500,
    fotos: [],
    produtor: { id: "produtor-a", nomeIniciativa: "Sítio Raízes" },
    criadoEm: "2026-11-16T12:00:00.000Z",
    disponivel: true,
};
const experience = {
    id: "64b0c0ffee0000000000e001",
    nome: "Trilha guiada da nascente",
    categoria: "Experiência",
    descricao: "Caminhada de 3 km até a nascente.",
    valorPorPessoa: 45,
    local: "Núcleo Rural Cafuringa",
    duracao: "2 horas",
    fotos: [],
    produtor: { id: "produtor-a", nomeIniciativa: "Sítio Raízes" },
    criadoEm: "2026-11-16T12:00:00.000Z",
    disponivel: true,
};

const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
        status,
        headers: { "content-type": "application/json" },
    });

/** Perfis públicos como a API os devolve (o número privado nunca vem). */
function api(telefone?: string) {
    const fetch = vi
        .fn<typeof globalThis.fetch>()
        .mockImplementation(async (input) => {
            const path = new URL(String(input), "http://localhost").pathname;
            if (path === `/api/v1/products/${product.id}`) return json(product);
            if (path === `/api/v1/experiences/${experience.id}`)
                return json(experience);
            if (path === "/api/v1/producers/produtor-a/trajectory")
                return json({
                    id: "produtor-a",
                    nomeIniciativa: "Sítio Raízes",
                    trajetoria: "Nossa história na região.",
                    ...(telefone ? { telefone } : {}),
                });
            if (path === "/api/v1/products" || path === "/api/v1/experiences")
                return json({ itens: [], total: 0, pagina: 1, limite: 20 });
            return json({ message: "Not found" }, 404);
        });
    vi.stubGlobal("fetch", fetch);
    return fetch;
}

const CONTACT = /Conversar pelo WhatsApp/;

const pages = [
    {
        name: "produto",
        hash: `#/oferta/${product.id}`,
        heading: product.nome,
        subject: `produto/${product.id}`,
    },
    {
        name: "experiência",
        hash: `#/oferta/${experience.id}?tipo=experiencia`,
        heading: experience.nome,
        subject: `experiencia/${experience.id}`,
    },
    {
        name: "perfil do produtor",
        hash: "#/produtor/produtor-a",
        heading: "Sítio Raízes",
        subject: "produtor/produtor-a",
    },
];

function signedInAs(role: "consumer" | "producer") {
    localStorage.setItem("cafuringa-token", "token-falso");
    localStorage.setItem("cafuringa-role", role);
    localStorage.setItem("cafuringa-name", "Ana");
}

beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
});

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    localStorage.clear();
    window.location.hash = "";
});

describe("HU39 — contato direto pelo WhatsApp", () => {
    describe.each(pages)("na página de $name", ({ hash, heading, subject }) => {
        it("CA01/CA05/RN17: visitante vê a opção, mas iniciar o contato pede login (sem expor o link)", async () => {
            api(AUTHORIZED);
            window.location.hash = hash;
            const { container } = render(<App />);

            await screen.findByRole("heading", { name: heading });
            const button = await screen.findByRole("button", {
                name: CONTACT,
            });
            expect(screen.queryByRole("link", { name: CONTACT })).toBeNull();
            expect(container.innerHTML).not.toContain("wa.me");

            fireEvent.click(button);

            await waitFor(() =>
                expect(window.location.hash).toBe(
                    `#/entrar?contato=${encodeURIComponent(subject)}`,
                ),
            );
            expect(
                await screen.findByRole("heading", {
                    name: "Entre para falar com o responsável",
                }),
            ).toBeTruthy();
        });

        it.each(["consumer", "producer"] as const)(
            "CA01/CA02/RN17: autenticado como %s abre o wa.me do contato autorizado",
            async (role) => {
                api(AUTHORIZED);
                signedInAs(role);
                window.location.hash = hash;
                render(<App />);

                await screen.findByRole("heading", { name: heading });
                const link = await screen.findByRole("link", {
                    name: CONTACT,
                });
                const url = new URL(link.getAttribute("href") ?? "");

                expect(url.origin + url.pathname).toBe(
                    `https://wa.me/55${AUTHORIZED}`,
                );
                expect(url.searchParams.get("text")).toMatch(
                    /^Olá! Encontrei .+ na Rede Cafuringa/,
                );
                expect(link.getAttribute("target")).toBe("_blank");
                expect(link.getAttribute("rel")).toBe("noopener noreferrer");
                expect(window.location.hash).toBe(hash);
            },
        );

        it.each([null, "consumer"] as const)(
            "CA04/CA06: sem autorização (telefone omitido) não há opção de contato nem número no HTML (sessão: %s)",
            async (role) => {
                api();
                if (role) signedInAs(role);
                // Dado local de outro contexto nunca vira contato público.
                localStorage.setItem(
                    "cafuringa-contact",
                    JSON.stringify({
                        authorized: true,
                        whatsappNumber: PRIVATE,
                    }),
                );
                window.location.hash = hash;
                const { container } = render(<App />);

                await screen.findByRole("heading", { name: heading });
                await waitFor(() =>
                    expect(
                        vi
                            .mocked(fetch)
                            .mock.calls.some(([input]) =>
                                String(input).includes("/trajectory"),
                            ),
                    ).toBe(true),
                );
                expect(
                    screen.queryByRole("link", { name: CONTACT }),
                ).toBeNull();
                expect(
                    screen.queryByRole("button", { name: CONTACT }),
                ).toBeNull();
                expect(container.innerHTML).not.toContain(PRIVATE);
                expect(container.innerHTML).not.toContain("wa.me");
            },
        );
    });

    it("RN17: depois do login vindo do contato, volta à oferta já com o link do WhatsApp", async () => {
        api(AUTHORIZED);
        vi.mocked(login).mockResolvedValue({
            token: "token-falso",
            user: { id: 1, name: "Ana", role: "consumer" },
        });
        window.location.hash = `#/oferta/${product.id}`;
        render(<App />);

        fireEvent.click(await screen.findByRole("button", { name: CONTACT }));
        const user = userEvent.setup();
        await user.type(await screen.findByLabelText("E-mail"), "ana@ex.com");
        await user.type(screen.getByLabelText("Senha"), "senha123");
        await user.click(screen.getByRole("button", { name: "Entrar" }));

        await waitFor(() =>
            expect(window.location.hash).toBe(`#/oferta/${product.id}`),
        );
        expect(
            (await screen.findByRole("link", { name: CONTACT })).getAttribute(
                "href",
            ),
        ).toContain(`https://wa.me/55${AUTHORIZED}`);
    });

    it("CA06: telefone inválido não gera opção de contato", async () => {
        api("1234");
        signedInAs("consumer");
        window.location.hash = `#/oferta/${product.id}`;
        render(<App />);

        await screen.findByRole("heading", { name: product.nome });
        await new Promise((resolve) => setTimeout(resolve, 0));
        expect(screen.queryByRole("link", { name: CONTACT })).toBeNull();
        expect(screen.queryByRole("button", { name: CONTACT })).toBeNull();
    });

    it.each([null, "consumer"] as const)(
        "RNF04: oferta com contato sem violações WCAG A/AA detectáveis (sessão: %s)",
        async (role) => {
            api(AUTHORIZED);
            if (role) signedInAs(role);
            window.location.hash = `#/oferta/${product.id}`;
            const { container } = render(<App />);
            await screen.findByRole(role ? "link" : "button", {
                name: CONTACT,
            });

            const result = await axe.run(container, {
                runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] },
                rules: { "color-contrast": { enabled: false } },
            });
            expect(result.violations).toEqual([]);
        },
    );

    it("RN17: o conteúdo da conversa não é guardado pelo app", async () => {
        api(AUTHORIZED);
        signedInAs("consumer");
        window.location.hash = `#/oferta/${product.id}`;
        render(<App />);
        await screen.findByRole("link", { name: CONTACT });

        expect(localStorage.getItem("cafuringa-conversations")).toBeNull();
        expect(screen.queryByRole("textbox", { name: /mensagem/i })).toBeNull();
    });
});
