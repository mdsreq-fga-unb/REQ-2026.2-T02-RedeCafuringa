import { cleanup, render, screen, waitFor } from "@testing-library/react";
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
 * RN17: o contato autorizado abre externamente apenas para usuários autenticados.
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
    produtor: {
        id: "produtor-a",
        nomeIniciativa: "Sítio Raízes",
        primeiroNome: "Joana",
    },
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
    produtor: {
        id: "produtor-a",
        nomeIniciativa: "Sítio Raízes",
        primeiroNome: "Joana",
    },
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
    },
    {
        name: "experiência",
        hash: `#/oferta/${experience.id}?tipo=experiencia`,
        heading: experience.nome,
    },
    {
        name: "perfil do produtor",
        hash: "#/produtor/produtor-a",
        heading: "Sítio Raízes",
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
    describe.each(pages)("na página de $name", ({ hash, heading }) => {
        it("RN17: visitante consulta a página sem receber o número ou link na interface", async () => {
            const fetch = api(AUTHORIZED);
            window.location.hash = hash;
            const { container } = render(<App />);
            await screen.findByRole("heading", { name: heading });
            await waitFor(() =>
                expect(
                    fetch.mock.calls.some(([url]) =>
                        String(url).includes("/trajectory"),
                    ),
                ).toBe(true),
            );
            expect(screen.queryByRole("link", { name: CONTACT })).toBeNull();
            expect(container.innerHTML).not.toContain(AUTHORIZED);
            expect(container.innerHTML).not.toContain("wa.me");
        });

        it.each(["consumer", "producer"] as const)(
            "CA01/CA02/CA05: sessão %s abre o wa.me do contato autorizado",
            async (role) => {
                api(AUTHORIZED);
                if (role) signedInAs(role);
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
                expect(url.searchParams.get("text")).toContain(
                    `Link: ${new URL(hash, window.location.href).href}`,
                );
                if (!hash.startsWith("#/produtor/")) {
                    expect(
                        screen.getByText(
                            hash.includes("tipo=experiencia")
                                ? "Anfitriã: Joana"
                                : "Produtora: Joana",
                        ),
                    ).toBeTruthy();
                    expect(
                        screen
                            .getByRole("link", {
                                name: "Ver perfil da produtora",
                            })
                            .getAttribute("href"),
                    ).toBe("#/produtor/produtor-a");
                }
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

    it.each(pages.slice(0, 2))(
        "Voltar no login retorna à oferta de $name",
        async ({ hash, heading }) => {
            api(AUTHORIZED);
            window.location.hash = hash;
            render(<App />);
            const user = userEvent.setup();
            await user.click(
                await screen.findByRole("link", {
                    name: "Entrar para conversar",
                }),
            );
            await screen.findByLabelText("Senha");
            await user.click(screen.getByRole("button", { name: "Voltar" }));
            expect(window.location.hash).toBe(hash);
            expect(
                await screen.findByRole("heading", { name: heading }),
            ).toBeTruthy();
        },
    );

    it("um link antigo de login retorna à oferta após autenticação", async () => {
        api(AUTHORIZED);
        vi.mocked(login).mockResolvedValue({
            token: "token-falso",
            user: { id: 1, name: "Ana", role: "consumer" },
        });
        window.location.hash = `#/entrar?contato=${encodeURIComponent(`produto/${product.id}`)}`;
        render(<App />);
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

    it.each(["consumer", "producer"] as const)(
        "RNF04: oferta com contato sem violações WCAG A/AA detectáveis (sessão: %s)",
        async (role) => {
            api(AUTHORIZED);
            if (role) signedInAs(role);
            window.location.hash = `#/oferta/${product.id}`;
            const { container } = render(<App />);
            await screen.findByRole("link", {
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
