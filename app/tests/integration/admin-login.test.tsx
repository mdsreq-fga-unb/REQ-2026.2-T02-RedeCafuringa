import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AdminLoginPage } from "@/features/auth/adminRegistration";
import { login } from "@/features/auth/authService";
import { InvalidCredentialsError } from "@/features/auth/errors";

vi.mock("@/features/auth/authService", () => ({ login: vi.fn() }));
afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

const adminAuth = {
    token: "t",
    user: { id: "1", name: "Administrador", role: "admin" as const },
};

async function fill(user: ReturnType<typeof userEvent.setup>) {
    await user.type(screen.getByLabelText("E-mail"), "admin@exemplo.com");
    await user.type(screen.getByLabelText("Senha"), "senha123");
    await user.click(screen.getByRole("button", { name: "Entrar" }));
}

describe("login administrativo — HU03", () => {
    it("valida o formulário com as mensagens e associações acessíveis", async () => {
        const user = userEvent.setup();
        render(<AdminLoginPage onNavigate={vi.fn()} onSignIn={vi.fn()} />);
        await user.click(screen.getByRole("button", { name: "Entrar" }));
        expect(screen.getByRole("alert").textContent).toBe(
            "Revise os campos indicados.",
        );
        expect(screen.getAllByText("Campo obrigatório.")).toHaveLength(2);
        const email = screen.getByLabelText("E-mail");
        expect(document.activeElement).toBe(email);
        expect(email.getAttribute("aria-invalid")).toBe("true");
        expect(email.getAttribute("aria-describedby")).toBe(
            "demo-admin-email-error",
        );
        await user.type(email, "invalido");
        await user.type(screen.getByLabelText("Senha"), "curta");
        await user.click(screen.getByRole("button", { name: "Entrar" }));
        expect(screen.getByText("Informe um e-mail válido.")).toBeTruthy();
        expect(
            screen.getByText("A senha precisa ter ao menos 8 caracteres."),
        ).toBeTruthy();
        expect(login).not.toHaveBeenCalled();
    });

    it("entra com e-mail e senha reais, registra a sessão e vai para o acesso administrativo", async () => {
        const user = userEvent.setup();
        const onSignIn = vi.fn();
        const onNavigate = vi.fn();
        vi.mocked(login).mockResolvedValue(adminAuth);
        render(<AdminLoginPage onNavigate={onNavigate} onSignIn={onSignIn} />);

        await fill(user);

        await waitFor(() => expect(onSignIn).toHaveBeenCalledWith(adminAuth));
        expect(login).toHaveBeenCalledWith({
            email: "admin@exemplo.com",
            password: "senha123",
        });
        expect(onNavigate).toHaveBeenCalledWith("/admin/acesso");
    });

    it("recusa conta que não é de administrador sem abrir sessão", async () => {
        const user = userEvent.setup();
        const onSignIn = vi.fn();
        vi.mocked(login).mockResolvedValue({
            token: "t",
            user: { id: "2", name: "Ana", role: "consumer" },
        });
        render(<AdminLoginPage onNavigate={vi.fn()} onSignIn={onSignIn} />);

        await fill(user);

        expect((await screen.findByRole("alert")).textContent).toBe(
            "Esta conta não é de administrador.",
        );
        expect(onSignIn).not.toHaveBeenCalled();
    });

    it("mostra 'E-mail ou senha inválidos' para credenciais erradas", async () => {
        const user = userEvent.setup();
        vi.mocked(login).mockRejectedValue(new InvalidCredentialsError());
        render(<AdminLoginPage onNavigate={vi.fn()} onSignIn={vi.fn()} />);

        await fill(user);

        expect((await screen.findByRole("alert")).textContent).toBe(
            "E-mail ou senha inválidos",
        );
    });

    it("preserva os campos quando a conexão falha (RNF07)", async () => {
        const user = userEvent.setup();
        vi.mocked(login).mockRejectedValue(new Error("Falha ao autenticar"));
        render(<AdminLoginPage onNavigate={vi.fn()} onSignIn={vi.fn()} />);

        await fill(user);

        expect((await screen.findByRole("alert")).textContent).toContain(
            "Não foi possível entrar agora",
        );
        expect(
            (screen.getByLabelText("E-mail") as HTMLInputElement).value,
        ).toBe("admin@exemplo.com");
        expect((screen.getByLabelText("Senha") as HTMLInputElement).value).toBe(
            "senha123",
        );
    });
});
