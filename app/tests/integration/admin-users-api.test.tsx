import {
    cleanup,
    render,
    screen,
    waitFor,
    within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "@/app/App";
import {
    admin,
    consumer,
    producer,
    jsonResponse,
    userPage,
} from "../fixtures/adminUsers";

vi.mock("@/features/auth/authMode", () => ({ isMockAuthEnabled: false }));

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("cafuringa-role", "admin");
    localStorage.setItem("cafuringa-token", "admin-session-token");
    window.location.hash = "#/admin/usuarios";
    fetchMock
        .mockReset()
        .mockImplementation(async () => jsonResponse(userPage));
    vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
    cleanup();
    localStorage.clear();
    window.location.hash = "";
    vi.unstubAllGlobals();
});

async function waitForList() {
    return screen.findByRole("heading", { name: /usuários cadastrados/i });
}

// Os detalhes podem usar texto ou campos de leitura, como no protótipo.
function expectVisibleValue(value: string) {
    const matches = screen.queryAllByText(value, { exact: false });
    const fields = screen.queryAllByDisplayValue(value);
    expect([...matches, ...fields].length).toBeGreaterThan(0);
}

describe("HU04 — consulta integrada ao contrato HTTP existente", () => {
    it("CA01–CA05/CA09: consulta com Bearer e identifica os três perfis", async () => {
        render(<App />);
        await waitForList();
        for (const item of userPage.itens) {
            expect(
                await screen.findByRole("heading", { name: item.nome }),
            ).toBeTruthy();
        }
        for (const perfil of [
            /^consumidor(a)?$/i,
            /^produtor(a)?$/i,
            /^administrador(a)?$/i,
        ]) {
            expect(
                within(
                    screen.getByRole("list", { name: "Usuários cadastrados" }),
                ).getAllByText(perfil).length,
            ).toBeGreaterThan(0);
        }
        const [url, init] = fetchMock.mock.calls[0];
        expect(new URL(String(url), window.location.origin).pathname).toMatch(
            /\/users$/,
        );
        expect(init?.method).toBe("GET");
        expect((init?.headers as Record<string, string>).Authorization).toBe(
            "Bearer admin-session-token",
        );
    });

    it("envia busca textual ao backend e apresenta o resultado filtrado", async () => {
        const user = userEvent.setup();
        fetchMock.mockImplementation(async (input) => {
            const url = new URL(String(input), window.location.origin);
            return jsonResponse(
                url.searchParams.get("busca") === "Maria"
                    ? { ...userPage, itens: [userPage.itens[2]], total: 1 }
                    : userPage,
            );
        });
        render(<App />);
        await waitForList();
        await user.type(
            screen.getByRole("searchbox", { name: /buscar usuário/i }),
            "Maria",
        );
        await waitFor(() => {
            expect(
                fetchMock.mock.calls.some(
                    ([url]) =>
                        new URL(
                            String(url),
                            window.location.origin,
                        ).searchParams.get("busca") === "Maria",
                ),
            ).toBe(true);
            expect(screen.queryByText(producer.nome)).toBeNull();
        });
        expect(screen.getByText(consumer.nome)).toBeTruthy();
    });

    it("busca a próxima página e mantém a busca atual", async () => {
        const user = userEvent.setup();
        fetchMock.mockImplementation(async (input) => {
            const url = new URL(String(input), window.location.origin);
            return jsonResponse({
                ...userPage,
                itens:
                    url.searchParams.get("pagina") === "2"
                        ? [userPage.itens[2]]
                        : [userPage.itens[1]],
                total: 21,
                pagina: Number(url.searchParams.get("pagina") || 1),
            });
        });
        render(<App />);
        await waitForList();
        await user.type(
            screen.getByRole("searchbox", { name: /buscar usuário/i }),
            "Bezerra",
        );
        await waitFor(() =>
            expect(
                fetchMock.mock.calls.some(([url]) =>
                    String(url).includes("Bezerra"),
                ),
            ).toBe(true),
        );
        await user.click(screen.getByRole("button", { name: /próxima/i }));
        expect(await screen.findByText(consumer.nome)).toBeTruthy();
        expect(
            fetchMock.mock.calls.some(([input]) => {
                const url = new URL(String(input), window.location.origin);
                return (
                    url.searchParams.get("pagina") === "2" &&
                    url.searchParams.get("busca") === "Bezerra"
                );
            }),
        ).toBe(true);
    });

    it("CA08: informa ausência de registros", async () => {
        fetchMock.mockImplementation(async () =>
            jsonResponse({ ...userPage, itens: [], total: 0 }),
        );
        render(<App />);
        expect(
            await screen.findByText(/nenhum usuário|não há usuários/i),
        ).toBeTruthy();
    });

    it("RNF03: permite tentar novamente após falha de conexão", async () => {
        const user = userEvent.setup();
        fetchMock.mockRejectedValueOnce(new TypeError("offline"));
        render(<App />);
        expect(await screen.findByRole("alert")).toBeTruthy();
        await user.click(
            screen.getByRole("button", { name: /tentar novamente/i }),
        );
        expect(await screen.findByText(consumer.nome)).toBeTruthy();
    });

    it.each([401, 403])(
        "RNF08: resposta %i bloqueia a consulta sem recorrer a mocks",
        async (status) => {
            fetchMock.mockImplementation(async () =>
                jsonResponse(
                    { statusCode: status, message: "Acesso negado" },
                    status,
                ),
            );
            render(<App />);
            await waitFor(() =>
                expect(window.location.hash).toBe("#/admin/entrar"),
            );
            expect(screen.queryByText(consumer.nome)).toBeNull();
        },
    );

    it.each([consumer, producer, admin])(
        "consulta diretamente os detalhes de $perfil pelo identificador",
        async (detail) => {
            window.location.hash = `#/admin/usuarios/${detail.id}`;
            fetchMock.mockImplementation(async () => jsonResponse(detail));
            render(<App />);
            await waitFor(() => expectVisibleValue(detail.email));
            const [url, init] = fetchMock.mock.calls[0];
            expect(String(url)).toMatch(new RegExp(`/users/${detail.id}$`));
            expect(
                (init?.headers as Record<string, string>).Authorization,
            ).toBe("Bearer admin-session-token");
            for (const value of [
                detail.nome,
                detail.cpf,
                detail.cnpj,
                detail.nomeIniciativa,
                detail.nomeResponsavel,
                detail.localidade,
                detail.categoriaOfertada,
                detail.telefone,
                ...(detail.formasPagamento ?? []),
            ]) {
                if (value) expectVisibleValue(value);
            }
            expect(screen.queryByLabelText(/senha/i)).toBeNull();
            const callsBeforeClick = fetchMock.mock.calls.length;
            await userEvent
                .setup()
                .click(screen.getByRole("button", { name: /excluir conta/i }));
            expect(fetchMock).toHaveBeenCalledTimes(callsBeforeClick);
            expect(window.location.hash).toBe(`#/admin/usuarios/${detail.id}`);
            expectVisibleValue(detail.email);
        },
    );

    it("CA06/RNF11: ignora credenciais inesperadas no payload, inclusive em atributos HTML", async () => {
        window.location.hash = `#/admin/usuarios/${consumer.id}`;
        fetchMock.mockImplementation(async () =>
            jsonResponse({
                ...consumer,
                senha: "segredo-nao-exibir",
                password: "password-nao-exibir",
                passwordHash: "hash-nao-exibir",
            }),
        );
        render(<App />);
        await waitFor(() => expectVisibleValue(consumer.email));
        for (const secret of [
            "segredo-nao-exibir",
            "password-nao-exibir",
            "hash-nao-exibir",
        ]) {
            expect(document.body.innerHTML).not.toContain(secret);
        }
    });

    it("RNF03: informa usuário não encontrado e permite voltar à lista", async () => {
        const user = userEvent.setup();
        window.location.hash = `#/admin/usuarios/${consumer.id}`;
        fetchMock.mockImplementation(async (input) =>
            String(input).endsWith(`/users/${consumer.id}`)
                ? jsonResponse(
                      { statusCode: 404, message: "Usuário não encontrado" },
                      404,
                  )
                : jsonResponse(userPage),
        );
        render(<App />);
        expect(await screen.findByText(/usuário não encontrado/i)).toBeTruthy();
        await user.click(screen.getByRole("button", { name: /voltar/i }));
        await waitFor(() =>
            expect(window.location.hash).toBe("#/admin/usuarios"),
        );
        expect(await screen.findByText(consumer.nome)).toBeTruthy();
    });
});
