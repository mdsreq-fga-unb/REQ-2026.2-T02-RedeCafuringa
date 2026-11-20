import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BookingRoutePage } from "@/features/bookings/BookingRoutePage";

vi.mock("@/features/bookings/bookingService", () => ({
    createBooking: vi.fn(),
}));

afterEach(() => {
    cleanup();
});

const experience = {
    id: "e1",
    name: "Trilha guiada da nascente",
    producerName: "Jefferson Sooma",
    local: "Cafuringa, DF",
    duracao: "2 horas",
};

const renderRoute = (loadExperience: ReturnType<typeof vi.fn>) => {
    const props = {
        experienceId: "e1",
        onBack: vi.fn(),
        onSent: vi.fn(),
        loadExperience,
    };
    render(<BookingRoutePage {...props} />);
    return props;
};

const formHeading = () =>
    screen.findByRole("heading", { name: "Planeje seu encontro" });

describe("BookingRoutePage (HU44 CA01 e CA07)", () => {
    it("mostra que está carregando e ainda não mostra o formulário", () => {
        renderRoute(vi.fn(() => new Promise(() => {})));
        expect(screen.getByRole("status").textContent).toBe(
            "Carregando experiência…",
        );
        expect(
            screen.queryByRole("heading", { name: "Planeje seu encontro" }),
        ).toBeNull();
    });

    it("pede a experiência da rota, com possibilidade de cancelar", async () => {
        const load = vi.fn().mockResolvedValue(experience);
        renderRoute(load);
        expect(load).toHaveBeenCalledWith("e1", expect.any(AbortSignal));
        await formHeading();
    });

    it("mostra o formulário com os dados da experiência quando ela existe", async () => {
        renderRoute(vi.fn().mockResolvedValue(experience));
        expect(await formHeading()).toBeTruthy();
        expect(screen.getByText("Anfitrião: Jefferson Sooma")).toBeTruthy();
    });

    it("avisa que a experiência não está disponível (CA07)", async () => {
        renderRoute(vi.fn().mockResolvedValue(null));
        expect((await screen.findByRole("alert")).textContent).toBe(
            "Esta experiência não está disponível para pré-reserva.",
        );
        expect(
            screen.queryByRole("heading", { name: "Planeje seu encontro" }),
        ).toBeNull();
    });

    it("volta quando a experiência não está disponível", async () => {
        const { onBack } = renderRoute(vi.fn().mockResolvedValue(null));
        await screen.findByRole("alert");
        await userEvent.click(screen.getByRole("button", { name: /voltar/i }));
        expect(onBack).toHaveBeenCalledTimes(1);
    });

    it("avisa quando não consegue carregar a experiência", async () => {
        renderRoute(vi.fn().mockRejectedValue(new Error("falhou")));
        expect((await screen.findByRole("alert")).textContent).toBe(
            "Não foi possível carregar a experiência. Tente novamente.",
        );
        expect(
            screen.getByRole("button", { name: "Tentar novamente" }),
        ).toBeTruthy();
    });

    it("tenta carregar de novo quando o usuário pede", async () => {
        const load = vi
            .fn()
            .mockRejectedValueOnce(new Error("falhou"))
            .mockResolvedValue(experience);
        renderRoute(load);
        await userEvent.click(
            await screen.findByRole("button", { name: "Tentar novamente" }),
        );
        expect(await formHeading()).toBeTruthy();
        expect(load).toHaveBeenCalledTimes(2);
    });

    it("repassa o Voltar do formulário", async () => {
        const { onBack } = renderRoute(vi.fn().mockResolvedValue(experience));
        await formHeading();
        await userEvent.click(screen.getByRole("button", { name: /voltar/i }));
        expect(onBack).toHaveBeenCalledTimes(1);
    });
});
