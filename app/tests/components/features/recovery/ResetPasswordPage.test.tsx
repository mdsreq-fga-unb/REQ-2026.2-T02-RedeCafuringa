import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ResetPasswordPage } from "@/features/recovery/ResetPasswordPage";
import { resetPassword } from "@/features/recovery/recoveryService";
import type { ResetPasswordResult } from "@/features/recovery/recoveryService";

vi.mock("@/features/recovery/recoveryService");

function renderPage(props: { token?: string | null } = {}) {
    const onNavigate = vi.fn();
    render(
        <ResetPasswordPage
            token={props.token === undefined ? "abc123" : props.token}
            onNavigate={onNavigate}
        />,
    );
    return { onNavigate, user: userEvent.setup() };
}

async function fillAndSubmit(
    user: ReturnType<typeof userEvent.setup>,
    values: { password?: string; confirm?: string },
) {
    if (values.password)
        await user.type(screen.getByLabelText("Nova senha"), values.password);
    if (values.confirm)
        await user.type(
            screen.getByLabelText("Confirmar nova senha"),
            values.confirm,
        );
    await user.click(screen.getByRole("button", { name: "Salvar e entrar" }));
}

describe("ResetPasswordPage — HU10 Recuperar acesso à conta", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(resetPassword).mockResolvedValue({ ok: true });
    });

    afterEach(() => {
        cleanup();
    });

    // Critério 4 (tela 10)
    it("mostra o formulário de nova senha com a confirmação", () => {
        renderPage();

        expect(
            screen.getByRole("heading", { name: "Crie uma nova senha" }),
        ).toBeTruthy();
        expect(
            screen.getByText("Etapa acessada pelo link de recuperação."),
        ).toBeTruthy();
        expect(screen.getByLabelText("Nova senha")).toBeTruthy();
        expect(screen.getByLabelText("Confirmar nova senha")).toBeTruthy();
        expect(
            screen.getByRole("button", { name: "Salvar e entrar" }),
        ).toBeTruthy();
    });

    it("esconde as senhas digitadas", () => {
        renderPage();

        expect(screen.getByLabelText("Nova senha").getAttribute("type")).toBe(
            "password",
        );
        expect(
            screen.getByLabelText("Confirmar nova senha").getAttribute("type"),
        ).toBe("password");
    });

    it("volta para a tela de entrada pelo botão Voltar", async () => {
        const { onNavigate, user } = renderPage();

        await user.click(screen.getByRole("button", { name: /^Voltar$/ }));

        expect(onNavigate).toHaveBeenCalledWith("/entrar");
    });

    // Critério 6 (validações)
    it("sinaliza campos vazios e não redefine a senha", async () => {
        const { user } = renderPage();

        await user.click(
            screen.getByRole("button", { name: "Salvar e entrar" }),
        );

        expect(screen.getByText("Informe a nova senha.")).toBeTruthy();
        expect(screen.getByText("Confirme a nova senha.")).toBeTruthy();
        expect(resetPassword).not.toHaveBeenCalled();
    });

    it("sinaliza senha curta e não redefine a senha", async () => {
        const { user } = renderPage();

        await fillAndSubmit(user, { password: "abc123", confirm: "abc123" });

        expect(
            screen.getByText("A senha deve ter no mínimo 8 caracteres."),
        ).toBeTruthy();
        expect(
            screen.getByLabelText("Nova senha").getAttribute("aria-invalid"),
        ).toBe("true");
        expect(resetPassword).not.toHaveBeenCalled();
    });

    it("exige letras e números na nova senha", async () => {
        const { user } = renderPage();

        await fillAndSubmit(user, {
            password: "abcdefgh",
            confirm: "abcdefgh",
        });

        expect(
            screen.getByText("A senha deve ter letras e números."),
        ).toBeTruthy();
        expect(resetPassword).not.toHaveBeenCalled();
    });

    it("sinaliza confirmação diferente da senha", async () => {
        const { user } = renderPage();

        await fillAndSubmit(user, {
            password: "novaSenha1",
            confirm: "novaSenha2",
        });

        expect(screen.getByText("As senhas não conferem.")).toBeTruthy();
        expect(
            screen
                .getByLabelText("Confirmar nova senha")
                .getAttribute("aria-invalid"),
        ).toBe("true");
        expect(resetPassword).not.toHaveBeenCalled();
    });

    // Critério 5 (senha redefinida)
    it("redefine a senha com o token do link e segue para a entrada", async () => {
        const { onNavigate, user } = renderPage();

        await fillAndSubmit(user, {
            password: "novaSenha1",
            confirm: "novaSenha1",
        });

        await waitFor(() =>
            expect(onNavigate).toHaveBeenCalledWith("/entrar?recuperacao=ok"),
        );
        expect(resetPassword).toHaveBeenCalledWith({
            token: "abc123",
            password: "novaSenha1",
        });
    });

    it("desabilita o botão enquanto a senha está sendo salva", async () => {
        let finish: (result: ResetPasswordResult) => void = () => {};
        vi.mocked(resetPassword).mockReturnValue(
            new Promise<ResetPasswordResult>((resolve) => {
                finish = resolve;
            }),
        );
        const { onNavigate, user } = renderPage();

        await fillAndSubmit(user, {
            password: "novaSenha1",
            confirm: "novaSenha1",
        });

        const saving = screen.getByRole("button", { name: "Salvando…" });
        expect((saving as HTMLButtonElement).disabled).toBe(true);

        finish({ ok: true });
        await waitFor(() =>
            expect(onNavigate).toHaveBeenCalledWith("/entrar?recuperacao=ok"),
        );
    });

    // Critério 6 (link inválido ou expirado)
    it("troca o formulário pela orientação quando o serviço recusa o token", async () => {
        vi.mocked(resetPassword).mockResolvedValue({
            ok: false,
            reason: "invalid_token",
        });
        const { onNavigate, user } = renderPage();

        await fillAndSubmit(user, {
            password: "novaSenha1",
            confirm: "novaSenha1",
        });

        expect(
            await screen.findByRole("heading", {
                name: "Link de recuperação inválido",
            }),
        ).toBeTruthy();
        expect(screen.queryByLabelText("Nova senha")).toBeNull();
        expect(onNavigate).not.toHaveBeenCalled();
    });

    it("mostra a orientação, sem formulário, quando o link não tem token", () => {
        renderPage({ token: null });

        expect(
            screen.getByRole("heading", {
                name: "Link de recuperação inválido",
            }),
        ).toBeTruthy();
        expect(screen.queryByLabelText("Nova senha")).toBeNull();
        expect(resetPassword).not.toHaveBeenCalled();
    });

    it("trata um token em branco como link inválido", () => {
        renderPage({ token: "   " });

        expect(
            screen.getByRole("heading", {
                name: "Link de recuperação inválido",
            }),
        ).toBeTruthy();
    });

    it("leva a um novo pedido de recuperação a partir do link inválido", async () => {
        const { onNavigate, user } = renderPage({ token: null });

        await user.click(
            screen.getByRole("button", { name: "Pedir novo link" }),
        );

        expect(onNavigate).toHaveBeenCalledWith("/recuperar-acesso");
    });

    it("volta para a entrada a partir do link inválido", async () => {
        const { onNavigate, user } = renderPage({ token: null });

        await user.click(
            screen.getByRole("button", { name: "Voltar para entrar" }),
        );

        expect(onNavigate).toHaveBeenCalledWith("/entrar");
    });

    // Falhas do serviço
    it("informa o tempo de espera quando há limite de tentativas", async () => {
        vi.mocked(resetPassword).mockResolvedValue({
            ok: false,
            reason: "rate_limit",
            retryAfterSeconds: 60,
        });
        const { onNavigate, user } = renderPage();

        await fillAndSubmit(user, {
            password: "novaSenha1",
            confirm: "novaSenha1",
        });

        expect((await screen.findByRole("alert")).textContent).toBe(
            "Muitas tentativas. Tente novamente em 60 segundos.",
        );
        expect(screen.getByLabelText("Nova senha")).toBeTruthy();
        expect(onNavigate).not.toHaveBeenCalled();
    });

    it("mostra outra mensagem quando o problema é do servidor", async () => {
        vi.mocked(resetPassword).mockResolvedValue({
            ok: false,
            reason: "error",
        });
        const { user } = renderPage();

        await fillAndSubmit(user, {
            password: "novaSenha1",
            confirm: "novaSenha1",
        });

        expect((await screen.findByRole("alert")).textContent).toContain(
            "Não foi possível redefinir a senha agora",
        );
    });

        // Protótipo 10: título em laranja
    it("destaca o título da nova senha com o estilo de destaque do protótipo", () => {
        renderPage();

        expect(
            screen.getByRole("heading", { name: "Crie uma nova senha" })
                .className,
        ).toContain("recovery-title-accent");
    });

    it("não aplica o destaque ao título de link inválido", () => {
        renderPage({ token: null });

        expect(
            screen.getByRole("heading", {
                name: "Link de recuperação inválido",
            }).className,
        ).not.toContain("recovery-title-accent");
    });
});
