import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "@/app/App";
import { registerAdmin } from "@/features/auth/registrationService";

vi.mock("@/features/auth/registrationService", () => ({
    registerConsumer: vi.fn(),
    registerAdmin: vi.fn(),
}));

beforeEach(() => {
    vi.mocked(registerAdmin).mockResolvedValue(undefined);
    window.location.hash = "#/admin/acesso";
});

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    window.location.hash = "";
});

async function openAdminRegistration(user: ReturnType<typeof userEvent.setup>) {
    render(<App />);
    await user.click(
        await screen.findByRole("button", { name: "Cadastrar adm" }),
    );
    await user.click(screen.getByRole("button", { name: "Continuar" }));
    expect(
        await screen.findByRole("heading", {
            name: "Cadastro de administrador",
        }),
    ).toBeTruthy();
}

describe("cadastro de administrador — HU03", () => {
    it("percorre escolha, formulário e confirmação do cadastro", async () => {
        const user = userEvent.setup();
        await openAdminRegistration(user);

        await user.type(screen.getByLabelText("E-mail"), "Admin@Exemplo.com");
        await user.type(screen.getByLabelText("Senha"), "SenhaForte123");
        await user.type(
            screen.getByLabelText("Confirmar senha"),
            "SenhaForte123",
        );
        await user.click(screen.getByRole("button", { name: "Entrar" }));

        await waitFor(() =>
            expect(registerAdmin).toHaveBeenCalledWith({
                email: "Admin@Exemplo.com",
                senha: "SenhaForte123",
            }),
        );
        expect(
            await screen.findByRole("heading", {
                name: "Usuário admin cadastrado com sucesso!",
            }),
        ).toBeTruthy();
    });

    it("bloqueia campos obrigatórios, e-mail inválido e senhas divergentes", async () => {
        const user = userEvent.setup();
        await openAdminRegistration(user);

        await user.click(screen.getByRole("button", { name: "Entrar" }));
        expect(screen.getByRole("alert").textContent).toContain(
            "Revise os campos indicados",
        );
        expect(screen.getAllByText("Campo obrigatório.")).toHaveLength(3);
        for (const label of ["E-mail", "Senha", "Confirmar senha"]) {
            expect(
                (screen.getByLabelText(label) as HTMLInputElement).getAttribute(
                    "aria-invalid",
                ),
            ).toBe("true");
        }
        expect(registerAdmin).not.toHaveBeenCalled();

        await user.type(screen.getByLabelText("E-mail"), "email-invalido");
        await user.type(screen.getByLabelText("Senha"), "curta");
        await user.type(
            screen.getByLabelText("Confirmar senha"),
            "SenhaDiferente123",
        );
        await user.click(screen.getByRole("button", { name: "Entrar" }));

        expect(screen.getByText("Informe um e-mail válido.")).toBeTruthy();
        expect(
            screen.getByText(
                "A senha precisa ter ao menos 8 caracteres, uma letra e um número.",
            ),
        ).toBeTruthy();
        expect(screen.getByText("As senhas não coincidem.")).toBeTruthy();
        const invalidEmail = screen.getByLabelText(
            "E-mail",
        ) as HTMLInputElement;
        expect(invalidEmail.getAttribute("aria-invalid")).toBe("true");
        expect(
            screen.getByText("Informe um e-mail válido.").getAttribute("id"),
        ).toBe(invalidEmail.getAttribute("aria-describedby"));
        expect(registerAdmin).not.toHaveBeenCalled();
    });

    it("mostra o conflito de e-mail duplicado sem perder o preenchimento", async () => {
        const user = userEvent.setup();
        vi.mocked(registerAdmin).mockRejectedValue(
            new Error("E-mail já cadastrado"),
        );
        await openAdminRegistration(user);

        await user.type(
            screen.getByLabelText("E-mail"),
            "existente@exemplo.com",
        );
        await user.type(screen.getByLabelText("Senha"), "SenhaForte123");
        await user.type(
            screen.getByLabelText("Confirmar senha"),
            "SenhaForte123",
        );
        await user.click(screen.getByRole("button", { name: "Entrar" }));

        expect((await screen.findByRole("alert")).textContent).toContain(
            "E-mail já cadastrado",
        );
        expect(
            (screen.getByLabelText("E-mail") as HTMLInputElement).value,
        ).toBe("existente@exemplo.com");
        expect((screen.getByLabelText("Senha") as HTMLInputElement).value).toBe(
            "SenhaForte123",
        );
    });

    it("preserva os dados para nova tentativa quando a conexão falha", async () => {
        const user = userEvent.setup();
        vi.mocked(registerAdmin).mockRejectedValue(
            new Error("Falha na conexão. Tente novamente."),
        );
        await openAdminRegistration(user);

        await user.type(screen.getByLabelText("E-mail"), "ana@exemplo.com");
        await user.type(screen.getByLabelText("Senha"), "SenhaForte123");
        await user.type(
            screen.getByLabelText("Confirmar senha"),
            "SenhaForte123",
        );
        await user.click(screen.getByRole("button", { name: "Entrar" }));

        expect((await screen.findByRole("alert")).textContent).toContain(
            "Falha na conexão. Tente novamente.",
        );
        expect(
            (screen.getByLabelText("E-mail") as HTMLInputElement).value,
        ).toBe("ana@exemplo.com");
        expect((screen.getByLabelText("Senha") as HTMLInputElement).value).toBe(
            "SenhaForte123",
        );
        expect(
            (screen.getByLabelText("Confirmar senha") as HTMLInputElement)
                .value,
        ).toBe("SenhaForte123");
    });
});
