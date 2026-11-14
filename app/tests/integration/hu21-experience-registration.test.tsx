import {
    act,
    within,
    cleanup,
    fireEvent,
    screen,
    waitFor,
    render,
} from "@testing-library/react";
import { beforeEach, afterEach, it, expect, vi } from "vitest";
import axe from "axe-core";
import userEvent from "@testing-library/user-event";
import { App } from "@/app/App";
import {
    fields,
    fillExperience,
    json,
    mockExperienceApi,
    openExperience,
    experience,
    session,
    submissions,
    submit,
    token,
} from "../fixtures/hu21";

vi.mock("@/features/auth/authMode", () => ({ isMockAuthEnabled: false }));

it("alterna categorias no cadastro comum sem perder dados e envia os campos específicos", async () => {
    session();
    const api = mockExperienceApi();
    window.location.hash = "#/produtos/novo";
    render(<App />);
    const user = userEvent.setup();
    await user.selectOptions(
        screen.getByLabelText(/^Categoria/i),
        "Experiência",
    );
    const f = await fillExperience(user);
    await user.selectOptions(f.categoria, "Produtos");
    expect(screen.queryByLabelText(/^Local/i)).toBeNull();
    expect(screen.getByLabelText(/^Gramas por unidade/i)).toBeTruthy();
    await user.selectOptions(f.categoria, "Experiência");
    expect(fields().nome.value).toBe(experience.nome);
    expect(fields().local.value).toBe(experience.local);
    expect(fields().duracao.value).toBe(experience.duracao);
    expect(fields().fotos.files?.[0].name).toBe("visita.png");
    submit();
    expect(await screen.findByRole("status")).toBeTruthy();
    const body = submissions(api)[0][1]!.body as FormData;
    expect(body.has("gramasPorUnidade")).toBe(false);
    expect(body.has("precoPorUnidade")).toBe(false);
    expect(body.get("valorPorPessoa")).toBe("45");
});

it("aceita valor em reais com vírgula", async () => {
    session();
    const api = mockExperienceApi();
    const { user } = await openExperience();
    const f = await fillExperience(user);
    fireEvent.change(f.preco, { target: { value: "45,50" } });
    submit();
    expect(await screen.findByRole("status")).toBeTruthy();
    expect(
        (submissions(api)[0][1]!.body as FormData).get("valorPorPessoa"),
    ).toBe("45.5");
});

it("API indisponível preserva o formulário sem simular publicação", async () => {
    session();
    mockExperienceApi(() =>
        json({ message: "Not found", statusCode: 404 }, 404),
    );
    const { user } = await openExperience();
    const f = await fillExperience(user);
    submit();
    expect((await screen.findByRole("alert")).textContent).toMatch(
        /indisponível.*preservados/i,
    );
    expect(f.local.value).toBe(experience.local);
    expect(
        screen.queryByRole("heading", { name: "Sua oferta está na rede" }),
    ).toBeNull();
});

it("CA01: produtor abre cadastro pela área de gerenciamento", async () => {
    session();
    mockExperienceApi();
    window.location.hash = "#/catalogo";
    render(<App />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Adicionar produto" }));
    await user.selectOptions(
        await screen.findByLabelText(/^Categoria/i),
        "Experiência",
    );
    expect(
        await screen.findByRole("heading", {
            name: "Divulgue uma experiência",
        }),
    ).toBeTruthy();
});

it("CA02: mantém textos, ordem dos campos e navegação do protótipo", async () => {
    session();
    mockExperienceApi();
    await openExperience();
    expect(
        screen.getByText("Convide as pessoas a conhecer sua iniciativa."),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Voltar" })).toBeTruthy();
    const ordered = Object.values(fields());
    for (let i = 0; i < ordered.length - 1; i++) {
        expect(
            ordered[i].compareDocumentPosition(ordered[i + 1]) &
                Node.DOCUMENT_POSITION_FOLLOWING,
        ).toBeTruthy();
    }
    expect(fields().descricao.tagName).toBe("TEXTAREA");
    expect(fields().categoria.value).toBe("Experiência");
    expect(fields().fotos.type).toBe("file");
    expect(
        screen.getByRole("button", { name: "Adicionar experiência" }),
    ).toHaveProperty("type", "submit");
    const navigation = screen.getByRole("navigation", {
        name: /navegação principal/i,
    });
    for (const name of ["Painel", "Notificações", "Adicionar", "Conta"])
        expect(within(navigation).getByRole("button", { name })).toBeTruthy();
});

it("CA04: recusa categoria vazia ou adulterada", async () => {
    session();
    const api = mockExperienceApi();
    const { user } = await openExperience();
    const f = await fillExperience(user);
    fireEvent.change(f.categoria, { target: { value: "inexistente" } });
    submit();
    expect(
        (await screen.findAllByRole("alert"))
            .map((item) => item.textContent)
            .join(" "),
    ).toMatch(/categoria/i);
    expect(submissions(api)).toHaveLength(0);
});

it("CA04: exige ao menos uma foto", async () => {
    session();
    const api = mockExperienceApi();
    const { user } = await openExperience();
    const f = await fillExperience(user);
    await user.upload(f.fotos, []);
    submit();
    expect(
        (await screen.findAllByRole("alert"))
            .map((item) => item.textContent)
            .join(" "),
    ).toMatch(/foto|imagem/i);
    expect(submissions(api)).toHaveLength(0);
});

it("CA05: aguarda resposta e bloqueia envio duplicado", async () => {
    session();
    let resolve!: (response: Response) => void;
    const pending = new Promise<Response>((done) => {
        resolve = done;
    });
    const api = mockExperienceApi(() => pending);
    const { user } = await openExperience();
    await fillExperience(user);
    try {
        await user.dblClick(
            screen.getByRole("button", { name: "Adicionar experiência" }),
        );
        await waitFor(() => expect(submissions(api)).toHaveLength(1));
        expect(
            screen.getByRole("button", {
                name: /adicionando|salvando|cadastrando|adicionar experiência/i,
            }),
        ).toHaveProperty("disabled", true);
        expect(
            screen.queryByRole("heading", { name: "Sua oferta está na rede" }),
        ).toBeNull();
    } finally {
        await act(async () => resolve(json(experience, 201)));
    }
    expect(
        await screen.findByRole("heading", { name: "Sua oferta está na rede" }),
    ).toBeTruthy();
});

it.each([400, 401, 403, 500])(
    "CA04/CA06/CA07: erro HTTP %i preserva dados e não anuncia sucesso",
    async (status) => {
        session();
        mockExperienceApi(() =>
            json(
                { message: "Cadastro não concluído.", statusCode: status },
                status,
            ),
        );
        const { user } = await openExperience();
        const f = await fillExperience(user);
        submit();
        expect(await screen.findByRole("alert")).toBeTruthy();
        expect(f.nome.value).toBe(experience.nome);
        expect(f.local.value).toBe(experience.local);
        expect(f.duracao.value).toBe(experience.duracao);
        expect(f.fotos.files?.[0].name).toBe("visita.png");
        expect(
            screen.queryByRole("heading", { name: "Sua oferta está na rede" }),
        ).toBeNull();
    },
);

it("RNF04: permite percorrer o formulário por teclado", async () => {
    session();
    mockExperienceApi();
    const { user } = await openExperience();
    const f = fields();
    f.nome.focus();
    for (const field of [
        f.categoria,
        f.descricao,
        f.local,
        f.duracao,
        f.preco,
    ]) {
        await user.tab();
        expect(document.activeElement).toBe(field);
    }
    await user.tab();
    expect(
        document.activeElement === f.fotos ||
            /foto/i.test(
                document.activeElement?.getAttribute("aria-label") ??
                    document.activeElement?.textContent ??
                    "",
            ),
    ).toBe(true);
});

it("RNF04: formulário sem violações WCAG 2.1 A/AA detectáveis pelo axe", async () => {
    session();
    mockExperienceApi();
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    const { container } = await openExperience();
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

it("CA02/CA04: mostra os sete campos obrigatórios do protótipo e impede envio vazio", async () => {
    session();
    const api = mockExperienceApi();
    await openExperience();
    for (const field of Object.values(fields()))
        expect(field.required).toBe(true);
    submit();
    expect((await screen.findAllByRole("alert")).length).toBeGreaterThan(0);
    expect(submissions(api)).toHaveLength(0);
});

it.each(["nome", "descricao", "local", "duracao", "preco"] as const)(
    "CA04: recusa %s inválido",
    async (field) => {
        session();
        const api = mockExperienceApi();
        const { user } = await openExperience();
        const f = await fillExperience(user);
        fireEvent.change(f[field], {
            target: { value: field === "preco" ? "-1" : " " },
        });
        submit();
        expect(await screen.findByRole("alert")).toBeTruthy();
        expect(submissions(api)).toHaveLength(0);
    },
);

it("CA03/CA05/CA08: publica dados e fotos sem escolher dono, confirma e identifica responsável", async () => {
    session();
    const api = mockExperienceApi();
    const { user } = await openExperience();
    await fillExperience(user);
    submit();
    expect(
        await screen.findByRole("heading", { name: "Sua oferta está na rede" }),
    ).toBeTruthy();
    const body = submissions(api)[0][1]!.body as FormData;
    expect(
        new Headers(submissions(api)[0][1]!.headers).get("Authorization"),
    ).toBe(`Bearer ${token}`);
    expect(body.get("nome")).toBe(experience.nome);
    expect(body.get("descricao")).toBe(experience.descricao);
    expect(body.get("categoria")).toBe("Experiência");
    expect(body.get("local")).toBe(experience.local);
    expect(body.get("duracao")).toBe(experience.duracao);
    expect(body.get("valorPorPessoa")).toBe("45");
    expect(body.getAll("fotos")).toHaveLength(1);
    for (const key of [
        "produtor",
        "produtorId",
        "producerId",
        "usuarioId",
        "userId",
    ])
        expect(body.has(key)).toBe(false);
    expect(screen.getByRole("status").textContent).toBe(
        "O cadastro foi concluído e sua oferta está disponível para consulta.",
    );
    expect(
        screen.queryByRole("navigation", { name: /navegação principal/i }),
    ).toBeNull();
    await user.click(screen.getByRole("button", { name: "Visualizar" }));
    expect(await screen.findByText(experience.nome)).toBeTruthy();
    expect(screen.getByText(/Horta da Joana/)).toBeTruthy();
    expect(screen.getByText(new RegExp(experience.local))).toBeTruthy();
});

it("CA07: preserva campos e fotos e reutiliza chave ao tentar novamente", async () => {
    session();
    let attempts = 0;
    const api = mockExperienceApi(() => {
        if (++attempts === 1) throw new TypeError("Failed to fetch");
        return json(experience, 201);
    });
    const { user } = await openExperience();
    const f = await fillExperience(user);
    submit();
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(f.nome.value).toBe(experience.nome);
    expect(f.descricao.value).toBe(experience.descricao);
    expect(f.categoria.value).toBe(experience.categoria);
    expect(f.local.value).toBe(experience.local);
    expect(f.duracao.value).toBe(experience.duracao);
    expect(Number(f.preco.value)).toBe(45);
    expect(f.fotos.files?.[0].name).toBe("visita.png");
    submit();
    await waitFor(() => expect(submissions(api)).toHaveLength(2));
    const key = new Headers(submissions(api)[0][1]!.headers).get(
        "Idempotency-Key",
    );
    expect(key).toBeTruthy();
    expect(
        new Headers(submissions(api)[1][1]!.headers).get("Idempotency-Key"),
    ).toBe(key);
    expect(
        Array.from((submissions(api)[1][1]!.body as FormData).entries()),
    ).toEqual(Array.from((submissions(api)[0][1]!.body as FormData).entries()));
    expect(await screen.findByRole("status")).toBeTruthy();
});

it.each(["consumer", "admin", "visitor"] as const)(
    "CA06: bloqueia acesso de %s",
    async (role) => {
        if (role !== "visitor") session(role);
        const api = mockExperienceApi();
        window.location.hash = "#/experiencias/nova";
        render(<App />);
        await waitFor(() =>
            expect(window.location.hash).not.toBe("#/experiencias/nova"),
        );
        expect(
            screen.queryByRole("heading", { name: "Divulgue uma experiência" }),
        ).toBeNull();
        expect(submissions(api)).toHaveLength(0);
    },
);
