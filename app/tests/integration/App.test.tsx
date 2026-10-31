import {
    cleanup,
    fireEvent,
    render,
    screen,
    waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "@/app/App";
import { login } from "@/features/auth/authService";

vi.mock("@/features/auth/authService");

async function signInAsConsumer() {
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText("CPF"), "52998224725");
    await user.type(screen.getByLabelText("Senha"), "senha123");
    await user.click(screen.getByRole("button", { name: "Entrar" }));
}

beforeEach(() => {
    vi.mocked(login).mockResolvedValue({
        token: "token-falso",
        user: { id: 1, name: "Gabriela", role: "consumer" },
    });
    localStorage.clear();
    window.location.hash = "#/perfil";
});

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    localStorage.clear();
    window.location.hash = "";
});

describe("fluxo de contato da aplicação", () => {
    it("leva visitante ao login ao tentar falar com a responsável", async () => {
        localStorage.setItem(
            "cafuringa-contact",
            JSON.stringify({
                whatsappNumber: "5561999999999",
                authorized: true,
            }),
        );
        render(<App />);

        fireEvent.click(
            screen.getByRole("button", { name: "Conversar pelo WhatsApp" }),
        );

        expect(
            await screen.findByRole("heading", {
                name: "Entre para falar com o responsável",
            }),
        ).toBeTruthy();
        expect(window.location.hash).toBe("#/entrar?contato=perfil");
    });

    it("abre o WhatsApp depois do login e sem salvar conversa no app", async () => {
        localStorage.setItem(
            "cafuringa-contact",
            JSON.stringify({
                whatsappNumber: "5561999999999",
                authorized: true,
            }),
        );
        const openWhatsApp = vi
            .spyOn(window, "open")
            .mockImplementation(() => null);
        render(<App />);

        fireEvent.click(
            screen.getByRole("button", { name: "Conversar pelo WhatsApp" }),
        );
        await signInAsConsumer();

        await waitFor(() => expect(openWhatsApp).toHaveBeenCalledOnce());
        expect(openWhatsApp).toHaveBeenCalledWith(
            expect.stringContaining("https://wa.me/5561999999999"),
            "_blank",
            "noopener,noreferrer",
        );
        const contactUrl = new URL(String(openWhatsApp.mock.calls[0][0]));
        expect(contactUrl.searchParams.get("text")).toContain(
            "Perfil de Dona Maria",
        );
        expect(window.location.hash).toBe("#/perfil");
        expect(screen.queryByRole("textbox", { name: /mensagem/i })).toBeNull();
        expect(localStorage.getItem("cafuringa-conversations")).toBeNull();
    });

    it.each([
        { route: "#/oferta/mel", title: "Mel do Cerrado" },
        {
            route: "#/oferta/queijos",
            title: "Visita e Degustação de Queijos",
        },
    ])(
        "mantém a oferta $title ao abrir o WhatsApp",
        async ({ route, title }) => {
            localStorage.setItem(
                "cafuringa-contact",
                JSON.stringify({
                    whatsappNumber: "5561999999999",
                    authorized: true,
                }),
            );
            window.location.hash = route;
            const openWhatsApp = vi
                .spyOn(window, "open")
                .mockImplementation(() => null);
            render(<App />);

            fireEvent.click(
                screen.getByRole("button", { name: "Conversar pelo WhatsApp" }),
            );
            await signInAsConsumer();

            await waitFor(() => expect(openWhatsApp).toHaveBeenCalledOnce());
            const contactUrl = new URL(String(openWhatsApp.mock.calls[0][0]));
            expect(contactUrl.pathname).toBe("/5561999999999");
            expect(contactUrl.searchParams.get("text")).toContain(title);
            expect(window.location.hash).toBe(route);
            expect(screen.getByRole("heading", { name: title })).toBeTruthy();
            expect(localStorage.getItem("cafuringa-conversations")).toBeNull();
        },
    );
});
