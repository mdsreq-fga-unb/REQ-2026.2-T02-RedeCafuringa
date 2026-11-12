import {
    act,
    cleanup,
    fireEvent,
    render,
    screen,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "@/app/App";
import {
    callsTo,
    fotoUrl,
    json,
    mockTrajectoryApi,
    ownPath,
    producerId,
    publicPath,
    publicRoute,
    publicTrajectory,
    seedSession,
    story,
    activities,
} from "../fixtures/hu12";

// HU14 e protótipos 11/15: App real, simulando somente a fronteira HTTP.
// Falhas funcionais ficam em RED, sem componentes fictícios ou testes ignorados.
vi.mock("@/features/auth/authMode", () => ({ isMockAuthEnabled: false }));
beforeEach(() => {
    localStorage.clear();
    window.location.hash = publicRoute;
});
afterEach(() => {
    cleanup();
    localStorage.clear();
    window.location.hash = "";
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});
const loaded = () =>
    screen.findByRole("heading", { name: publicTrajectory.nomeIniciativa });
const catalog = () =>
    screen.getByRole("button", { name: "Ver catálogo desse perfil" });

describe("HU14 — consulta pública", () => {
    it.each([null, "consumer"] as const)(
        "CA01: %s consulta o produtor sem autenticação na API pública",
        async (role) => {
            if (role) seedSession(role);
            const api = mockTrajectoryApi();
            render(<App />);
            await loaded();
            expect(window.location.hash).toBe(publicRoute);
            expect(callsTo(api, publicPath)).toHaveLength(1);
            expect(
                new Headers(callsTo(api, publicPath)[0][1]?.headers).has(
                    "Authorization",
                ),
            ).toBe(false);
            expect(callsTo(api, ownPath)).toHaveLength(0);
            expect(screen.queryByLabelText("Senha")).toBeNull();
        },
    );

    it("CA02: apresenta nome, categorias, trajetória, atividades e foto cadastrados", async () => {
        mockTrajectoryApi({
            publicData: {
                ...publicTrajectory,
                categoriaOfertada: "Produtos e Experiências",
                fotoUrl,
            },
        });
        render(<App />);
        await loaded();
        expect(screen.getByText("Produtos e Experiências")).toBeTruthy();
        expect(
            screen.getByRole("heading", { name: "Minha Trajetória", level: 2 }),
        ).toBeTruthy();
        expect(screen.getByText(story)).toBeTruthy();
        expect(
            screen.getByRole("heading", {
                name: "Produção / Experiências / Eventos",
                level: 2,
            }),
        ).toBeTruthy();
        expect(screen.getByText(activities)).toBeTruthy();
        expect(
            screen
                .getByRole("img", {
                    name: `Foto de ${publicTrajectory.nomeIniciativa}`,
                })
                .getAttribute("src"),
        ).toBe(`/api/v1${fotoUrl}`);
        expect(
            screen.queryByRole("button", { name: /editar|salvar/i }),
        ).toBeNull();
    });

    it.each([null, "consumer"] as const)(
        "CA03: %s vê o telefone autorizado e o controle do protótipo",
        async (role) => {
            if (role) seedSession(role);
            mockTrajectoryApi({
                publicData: { ...publicTrajectory, telefone: "61988887777" },
            });
            render(<App />);
            await loaded();
            expect(
                screen.getByText(/\(?61\)?\s*9\s*8888[-\s]*7777/),
            ).toBeTruthy();
            expect(
                screen.getByRole("button", { name: "Conversar pelo WhatsApp" }),
            ).toBeTruthy();
        },
    );

    it("CA03/RN07: contato omitido pela API não é recuperado de dados locais", async () => {
        localStorage.setItem(
            "cafuringa-contact",
            JSON.stringify({
                whatsappNumber: "5561999999999",
                authorized: true,
            }),
        );
        mockTrajectoryApi();
        render(<App />);
        await loaded();
        expect(document.body.textContent?.replace(/\D/g, "")).not.toContain(
            "61999999999",
        );
        expect(screen.queryByRole("button", { name: /WhatsApp/i })).toBeNull();
        expect(screen.queryByRole("link", { name: /WhatsApp/i })).toBeNull();
        expect(document.querySelector('a[href*="wa.me"]')).toBeNull();
    });

    it("CA04/RNF11: não expõe CPF, CNPJ ou e-mail mesmo em atributos do DOM", async () => {
        const privateData = {
            cpf: "52998224725",
            cnpj: "11222333000181",
            email: "acesso-privado@example.com",
        };
        mockTrajectoryApi({
            getPublic: () => json({ ...publicTrajectory, ...privateData }),
        });
        const { container } = render(<App />);
        await loaded();
        for (const value of Object.values(privateData))
            expect(container.innerHTML).not.toContain(value);
        expect(container.innerHTML).not.toMatch(/mailto:/i);
    });

    it.each([undefined, "", null])(
        "CA05: opcionais ausentes (%s) preservam as demais informações",
        async (empty) => {
            mockTrajectoryApi({
                getPublic: () =>
                    json({
                        ...publicTrajectory,
                        categoriaOfertada: empty,
                        atividades: empty,
                        telefone: empty,
                        fotoUrl: empty,
                    }),
            });
            render(<App />);
            await loaded();
            expect(screen.getByText(story)).toBeTruthy();
            expect(
                screen.queryByRole("heading", {
                    name: "Produção / Experiências / Eventos",
                }),
            ).toBeNull();
            expect(
                screen.queryByRole("img", { name: /foto|produtora/i }),
            ).toBeNull();
            expect(
                screen.queryByText(
                    /Hortaliças da estação, cestas agroecológicas|undefined|null/,
                ),
            ).toBeNull();
            expect(
                screen.queryByRole("button", { name: /WhatsApp/i }),
            ).toBeNull();
        },
    );

    it("CA05/RN16: não presume localização não cadastrada", async () => {
        mockTrajectoryApi();
        render(<App />);
        await loaded();
        expect(
            screen.queryByText(
                /Chácara|Núcleo Rural|Brasília|Distrito Federal/i,
            ),
        ).toBeNull();
        expect(document.querySelector('a[href*="maps"]')).toBeNull();
    });

    it("CA06/RN09: catálogo mantém a identificação do produtor selecionado", async () => {
        mockTrajectoryApi();
        const user = userEvent.setup();
        render(<App />);
        await loaded();
        await user.click(catalog());
        await screen.findByRole("heading", { name: /catálogo/i });
        expect(screen.getByText(publicTrajectory.nomeIniciativa)).toBeTruthy();
        // Contrato de navegação proposto: preservar o ID no caminho ou na query.
        expect(decodeURIComponent(window.location.hash)).toContain(producerId);
        expect(screen.queryByText("Dona Maria")).toBeNull();
    });

    it.each([404, 503])(
        "CA07/RNF03: HTTP %s mostra erro sem perfil fictício",
        async (status) => {
            mockTrajectoryApi({
                getPublic: () => json({ message: "Falha" }, status),
            });
            render(<App />);
            const alert = await screen.findByRole("alert");
            expect(alert.textContent).toMatch(
                status === 404
                    ? /perfil.*(indisponível|não encontrado)/i
                    : /não foi possível.*perfil/i,
            );
            expect(
                screen.queryByRole("heading", { name: "Dona Maria" }),
            ).toBeNull();
            expect(screen.queryByText(story)).toBeNull();
            expect(
                screen.queryByRole("button", {
                    name: "Ver catálogo desse perfil",
                }),
            ).toBeNull();
        },
    );

    it("RNF03: recupera a consulta após falha de rede", async () => {
        let attempts = 0;
        const api = mockTrajectoryApi({
            getPublic: () => {
                if (++attempts === 1)
                    return Promise.reject(new TypeError("Failed to fetch"));
                return json(publicTrajectory);
            },
        });
        const user = userEvent.setup();
        render(<App />);
        await screen.findByRole("alert");
        await user.click(
            screen.getByRole("button", { name: "Tentar novamente" }),
        );
        await loaded();
        expect(screen.queryByRole("alert")).toBeNull();
        expect(callsTo(api, publicPath)).toHaveLength(2);
    });

    it("RNF06: informa consulta pendente e exibe textos mesmo com falha da imagem", async () => {
        let resolve!: (response: Response) => void;
        const pending = new Promise<Response>((done) => {
            resolve = done;
        });
        const api = mockTrajectoryApi({ getPublic: () => pending });
        render(<App />);
        expect(screen.getByRole("status").textContent).toMatch(
            /carregando perfil/i,
        );
        expect(screen.queryByText(story)).toBeNull();
        await act(async () => {
            resolve(json({ ...publicTrajectory, fotoUrl }));
        });
        await loaded();
        fireEvent.error(
            screen.getByRole("img", {
                name: `Foto de ${publicTrajectory.nomeIniciativa}`,
            }),
        );
        expect(screen.getByText(story)).toBeTruthy();
        expect(screen.getByText(activities)).toBeTruthy();
        expect(screen.queryByRole("status")).toBeNull();
        expect(callsTo(api, publicPath)).toHaveLength(1);
    });
});

describe("HU14 — protótipos e acessibilidade", () => {
    it.each([null, "consumer"] as const)(
        "CA01/RNF01: %s acessa produtor pelo Explorar em até cinco toques",
        async (role) => {
            if (role) seedSession(role);
            // Contrato HTTP proposto só para a listagem, ainda não definida na HU:
            // GET /producers retorna os registros públicos selecionáveis.
            // O detalhe reutiliza o contrato já existente da HU12.
            const detailApi = mockTrajectoryApi();
            vi.stubGlobal(
                "fetch",
                vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
                    const path = new URL(String(input), "http://localhost")
                        .pathname;
                    if (
                        path === "/api/v1/producers" &&
                        (init?.method ?? "GET") === "GET"
                    )
                        return Promise.resolve(json([publicTrajectory]));
                    return detailApi(input, init);
                }),
            );
            const user = userEvent.setup();
            window.location.hash = "#/perfil"; // destino atual do início/Explorar
            render(<App />);
            await user.click(screen.getByRole("button", { name: "Explorar" }));
            expect(
                await screen.findByRole("heading", {
                    name: "Conheça nossos produtores",
                }),
            ).toBeTruthy();
            await user.click(
                screen.getByRole("button", {
                    name: new RegExp(publicTrajectory.nomeIniciativa),
                }),
            );
            await loaded();
            expect(window.location.hash).toBe(publicRoute);
        },
    );

    it("protótipo 15: Voltar retorna à seção de produtores do Explorar", async () => {
        mockTrajectoryApi();
        const user = userEvent.setup();
        render(<App />);
        await loaded();
        await user.click(screen.getByRole("button", { name: /Voltar/ }));
        expect(
            await screen.findByRole("heading", {
                name: "Conheça nossos produtores",
            }),
        ).toBeTruthy();
    });

    it("RNF04: perfil atende às verificações automáticas WCAG A/AA", async () => {
        mockTrajectoryApi({ publicData: { ...publicTrajectory, fotoUrl } });
        vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
            null,
        );
        const { container } = render(<App />);
        await loaded();
        const result = await axe.run(container, {
            runOnly: {
                type: "tag",
                values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
            },
            // jsdom não mede contraste, responsividade ou desempenho real da rede.
            rules: { "color-contrast": { enabled: false } },
        });
        expect(
            result.violations.map(({ id, nodes }) => ({
                id,
                targets: nodes.map((node) => node.target),
            })),
        ).toEqual([]);
    });

    it("RNF04: catálogo pode ser alcançado e acionado pelo teclado", async () => {
        mockTrajectoryApi();
        const user = userEvent.setup();
        render(<App />);
        await loaded();
        const button = catalog();
        for (
            let steps = 0;
            document.activeElement !== button && steps < 20;
            steps++
        )
            await user.tab();
        expect(document.activeElement).toBe(button);
        await user.keyboard("{Enter}");
        expect(
            await screen.findByRole("heading", { name: /catálogo/i }),
        ).toBeTruthy();
    });
});
