import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RegisterPage } from "@/features/register/RegisterPage";
import { registerProducer } from "@/features/register/registerService";

vi.mock("@/features/register/registerService");

async function fillAndSubmit(user: ReturnType<typeof userEvent.setup>) {
    await user.type(
        screen.getByLabelText("Nome da iniciativa"),
        "Maria da Silva",
    );
    await user.type(screen.getByLabelText("Responsável"), "Seu João");
    await user.type(screen.getByLabelText("CPF"), "52998224725");
    await user.type(screen.getByLabelText("Data de nascimento"), "10051990");
    await user.type(screen.getByLabelText("Telefone"), "61912345678");
    await user.type(screen.getByLabelText("E-mail"), "maria@exemplo.com");
    await user.type(
        screen.getByLabelText("Localidade"),
        "Chácara 12, Núcleo Rural, Brasília - DF",
    );
    await user.type(screen.getByLabelText("Senha"), "senha-segura-1");
    await user.type(screen.getByLabelText("Confirmar senha"), "senha-segura-1");
    await user.click(screen.getByRole("button", { name: "Continuar" }));
}

describe("RegisterPage sem natureza — HU02", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        cleanup();
    });

    it("não pergunta a natureza do cadastro", () => {
        render(<RegisterPage onNavigate={vi.fn()} />);

        expect(
            screen.queryByRole("group", { name: "Natureza do cadastro" }),
        ).toBeNull();
        expect(screen.queryByRole("radio", { name: "Propriedade" })).toBeNull();
    });

    it("envia o cadastro sem pedir para escolher natureza", async () => {
        vi.mocked(registerProducer).mockResolvedValue({ ok: true });
        render(<RegisterPage onNavigate={vi.fn()} />);

        await fillAndSubmit(userEvent.setup());

        await waitFor(() => expect(registerProducer).toHaveBeenCalledTimes(1));
        const payload = vi.mocked(registerProducer).mock.calls[0][0];
        expect(Object.keys(payload)).not.toContain("nature");
    });

    it("mostra o aviso de falha no topo do formulário, fora de qualquer grupo", async () => {
        vi.mocked(registerProducer).mockResolvedValue({
            ok: false,
            reason: "error",
        });
        render(<RegisterPage onNavigate={vi.fn()} />);

        await fillAndSubmit(userEvent.setup());

        const alert = await screen.findByRole("alert");
        expect(alert.closest("fieldset")).toBeNull();
        expect(alert.closest("form")?.firstElementChild?.contains(alert)).toBe(
            true,
        );
    });
});
