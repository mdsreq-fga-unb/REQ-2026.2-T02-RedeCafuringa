import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "@/app/App";
import { registerConsumer } from "@/features/auth/registrationService";

vi.mock("@/features/auth/registrationService", () => ({
    registerConsumer: vi.fn(),
}));

beforeEach(() => {
    vi.mocked(registerConsumer).mockResolvedValue(undefined);
    window.location.hash = "#/escolher-perfil";
});

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    window.location.hash = "";
});

describe("integração do cadastro de consumidor — HU01", () => {
    it("percorre seleção, cadastro, envio e confirmação", async () => {
        const user = userEvent.setup();
        render(<App />);

        expect(
            await screen.findByRole("heading", { name: "Entre em sua conta" }),
        ).toBeTruthy();
        await user.click(
            screen.getByRole("button", { name: /Sou consumidor/ }),
        );
        await user.click(screen.getByRole("button", { name: "Continuar" }));

        expect(
            await screen.findByRole("heading", {
                name: "Que bom ter você aqui",
            }),
        ).toBeTruthy();
        await user.click(screen.getByRole("link", { name: "Criar uma conta" }));

        expect(
            await screen.findByRole("heading", {
                name: "Cadastro de consumidor",
            }),
        ).toBeTruthy();
        await user.type(
            screen.getByLabelText("Nome completo"),
            "Gabriela Pereira da Silva",
        );
        await user.type(screen.getByLabelText("CPF"), "52998224725");
        await user.type(
            screen.getByLabelText("E-mail"),
            "gabriela@exemplo.com",
        );
        await user.type(screen.getByLabelText("Senha"), "SenhaForte123");
        await user.type(
            screen.getByLabelText("Confirmar senha"),
            "SenhaForte123",
        );
        await user.click(screen.getByRole("button", { name: "Criar conta" }));

        await waitFor(() =>
            expect(registerConsumer).toHaveBeenCalledWith({
                nome: "Gabriela Pereira da Silva",
                cpf: "529.982.247-25",
                email: "gabriela@exemplo.com",
                senha: "SenhaForte123",
            }),
        );
        expect(
            await screen.findByRole("heading", {
                name: "Você já faz parte da rede",
            }),
        ).toBeTruthy();
    });
});
