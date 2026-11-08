import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LoginPage } from "@/features/auth";
import { login } from "@/features/auth/authService";
import {
    AccountDisabledError,
    InvalidCredentialsError,
    TooManyAttemptsError,
} from "@/features/auth/errors";
import type { AuthResult } from "@/shared/types";

vi.mock("@/features/auth/authService");

const validEmail = "maria@exemplo.com";
const producerAuth: AuthResult = {
    token: "token-falso",
    user: { id: 2, name: "Dona Maria", role: "producer" },
};

function renderLogin(
    props: {
        fromContact?: boolean;
        profile?: "consumer" | "producer";
        registered?: boolean;
    } = {},
) {
    const onSignIn = vi.fn();
    const onNavigate = vi.fn();
    render(
        <LoginPage
            onNavigate={onNavigate}
            onSignIn={onSignIn}
            fromContact={props.fromContact}
            profile={props.profile}
            registered={props.registered}
        />,
    );
    return { onSignIn, onNavigate, user: userEvent.setup() };
}

async function fillAndSubmit(
    user: ReturnType<typeof userEvent.setup>,
    values: { email?: string; password?: string },
) {
    if (values.email)
        await user.type(screen.getByLabelText("E-mail"), values.email);
    if (values.password)
        await user.type(screen.getByLabelText("Senha"), values.password);
    await user.click(screen.getByRole("button", { name: "Entrar" }));
}

describe("LoginPage — HU09 Autenticar usuário", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        cleanup();
    });

    // Critério 1
    it("entra com e-mail e senha corretos", async () => {
        vi.mocked(login).mockResolvedValue(producerAuth);
        const { onSignIn, user } = renderLogin();

        await fillAndSubmit(user, { email: validEmail, password: "senha123" });

        await waitFor(() =>
            expect(onSignIn).toHaveBeenCalledWith(producerAuth),
        );
        expect(login).toHaveBeenCalledWith({
            email: validEmail,
            password: "senha123",
        });
    });

    // Critério 4
    it("nega o acesso com mensagem genérica quando E-mail ou senha estão errados", async () => {
        vi.mocked(login).mockRejectedValue(new InvalidCredentialsError());
        const { onSignIn, user } = renderLogin();

        await fillAndSubmit(user, { email: validEmail, password: "errada" });

        const alert = await screen.findByRole("alert");
        expect(alert.textContent).toBe("E-mail ou senha inválidos");
        expect(onSignIn).not.toHaveBeenCalled();
    });

    it("mostra outra mensagem quando o problema é do servidor", async () => {
        vi.mocked(login).mockRejectedValue(new Error("500"));
        const { user } = renderLogin();

        await fillAndSubmit(user, { email: validEmail, password: "senha123" });

        const alert = await screen.findByRole("alert");
        expect(alert.textContent).toContain("Não foi possível entrar agora");
    });

    it("orienta a procurar a administração quando a conta está desativada", async () => {
        vi.mocked(login).mockRejectedValue(new AccountDisabledError());
        const { onSignIn, user } = renderLogin();

        await fillAndSubmit(user, { email: validEmail, password: "senha123" });

        const alert = await screen.findByRole("alert");
        expect(alert.textContent).toContain("Conta desativada");
        expect(alert.textContent).toContain("administração");
        expect(alert.textContent).not.toContain("Tente novamente em instantes");
        expect(onSignIn).not.toHaveBeenCalled();
    });

    it("informa quanto esperar quando há tentativas demais", async () => {
        vi.mocked(login).mockRejectedValue(new TooManyAttemptsError(90));
        const { onSignIn, user } = renderLogin();

        await fillAndSubmit(user, { email: validEmail, password: "senha123" });

        const alert = await screen.findByRole("alert");
        expect(alert.textContent).toContain("Muitas tentativas");
        expect(alert.textContent).toContain("2 minutos");
        expect(onSignIn).not.toHaveBeenCalled();
    });

    it("pede para aguardar sem inventar um tempo quando o servidor não informa a espera", async () => {
        vi.mocked(login).mockRejectedValue(new TooManyAttemptsError());
        const { user } = renderLogin();

        await fillAndSubmit(user, { email: validEmail, password: "senha123" });

        const alert = await screen.findByRole("alert");
        expect(alert.textContent).toContain("Muitas tentativas");
        expect(alert.textContent).toContain("alguns instantes");
    });

    // Critério 5
    it("sinaliza campos vazios e não tenta autenticar", async () => {
        const { onSignIn, user } = renderLogin();

        await user.click(screen.getByRole("button", { name: "Entrar" }));

        expect(screen.getByText("Informe o e-mail.")).toBeTruthy();
        expect(screen.getByText("Informe a senha.")).toBeTruthy();
        expect(login).not.toHaveBeenCalled();
        expect(onSignIn).not.toHaveBeenCalled();
    });

    it("sinaliza e-mail com formato inválido e não tenta autenticar", async () => {
        const { user } = renderLogin();

        await fillAndSubmit(user, { email: "maria@", password: "senha123" });

        expect(screen.getByText("E-mail com formato inválido.")).toBeTruthy();
        expect(
            screen.getByLabelText("E-mail").getAttribute("aria-invalid"),
        ).toBe("true");
        expect(login).not.toHaveBeenCalled();
    });

    it("mostra o título do contato quando o login veio de um pedido de contato", () => {
        renderLogin({ fromContact: true });

        expect(
            screen.getByRole("heading", {
                name: "Entre para falar com o responsável",
            }),
        ).toBeTruthy();
    });

    it("mostra o título padrão nos demais casos", () => {
        renderLogin();

        expect(
            screen.getByRole("heading", { name: "Que bom ter você aqui" }),
        ).toBeTruthy();
    });

    // HU02, critério 1 (acesso ao cadastro sem conta)
    it("oferece o caminho para criar uma conta", async () => {
        const { onNavigate, user } = renderLogin();

        await user.click(
            screen.getByRole("button", { name: "Criar conta de produtor" }),
        );

        expect(onNavigate).toHaveBeenCalledWith("/cadastro");
    });

    it("mostra somente a ação de cadastro do perfil selecionado", () => {
        renderLogin({ profile: "consumer" });

        expect(
            screen.getAllByRole("button", { name: /Criar conta de/ }),
        ).toHaveLength(1);
        expect(
            screen.getByRole("button", { name: "Criar conta de consumidor" }),
        ).toBeTruthy();
        expect(
            screen.queryByRole("button", { name: "Criar conta de produtor" }),
        ).toBeNull();
    });

    // HU02, critério 9 (depois do cadastro, o usuário segue para o login)
    it("avisa que o cadastro foi concluído quando o usuário vem do cadastro", () => {
        renderLogin({ registered: true });

        expect(screen.getByRole("status").textContent).toBe(
            "Cadastro concluído. Entre com seu e-mail e sua senha.",
        );
    });

    it("não mostra o aviso de cadastro nos demais casos", () => {
        renderLogin();

        expect(screen.queryByRole("status")).toBeNull();
    });
});
