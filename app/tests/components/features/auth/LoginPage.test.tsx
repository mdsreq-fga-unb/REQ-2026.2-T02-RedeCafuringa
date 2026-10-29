import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LoginPage } from "@/features/auth";
import { login } from "@/features/auth/authService";
import { InvalidCredentialsError } from "@/features/auth/errors";
import type { AuthResult } from "@/shared/types";

vi.mock("@/features/auth/authService");

const validCpf = "52998224725";
const producerAuth: AuthResult = {
    token: "token-falso",
    user: { id: 2, name: "Dona Maria", role: "producer" },
};

function renderLogin(props: { fromContact?: boolean } = {}) {
    const onSignIn = vi.fn();
    render(
        <LoginPage
            onNavigate={vi.fn()}
            onSignIn={onSignIn}
            fromContact={props.fromContact}
        />,
    );
    return { onSignIn, user: userEvent.setup() };
}

async function fillAndSubmit(
    user: ReturnType<typeof userEvent.setup>,
    values: { cpf?: string; password?: string },
) {
    if (values.cpf) await user.type(screen.getByLabelText("CPF"), values.cpf);
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
    it("entra com CPF e senha corretos, enviando o CPF só com dígitos", async () => {
        vi.mocked(login).mockResolvedValue(producerAuth);
        const { onSignIn, user } = renderLogin();

        await fillAndSubmit(user, { cpf: validCpf, password: "senha123" });

        await waitFor(() =>
            expect(onSignIn).toHaveBeenCalledWith(producerAuth),
        );
        expect(login).toHaveBeenCalledWith({
            cpf: validCpf,
            password: "senha123",
        });
    });

    it("aplica a máscara de CPF enquanto o usuário digita", async () => {
        const { user } = renderLogin();

        await user.type(screen.getByLabelText("CPF"), validCpf);

        expect((screen.getByLabelText("CPF") as HTMLInputElement).value).toBe(
            "529.982.247-25",
        );
    });

    // Critério 4
    it("nega o acesso com mensagem genérica quando CPF ou senha estão errados", async () => {
        vi.mocked(login).mockRejectedValue(new InvalidCredentialsError());
        const { onSignIn, user } = renderLogin();

        await fillAndSubmit(user, { cpf: validCpf, password: "errada" });

        const alert = await screen.findByRole("alert");
        expect(alert.textContent).toBe("CPF ou senha inválidos");
        expect(onSignIn).not.toHaveBeenCalled();
    });

    it("mostra outra mensagem quando o problema é do servidor", async () => {
        vi.mocked(login).mockRejectedValue(new Error("500"));
        const { user } = renderLogin();

        await fillAndSubmit(user, { cpf: validCpf, password: "senha123" });

        const alert = await screen.findByRole("alert");
        expect(alert.textContent).toContain("Não foi possível entrar agora");
    });

    // Critério 5
    it("sinaliza campos vazios e não tenta autenticar", async () => {
        const { onSignIn, user } = renderLogin();

        await user.click(screen.getByRole("button", { name: "Entrar" }));

        expect(screen.getByText("Informe o CPF.")).toBeTruthy();
        expect(screen.getByText("Informe a senha.")).toBeTruthy();
        expect(login).not.toHaveBeenCalled();
        expect(onSignIn).not.toHaveBeenCalled();
    });

    it("sinaliza CPF com formato inválido e não tenta autenticar", async () => {
        const { user } = renderLogin();

        await fillAndSubmit(user, { cpf: "11111111111", password: "senha123" });

        expect(screen.getByText("CPF com formato inválido.")).toBeTruthy();
        expect(screen.getByLabelText("CPF").getAttribute("aria-invalid")).toBe(
            "true",
        );
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
});
