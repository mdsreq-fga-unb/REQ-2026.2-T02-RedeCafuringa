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
import { listMockBookings } from "@/features/bookings/mockBookingService";

vi.mock("@/features/auth/authMode", () => ({ isMockAuthEnabled: true }));

// O login usa o mock, onde estão as contas de demonstração.
vi.mock("@/features/auth/authService", async (importOriginal) => {
    const original =
        await importOriginal<typeof import("@/features/auth/authService")>();
    const { loginMock } = await import("@/features/auth/mockAuth");
    return { ...original, isMockAuthEnabled: true, login: loginMock };
});

const OFFER_ROUTE = "#/oferta/queijos?tipo=experiencia";
const OFFER_TITLE = "Visita e Degustação de Queijos";

describe("HU44 — solicitar pré-reserva de experiência", () => {
    beforeEach(() => {
        localStorage.clear();
        window.location.hash = "";
    });

    afterEach(() => {
        cleanup();
        localStorage.clear();
        window.location.hash = "";
    });

    it("visitante pede a pré-reserva, entra e volta ao formulário até a confirmação", async () => {
        window.location.hash = OFFER_ROUTE;
        render(<App />);
        const user = userEvent.setup();

        // CA01: a experiência disponível oferece a pré-reserva.
        await user.click(
            await screen.findByRole("button", {
                name: "Solicitar pré-reserva",
            }),
        );

        // CA02: sem sessão, vai ao login do consumidor lembrando a experiência.
        expect(await screen.findByLabelText("E-mail")).toBeTruthy();
        expect(window.location.hash).toBe(
            "#/login/consumer?pre-reserva=queijos",
        );
        await user.type(screen.getByLabelText("E-mail"), "ana@exemplo.com");
        await user.type(screen.getByLabelText("Senha"), "senha123");
        await user.click(screen.getByRole("button", { name: "Entrar" }));

        // Volta ao formulário da mesma experiência.
        expect(
            await screen.findByRole("heading", {
                name: "Planeje seu encontro",
            }),
        ).toBeTruthy();
        expect(window.location.hash).toBe("#/pre-reserva/queijos");
        expect(screen.getByText("Anfitrião: Jefferson Sooma")).toBeTruthy();

        // CA03 e CA05: preenche e envia.
        fireEvent.change(screen.getByLabelText("Data desejada"), {
            target: { value: "2030-01-15" },
        });
        await user.click(screen.getByLabelText("Horário"));
        await user.click(screen.getByRole("button", { name: "09h00" }));
        await user.selectOptions(screen.getByLabelText("Participantes"), "2");
        await user.selectOptions(
            screen.getByLabelText("Forma de pagamento"),
            "pix",
        );
        await user.click(
            screen.getByRole("button", { name: "Enviar pré-reserva" }),
        );

        // CA06: confirmação e pré-reserva registrada como pendente (RN19).
        expect(
            await screen.findByRole("heading", { name: "Solicitação enviada" }),
        ).toBeTruthy();
        expect(window.location.hash).toBe("#/pre-reserva-enviada");
        expect(listMockBookings()).toEqual([
            expect.objectContaining({
                experienciaId: "queijos",
                data: "2030-01-15",
                horario: "09:00",
                participantes: 2,
                formaPagamento: "pix",
                status: "pendente",
            }),
        ]);

        await user.click(
            screen.getByRole("button", { name: "Continuar explorando" }),
        );
        expect(window.location.hash).toBe("#/explorar");
    }, 15000);

    it("produtor não vê o botão e não abre o formulário", async () => {
        window.location.hash = "#/explorar";
        render(<App />);
        const user = userEvent.setup();

        await user.click(
            await screen.findByRole("button", {
                name: "Entrar como produtora de teste",
            }),
        );
        // O login de teste termina depois do clique: espera a sessão existir.
        await waitFor(() =>
            expect(localStorage.getItem("cafuringa-role")).toBe("producer"),
        );

        window.location.hash = OFFER_ROUTE;
        expect(
            await screen.findByRole("heading", { name: OFFER_TITLE }),
        ).toBeTruthy();
        expect(
            screen.queryByRole("button", { name: "Solicitar pré-reserva" }),
        ).toBeNull();

        window.location.hash = "#/pre-reserva/queijos";
        await waitFor(() => expect(window.location.hash).toBe("#/conta"));
        expect(
            screen.queryByRole("heading", { name: "Planeje seu encontro" }),
        ).toBeNull();
    }, 15000);
});
