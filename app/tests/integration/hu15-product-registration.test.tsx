import {
    act,
    cleanup,
    fireEvent,
    render,
    screen,
    waitFor,
    within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "@/app/App";
import {
    fields,
    fillProduct,
    json,
    mockProductApi,
    openProduct,
    product,
    productRoute,
    session,
    submissions,
    submit,
    token,
} from "../fixtures/hu15";

vi.mock("@/features/auth/authMode", () => ({ isMockAuthEnabled: false }));

beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.hash = "";
});

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    localStorage.clear();
    sessionStorage.clear();
    window.location.hash = "";
});

describe("HU15 — acesso e formulário do protótipo", () => {
    it("CA01: disponibiliza cadastro no catálogo do produtor e abre o formulário", async () => {
        session();
        mockProductApi();
        window.location.hash = "#/catalogo";
        render(<App />);
        await userEvent.setup().click(
            screen.getByRole("button", {
                name: /adicionar produto|cadastrar produto/i,
            }),
        );
        expect(
            await screen.findByRole("heading", { name: "Divulgue um produto" }),
        ).toBeTruthy();
    });

    it("CA02: apresenta os textos, campos e ações do protótipo na ordem de leitura", async () => {
        session();
        mockProductApi();
        await openProduct();
        expect(
            screen.getByText("Dados essenciais para aparecer no catálogo."),
        ).toBeTruthy();
        expect(screen.getByRole("button", { name: /^Voltar$/i })).toBeTruthy();
        const f = fields();
        const ordered = Object.values(f);
        for (let i = 0; i < ordered.length - 1; i++) {
            expect(
                ordered[i].compareDocumentPosition(ordered[i + 1]) &
                    Node.DOCUMENT_POSITION_FOLLOWING,
            ).toBeTruthy();
        }
        expect(f.descricao.tagName).toBe("TEXTAREA");
        expect(f.fotos.type).toBe("file");
        expect(
            screen.getByRole("button", { name: /^Adicionar produto$/i }),
        ).toHaveProperty("type", "submit");
        const nav = screen.getByRole("navigation", {
            name: /navegação principal/i,
        });
        for (const name of ["Painel", "Notificações", "Adicionar", "Conta"]) {
            expect(within(nav).getByRole("button", { name })).toBeTruthy();
        }
    });

    it("CA02/CA04: identifica como obrigatórios os seis campos marcados com asterisco", async () => {
        session();
        mockProductApi();
        await openProduct();
        for (const field of Object.values(fields())) {
            expect(
                field.required ||
                    field.getAttribute("aria-required") === "true",
            ).toBe(true);
        }
    });

    it("CA02: permite preencher os dados e selecionar uma foto", async () => {
        session();
        mockProductApi();
        const { user } = await openProduct();
        const f = await fillProduct(user);
        expect(f.nome.value).toBe(product.nome);
        expect(f.categoria.selectedOptions[0].textContent).toBe("Produtos");
        expect(f.descricao.value).toBe(product.descricao);
        expect(Number(f.preco.value)).toBe(40);
        expect(Number(f.gramas.value)).toBe(500);
        expect(f.fotos.files?.[0].name).toBe("cesta.png");
    });

    it.each(["visitante", "consumer"] as const)(
        "CA06/RN01/RNF08: bloqueia acesso direto de %s e orienta o usuário",
        async (role) => {
            if (role === "consumer") session(role);
            const api = mockProductApi();
            window.location.hash = productRoute;
            render(<App />);
            await waitFor(() => {
                const redirected = window.location.hash !== productRoute;
                const denied = screen
                    .queryAllByRole("alert")
                    .some((el) =>
                        /produtor|permissão|acesso|entrar/i.test(
                            el.textContent ?? "",
                        ),
                    );
                expect(redirected || denied).toBe(true);
            });
            expect(
                screen.queryByRole("heading", { name: "Divulgue um produto" }),
            ).toBeNull();
            expect(
                screen.queryByRole("button", { name: /^Adicionar produto$/i }),
            ).toBeNull();
            expect(submissions(api)).toHaveLength(0);
        },
    );

    it("CA06: não oferece cadastro no catálogo do consumidor", async () => {
        session("consumer");
        mockProductApi();
        window.location.hash = "#/catalogo";
        render(<App />);
        expect(
            screen.queryByRole("button", {
                name: /adicionar produto|cadastrar produto/i,
            }),
        ).toBeNull();
    });
});

describe("HU15 — validação antes do envio", () => {
    it.each([
        ["nome", "", /nome/i],
        ["nome", "   ", /nome/i],
        ["descricao", "", /descrição/i],
        ["descricao", "   ", /descrição/i],
        ["preco", "", /preço/i],
        ["preco", "-1", /preço/i],
        ["gramas", "", /gramas|peso/i],
        ["gramas", "-1", /gramas|peso/i],
        ["gramas", "0", /gramas|peso/i],
    ] as const)(
        "CA04/RNF03: impede %s inválido (%j) e orienta a correção",
        async (field, value, message) => {
            session();
            const api = mockProductApi();
            const { user } = await openProduct();
            const f = await fillProduct(user);
            fireEvent.change(f[field], { target: { value } });
            submit();
            expect(submissions(api)).toHaveLength(0);
            expect(
                (await screen.findAllByRole("alert"))
                    .map((el) => el.textContent)
                    .join(" "),
            ).toMatch(message);
            expect(
                f[field].getAttribute("aria-invalid") === "true" ||
                    !f[field].validity.valid,
            ).toBe(true);
        },
    );

    it("CA04: impede categoria vazia ou adulterada", async () => {
        session();
        const api = mockProductApi();
        const { user } = await openProduct();
        const f = await fillProduct(user);
        fireEvent.change(f.categoria, {
            target: { value: "categoria-inexistente" },
        });
        submit();
        expect(submissions(api)).toHaveLength(0);
        expect(
            (await screen.findAllByRole("alert"))
                .map((el) => el.textContent)
                .join(" "),
        ).toMatch(/categoria/i);
    });

    it("CA04: não envia sem a foto obrigatória do protótipo", async () => {
        session();
        const api = mockProductApi();
        const { user } = await openProduct();
        const f = await fillProduct(user);
        await user.upload(f.fotos, []);
        submit();
        expect(submissions(api)).toHaveLength(0);
        expect(
            (await screen.findAllByRole("alert"))
                .map((el) => el.textContent)
                .join(" "),
        ).toMatch(/foto|imagem/i);
    });
});

describe("HU15 — cadastro, vínculo e recuperação", () => {
    it("CA03/CA05: envia dados e foto autenticados e anuncia sucesso após confirmação", async () => {
        session();
        const api = mockProductApi();
        const { user } = await openProduct();
        await fillProduct(user);
        await user.click(
            screen.getByRole("button", { name: /^Adicionar produto$/i }),
        );
        await waitFor(() => expect(submissions(api)).toHaveLength(1));
        const init = submissions(api)[0][1]!;
        expect(new Headers(init.headers).get("Authorization")).toBe(
            `Bearer ${token}`,
        );
        expect(init.body).toBeInstanceOf(FormData);
        const body = init.body as FormData;
        expect(body.get("nome")).toBe(product.nome);
        expect(body.get("categoria")).toBe("Produtos");
        expect(body.get("descricao")).toBe(product.descricao);
        expect(Number(body.get("precoPorUnidade"))).toBe(40);
        expect(Number(body.get("gramasPorUnidade"))).toBe(500);
        expect(body.getAll("fotos")).toHaveLength(1);
        expect(body.get("fotos")).toBeInstanceOf(File);
        // O responsável é resolvido pelo servidor a partir da sessão autenticada.
        for (const key of ["produtorId", "producerId", "usuarioId", "userId"])
            expect(body.has(key)).toBe(false);
        expect(await screen.findByRole("status")).toHaveProperty(
            "textContent",
            expect.stringMatching(
                /produto.*(sucesso|cadastrado)|cadastro.*(sucesso|concluído)/i,
            ),
        );
    });

    it("CA08/RN09: após cadastrar, apresenta produto e responsável retornado pela API", async () => {
        session();
        mockProductApi();
        const { user } = await openProduct();
        await fillProduct(user);
        submit();
        expect(
            await screen.findByRole("heading", {
                name: "Sua oferta está na rede",
            }),
        ).toBeTruthy();
        expect(screen.getByRole("status").textContent).toBe(
            "O cadastro foi concluído e sua oferta está disponível para consulta.",
        );
        expect(
            screen.queryByRole("navigation", { name: /navegação principal/i }),
        ).toBeNull();
        await user.click(screen.getByRole("button", { name: "Visualizar" }));
        expect(await screen.findByText(product.nome)).toBeTruthy();
        expect(await screen.findByText(/Horta da Joana/)).toBeTruthy();
    });

    it("selecionar Experiência troca os campos do cadastro conforme HU21", async () => {
        session();
        const api = mockProductApi();
        const { user } = await openProduct();
        const f = await fillProduct(user);
        await user.selectOptions(f.categoria, "Experiência");
        expect(
            screen.getByRole("heading", { name: "Divulgue uma experiência" }),
        ).toBeTruthy();
        expect(screen.getByLabelText(/^Título/i)).toHaveProperty(
            "value",
            product.nome,
        );
        expect(screen.getByLabelText(/^Local/i)).toBeTruthy();
        expect(screen.getByLabelText(/^Duração/i)).toBeTruthy();
        expect(screen.getByLabelText(/^Valor por pessoa/i)).toBeTruthy();
        expect(screen.queryByLabelText(/^Gramas por unidade/i)).toBeNull();
        expect(submissions(api)).toHaveLength(0);
    });

    it("anexa fotos arrastadas, exibe prévias e envia os arquivos", async () => {
        session();
        const api = mockProductApi();
        const { user } = await openProduct();
        const f = await fillProduct(user);
        const extra = new File(["foto"], "colheita.png", { type: "image/png" });
        const picker = f.fotos.closest(".product-photo-picker")!;
        fireEvent.dragOver(picker, { dataTransfer: { files: [extra] } });
        expect(screen.getByText("Solte as fotos aqui")).toBeTruthy();
        fireEvent.drop(picker, { dataTransfer: { files: [extra] } });
        expect(
            screen.getByRole("img", { name: "Foto selecionada: colheita.png" }),
        ).toBeTruthy();
        submit();
        await waitFor(() => expect(submissions(api)).toHaveLength(1));
        expect(
            (submissions(api)[0][1]?.body as FormData).getAll("fotos"),
        ).toHaveLength(2);
    });

    it("recusa arquivo arrastado que não é imagem sem apagar a foto selecionada", async () => {
        session();
        mockProductApi();
        const { user } = await openProduct();
        const f = await fillProduct(user);
        fireEvent.drop(f.fotos.closest(".product-photo-picker")!, {
            dataTransfer: {
                files: [
                    new File(["texto"], "notas.txt", { type: "text/plain" }),
                ],
            },
        });
        expect(screen.getByRole("alert").textContent).toMatch(
            /apenas.*imagem/i,
        );
        expect(
            screen.getByRole("img", { name: "Foto selecionada: cesta.png" }),
        ).toBeTruthy();
    });

    it("CA05: aguarda confirmação e impede envio duplicado enquanto a requisição está pendente", async () => {
        session();
        let resolve!: (response: Response) => void;
        const pending = new Promise<Response>((done) => {
            resolve = done;
        });
        const api = mockProductApi(() => pending);
        const { user } = await openProduct();
        await fillProduct(user);
        try {
            await user.dblClick(
                screen.getByRole("button", { name: /^Adicionar produto$/i }),
            );
            await waitFor(() => expect(submissions(api)).toHaveLength(1));
            expect(
                screen.getByRole("button", {
                    name: /adicionando|cadastrando|salvando|adicionar produto/i,
                }),
            ).toHaveProperty("disabled", true);
            expect(screen.queryByRole("status")?.textContent ?? "").not.toMatch(
                /sucesso|concluído/i,
            );
        } finally {
            await act(async () => resolve(json(product, 201)));
        }
        expect(await screen.findByRole("status")).toHaveProperty(
            "textContent",
            expect.stringMatching(/sucesso|cadastrado|concluído/i),
        );
    });

    it("CA07/RNF07: preserva todos os campos e a foto na falha de conexão e permite tentar novamente", async () => {
        session();
        let attempts = 0;
        const api = mockProductApi(() => {
            if (++attempts === 1) throw new TypeError("Failed to fetch");
            return json(product, 201);
        });
        const { user } = await openProduct();
        const f = await fillProduct(user);
        submit();
        expect(await screen.findByRole("alert")).toHaveProperty(
            "textContent",
            expect.stringMatching(
                /conexão|não.*(cadastrad|concluíd|salv)|falha/i,
            ),
        );
        expect(f.nome.value).toBe(product.nome);
        expect(f.categoria.value).toBe("Produtos");
        expect(f.descricao.value).toBe(product.descricao);
        expect(Number(f.preco.value)).toBe(40);
        expect(Number(f.gramas.value)).toBe(500);
        expect(f.fotos.files?.[0].name).toBe("cesta.png");
        expect(screen.queryByRole("status")?.textContent ?? "").not.toMatch(
            /sucesso|concluído/i,
        );
        await user.click(
            screen.getByRole("button", {
                name: /adicionar produto|tentar novamente/i,
            }),
        );
        await waitFor(() => expect(submissions(api)).toHaveLength(2));
        const bodies = submissions(api).map(([, init]) =>
            Array.from((init!.body as FormData).entries()),
        );
        expect(bodies[1]).toEqual(bodies[0]);
        expect(await screen.findByRole("status")).toHaveProperty(
            "textContent",
            expect.stringMatching(/sucesso|cadastrado|concluído/i),
        );
    });

    it.each([400, 403, 500])(
        "CA04/CA06/CA07: erro HTTP %i não anuncia sucesso e mantém o nome preenchido",
        async (status) => {
            session();
            const api = mockProductApi(() =>
                json(
                    { message: "Cadastro não concluído.", statusCode: status },
                    status,
                ),
            );
            const { user } = await openProduct();
            await fillProduct(user);
            submit();
            expect(await screen.findByRole("alert")).toBeTruthy();
            expect(submissions(api)).toHaveLength(1);
            expect(fields().nome.value).toBe(product.nome);
            expect(screen.queryByRole("status")?.textContent ?? "").not.toMatch(
                /sucesso|concluído/i,
            );
        },
    );
});

describe("HU15 — acessibilidade", () => {
    it("RNF04: formulário sem violações detectáveis pelo axe (WCAG 2.1 A/AA)", async () => {
        session();
        mockProductApi();
        vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
            null,
        );
        const { container } = await openProduct();
        const result = await axe.run(container, {
            runOnly: {
                type: "tag",
                values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
            },
            rules: { "color-contrast": { enabled: false } },
        });
        expect(
            result.violations.map((item) => ({
                id: item.id,
                nodes: item.nodes.map((node) => node.target),
            })),
        ).toEqual([]);
    });

    it("RNF04: permite percorrer os campos por teclado na ordem do protótipo", async () => {
        session();
        mockProductApi();
        const { user } = await openProduct();
        const f = fields();
        f.nome.focus();
        for (const field of [f.categoria, f.descricao, f.preco, f.gramas]) {
            await user.tab();
            expect(document.activeElement).toBe(field);
        }
        // O seletor pode ser acionado por input visível ou botão com nome acessível.
        await user.tab();
        const focused = document.activeElement;
        expect(
            focused === f.fotos ||
                (focused?.tagName === "BUTTON" &&
                    /foto/i.test(
                        focused.textContent ??
                            focused.getAttribute("aria-label") ??
                            "",
                    )),
        ).toBe(true);
    });
});
