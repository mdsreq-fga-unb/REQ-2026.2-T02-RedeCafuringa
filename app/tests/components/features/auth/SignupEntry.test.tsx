import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LoginPage } from "@/features/auth";

describe("Entrada do cadastro de consumidor — HU01", () => {
    afterEach(() => cleanup());

    it("permite iniciar o cadastro a partir da tela de login", async () => {
        const onNavigate = vi.fn();
        const user = userEvent.setup();
        render(<LoginPage onNavigate={onNavigate} onSignIn={vi.fn()} />);

        await user.click(screen.getByRole("link", { name: "Criar uma conta" }));

        expect(onNavigate).toHaveBeenCalledWith("/cadastro/consumidor");
    });
});
