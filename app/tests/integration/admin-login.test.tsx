import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { AdminLoginPage } from "@/features/auth/adminRegistration";

vi.mock("@/features/auth/authMode", () => ({ isMockAuthEnabled: true }));
afterEach(cleanup);

it("valida o login administrativo com as mensagens e associações do formulário", async () => {
    const user = userEvent.setup();
    render(<AdminLoginPage onNavigate={vi.fn()} />);
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
    await user.clear(email);
    await user.type(email, "admin@exemplo.com");
    await user.clear(screen.getByLabelText("Senha"));
    await user.type(screen.getByLabelText("Senha"), "senha123");
    await user.click(screen.getByRole("button", { name: "Entrar" }));
    expect(
        screen.getByRole("heading", { name: "Acesso administrativo local" }),
    ).toBeTruthy();
});
