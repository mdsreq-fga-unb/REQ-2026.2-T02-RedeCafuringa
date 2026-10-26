import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LoginPage } from "@/features/auth";

afterEach(cleanup);

describe("página de autenticação demonstrativa", () => {
    it("solicita entrada como consumidor ao selecionar essa opção", () => {
        const onSignIn = vi.fn();
        render(
            <LoginPage
                loginName="Visitante"
                onLoginNameChange={vi.fn()}
                onNavigate={vi.fn()}
                onSignIn={onSignIn}
            />,
        );

        fireEvent.click(
            screen.getByRole("button", { name: "Entrar como consumidor" }),
        );

        expect(onSignIn).toHaveBeenCalledWith("consumer");
    });
});
