import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RecoverAccessPage } from "@/features/recovery/RecoverAccessPage";
import { requestAccessRecovery } from "@/features/recovery/recoveryService";
import type { RecoverAccessResult } from "@/features/recovery/recoveryService";

vi.mock("@/features/recovery/recoveryService");

function renderPage(
    props: { getDemoLink?: (email: string) => string | null } = {},
) {
    const onNavigate = vi.fn();
    render(
        <RecoverAccessPage
            onNavigate={onNavigate}
            getDemoLink={props.getDemoLink}
        />,
    );
    return { onNavigate, user: userEvent.setup() };
}

async function sendEmail(
    user: ReturnType<typeof userEvent.setup>,
    email = "ana@exemplo.com",
) {
    await user.type(screen.getByLabelText("E-mail"), email);
    await user.click(screen.getByRole("button", { name: "Enviar instruções" }));
}

const backButton = () => screen.getByRole("button", { name: /^←\s*Voltar$/ });

describe("RecoverAccessPage — HU10 Recuperar acesso à conta", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(requestAccessRecovery).mockResolvedValue({ ok: true });
    });

    afterEach(() => {
        cleanup();
    });

    // Critério 1 e 2 (tela 08)
    it("mostra o formulário de recuperação por e-mail", () => {
        renderPage();

        expect(
            screen.getByRole("heading", { name: "Vamos recuperar seu acesso" }),
        ).toBeTruthy();
        expect(screen.getByLabelText("E-mail")).toBeTruthy();
        expect(
            screen.getByRole("button", { name: "Enviar instruções" }),
        ).toBeTruthy();
    });

    it("volta para a tela de entrada pelo botão Voltar", async () => {
        const { onNavigate, user } = renderPage();

        await user.click(backButton());

        expect(onNavigate).toHaveBeenCalledWith("/entrar");
    });

    // Critério 6
    it("sinaliza e-mail vazio e não pede a recuperação", async () => {
        const { user } = renderPage();

        await user.click(
            screen.getByRole("button", { name: "Enviar instruções" }),
        );

        expect(screen.getByText("Informe o e-mail.")).toBeTruthy();
        expect(requestAccessRecovery).not.toHaveBeenCalled();
    });

    it("sinaliza e-mail com formato inválido e não pede a recuperação", async () => {
        const { user } = renderPage();

        await sendEmail(user, "ana@");

        expect(screen.getByText("E-mail com formato inválido.")).toBeTruthy();
        expect(
            screen.getByLabelText("E-mail").getAttribute("aria-invalid"),
        ).toBe("true");
        expect(requestAccessRecovery).not.toHaveBeenCalled();
    });

    // Critério 2 e 3 (tela 09)
    it("pede a recuperação com o e-mail sem espaços e mostra a confirmação", async () => {
        const { user } = renderPage();

        await sendEmail(user, "  ana@exemplo.com ");

        expect(
            await screen.findByRole("heading", { name: "Confira seu e-mail" }),
        ).toBeTruthy();
        expect(requestAccessRecovery).toHaveBeenCalledWith("ana@exemplo.com");
        expect(
            screen.getByText("Endereço informado: ana@exemplo.com"),
        ).toBeTruthy();
    });

    // Revisão do PR: a tela não pode afirmar envio para um e-mail sem conta,
    // e deve orientar quem errou o endereço (CA06, RNF03) sem revelar contas.
    it("não afirma que enviou e orienta quem errou o endereço", async () => {
        const { user } = renderPage();

        await sendEmail(user);

        await screen.findByRole("heading", { name: "Confira seu e-mail" });
        expect(screen.queryByText(/^Enviado para/)).toBeNull();
        expect(
            screen.getByText(
                "Não recebeu? Confira se digitou o e-mail certo e olhe a caixa de spam. Se você ainda não tem conta, faça seu cadastro.",
            ),
        ).toBeTruthy();
    });

    it("usa uma mensagem neutra que não revela se a conta existe", async () => {
        const { user } = renderPage();

        await sendEmail(user);

        expect(
            await screen.findByText(
                "Se houver uma conta com esse endereço, você receberá as instruções para recuperar o acesso.",
            ),
        ).toBeTruthy();
    });

    it("reenvia o e-mail para o mesmo endereço e avisa o reenvio", async () => {
        const { user } = renderPage();
        await sendEmail(user);
        await screen.findByRole("heading", { name: "Confira seu e-mail" });

        await user.click(
            screen.getByRole("button", { name: "Reenviar e-mail" }),
        );

        expect(await screen.findByText("E-mail reenviado.")).toBeTruthy();
        expect(requestAccessRecovery).toHaveBeenCalledTimes(2);
        expect(requestAccessRecovery).toHaveBeenLastCalledWith(
            "ana@exemplo.com",
        );
    });

    it("mantém a confirmação e mostra o erro quando o reenvio falha", async () => {
        const { user } = renderPage();
        await sendEmail(user);
        await screen.findByRole("heading", { name: "Confira seu e-mail" });
        vi.mocked(requestAccessRecovery).mockResolvedValue({
            ok: false,
            reason: "rate_limit",
        });

        await user.click(
            screen.getByRole("button", { name: "Reenviar e-mail" }),
        );

        expect((await screen.findByRole("alert")).textContent).toBe(
            "Muitas tentativas. Aguarde alguns instantes e tente novamente.",
        );
        expect(
            screen.getByRole("heading", { name: "Confira seu e-mail" }),
        ).toBeTruthy();
        expect(screen.queryByText("E-mail reenviado.")).toBeNull();
    });

    it("volta para a entrada pelo botão Voltar para entrar", async () => {
        const { onNavigate, user } = renderPage();
        await sendEmail(user);
        await screen.findByRole("heading", { name: "Confira seu e-mail" });

        await user.click(
            screen.getByRole("button", { name: "Voltar para entrar" }),
        );

        expect(onNavigate).toHaveBeenCalledWith("/entrar");
    });

    it("permite corrigir o e-mail pelo Voltar da confirmação", async () => {
        const { user } = renderPage();
        await sendEmail(user);
        await screen.findByRole("heading", { name: "Confira seu e-mail" });

        await user.click(backButton());

        expect(
            screen.getByRole("heading", { name: "Vamos recuperar seu acesso" }),
        ).toBeTruthy();
        expect(
            (screen.getByLabelText("E-mail") as HTMLInputElement).value,
        ).toBe("ana@exemplo.com");
    });

    // Critério 6 (falhas do serviço)
    it("informa o tempo de espera quando há limite de tentativas", async () => {
        vi.mocked(requestAccessRecovery).mockResolvedValue({
            ok: false,
            reason: "rate_limit",
            retryAfterSeconds: 30,
        });
        const { user } = renderPage();

        await sendEmail(user);

        expect((await screen.findByRole("alert")).textContent).toBe(
            "Muitas tentativas. Tente novamente em 30 segundos.",
        );
        expect(
            screen.getByRole("heading", { name: "Vamos recuperar seu acesso" }),
        ).toBeTruthy();
    });

    it("pede para aguardar quando há limite de tentativas sem tempo informado", async () => {
        vi.mocked(requestAccessRecovery).mockResolvedValue({
            ok: false,
            reason: "rate_limit",
        });
        const { user } = renderPage();

        await sendEmail(user);

        expect((await screen.findByRole("alert")).textContent).toBe(
            "Muitas tentativas. Aguarde alguns instantes e tente novamente.",
        );
    });

    it("mostra outra mensagem quando o problema é do servidor", async () => {
        vi.mocked(requestAccessRecovery).mockResolvedValue({
            ok: false,
            reason: "error",
        });
        const { user } = renderPage();

        await sendEmail(user);

        expect((await screen.findByRole("alert")).textContent).toContain(
            "Não foi possível enviar as instruções agora",
        );
    });

    it("desabilita o botão enquanto o pedido está em andamento", async () => {
        let finish: (result: RecoverAccessResult) => void = () => {};
        vi.mocked(requestAccessRecovery).mockReturnValue(
            new Promise<RecoverAccessResult>((resolve) => {
                finish = resolve;
            }),
        );
        const { user } = renderPage();

        await sendEmail(user);

        const sending = screen.getByRole("button", { name: "Enviando…" });
        expect((sending as HTMLButtonElement).disabled).toBe(true);

        finish({ ok: true });
        expect(
            await screen.findByRole("heading", { name: "Confira seu e-mail" }),
        ).toBeTruthy();
    });

    // Demonstração (modo mock)
    it("mostra o link de demonstração quando a página recebe getDemoLink", async () => {
        const getDemoLink = vi.fn().mockReturnValue("#/nova-senha?token=abc");
        const { user } = renderPage({ getDemoLink });

        await sendEmail(user);

        const link = await screen.findByRole("link", {
            name: "abrir link de redefinição",
        });
        expect(link.getAttribute("href")).toBe("#/nova-senha?token=abc");
        expect(getDemoLink).toHaveBeenCalledWith("ana@exemplo.com");
    });

    it("não mostra link de demonstração sem getDemoLink", async () => {
        const { user } = renderPage();

        await sendEmail(user);
        await screen.findByRole("heading", { name: "Confira seu e-mail" });

        expect(screen.queryByRole("link")).toBeNull();
    });
});
