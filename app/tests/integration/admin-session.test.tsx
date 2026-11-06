import {
    cleanup,
    fireEvent,
    render,
    screen,
    waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App } from "@/app/App";
import { admin, jsonResponse, userPage } from "../fixtures/adminUsers";
import { renderAdminApp } from "../fixtures/renderAdminApp";

vi.mock("@/features/auth/authMode", () => ({ isMockAuthEnabled: false }));

afterEach(() => {
    cleanup();
    localStorage.clear();
    window.location.hash = "";
    vi.unstubAllGlobals();
});

describe("sessão administrativa exige autenticação nesta abertura do app", () => {
    it("voltar ao acesso administrativo pela escolha de perfil exige outro login", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn<typeof fetch>().mockImplementation(async () =>
                jsonResponse({
                    accessToken: "jwt-valido",
                    tokenType: "Bearer",
                    expiresIn: 900,
                    usuario: admin,
                }),
            ),
        );
        await renderAdminApp("#/escolher-perfil");
        await userEvent
            .setup()
            .click(
                screen.getByRole("button", { name: "Acesso administrativo" }),
            );
        expect(
            await screen.findByRole("button", { name: "Entrar como adm" }),
        ).toBeTruthy();
        expect(
            screen.queryByRole("heading", { name: "Funções do administrador" }),
        ).toBeNull();
        expect(localStorage.getItem("cafuringa-token")).toBeNull();
    });
    it.each(["mock-token-3", "jwt-de-uma-sessao-antiga"])(
        "perfil salvo com %s não libera funções ou consultas",
        async (token) => {
            localStorage.setItem("cafuringa-role", "admin");
            localStorage.setItem("cafuringa-token", token);
            const fetchMock = vi.fn<typeof fetch>();
            vi.stubGlobal("fetch", fetchMock);
            window.location.hash = "#/admin/acesso";
            render(<App />);
            expect(
                screen.queryByRole("heading", {
                    name: "Funções do administrador",
                }),
            ).toBeNull();
            expect(
                screen.getByRole("button", { name: "Entrar como adm" }),
            ).toBeTruthy();
            expect(localStorage.getItem("cafuringa-token")).toBeNull();
            window.location.hash = "#/admin/usuarios";
            await waitFor(() =>
                expect(window.location.hash).toBe("#/admin/entrar"),
            );
            expect(fetchMock).not.toHaveBeenCalled();
        },
    );

    it("faz login real antes de consultar usuários e exige novo login após recarregar", async () => {
        const fetchMock = vi
            .fn<typeof fetch>()
            .mockImplementation(async (input) =>
                String(input).endsWith("/auth/login")
                    ? jsonResponse({
                          accessToken: "jwt-valido",
                          tokenType: "Bearer",
                          expiresIn: 900,
                          usuario: admin,
                      })
                    : jsonResponse(userPage),
            );
        vi.stubGlobal("fetch", fetchMock);
        window.location.hash = "#/admin/entrar";
        const { unmount } = render(<App />);
        fireEvent.change(screen.getByLabelText("E-mail"), {
            target: { value: "admin@exemplo.com" },
        });
        fireEvent.change(screen.getByLabelText("Senha"), {
            target: { value: "SenhaAdmin123" },
        });
        const user = userEvent.setup();
        await user.click(screen.getByRole("button", { name: "Entrar" }));
        await screen.findByRole("heading", {
            name: "Funções do administrador",
        });
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({
            email: "admin@exemplo.com",
            senha: "SenhaAdmin123",
        });
        await user.click(
            screen.getByRole("link", {
                name: /consultar usuários cadastrados/i,
            }),
        );
        await screen.findByRole("list", { name: "Usuários cadastrados" });
        expect(
            (fetchMock.mock.calls[1][1]?.headers as Record<string, string>)
                .Authorization,
        ).toBe("Bearer jwt-valido");
        unmount();
        fetchMock.mockClear();
        render(<App />);
        await waitFor(() =>
            expect(window.location.hash).toBe("#/admin/entrar"),
        );
        expect(
            screen.queryByRole("list", { name: "Usuários cadastrados" }),
        ).toBeNull();
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("falha de conexão mostra orientação de servidor e mantém a consulta bloqueada", async () => {
        const fetchMock = vi
            .fn<typeof fetch>()
            .mockRejectedValue(new TypeError("Failed to fetch"));
        vi.stubGlobal("fetch", fetchMock);
        window.location.hash = "#/admin/entrar";
        render(<App />);
        fireEvent.change(screen.getByLabelText("E-mail"), {
            target: { value: "admin@exemplo.com" },
        });
        fireEvent.change(screen.getByLabelText("Senha"), {
            target: { value: "SenhaAdmin123" },
        });
        await userEvent
            .setup()
            .click(screen.getByRole("button", { name: "Entrar" }));
        expect((await screen.findByRole("alert")).textContent).toContain(
            "conectar ao servidor",
        );
        expect(
            screen.queryByRole("heading", { name: "Funções do administrador" }),
        ).toBeNull();
        expect(localStorage.getItem("cafuringa-token")).toBeNull();
    });
});
