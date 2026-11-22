import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { App } from "@/app/App";
import { resetDemoData } from "@/features/auth/demoTools";

vi.mock("@/features/auth/authMode", () => ({ isMockAuthEnabled: true }));

afterEach(() => {
    cleanup();
    localStorage.clear();
    window.location.hash = "";
});

it.each([
    ["Aceitar pré-reserva", "Aceito"],
    ["Recusar solicitação", "Recusado"],
])(
    "HU47 demonstração: %s persiste o resultado ao reabrir o app",
    async (action, status) => {
        const user = userEvent.setup();
        const app = render(<App />);
        await user.click(screen.getByText("Modo local · Explorar telas"));
        await user.click(
            screen.getByRole("button", {
                name: "Entrar como produtora de teste",
            }),
        );
        await waitFor(() => expect(window.location.hash).toBe("#/conta"));
        await user.click(screen.getByRole("button", { name: "Notificações" }));
        await user.click(
            await screen.findByRole("link", {
                name: /Responder: Ana Oliveira/,
            }),
        );
        await user.click(
            await screen.findByRole("link", {
                name: "Ver experiência: Visita e Degustação de Queijos",
            }),
        );
        await screen.findByRole("heading", {
            name: "Visita e Degustação de Queijos",
        });
        await user.click(screen.getByRole("button", { name: "Voltar" }));
        await screen.findByRole("heading", { name: "Pendente" });
        const message = "Resposta de validação da HU47.";
        await user.type(
            await screen.findByRole("textbox", {
                name: /Mensagem para Ana Oliveira/,
            }),
            message,
        );
        await user.click(screen.getByRole("button", { name: action }));
        if (status === "Recusado") {
            await user.click(
                screen.getByRole("button", {
                    name: "Sim, cancelar solicitação",
                }),
            );
        }
        await screen.findByRole("heading", { name: "Resposta enviada" });
        await user.click(
            screen.getByRole("button", { name: "Ver pré-reservas" }),
        );
        await user.click(
            await screen.findByRole("link", {
                name: /Ver detalhes: Ana Oliveira/,
            }),
        );

        app.unmount();
        render(<App />);
        await screen.findByRole("heading", { name: status });
        expect(screen.getByText(message)).toBeTruthy();
        expect(screen.queryByRole("button", { name: action })).toBeNull();
        expect(resetDemoData("all")).toBe(true);
    },
);
