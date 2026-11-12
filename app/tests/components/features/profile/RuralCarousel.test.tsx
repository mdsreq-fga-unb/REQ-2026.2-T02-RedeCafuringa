import {
    act,
    cleanup,
    fireEvent,
    render,
    screen,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RuralCarousel } from "@/features/profile/RuralCarousel";

afterEach(() => {
    cleanup();
    vi.useRealTimers();
});

describe("carrossel rural", () => {
    it("oferece navegação circular com botões e indicadores acessíveis", async () => {
        const user = userEvent.setup();
        render(<RuralCarousel />);
        expect(
            screen.getByRole("img", { name: "Paisagem rural ao pôr do sol" }),
        ).toBeTruthy();
        await user.click(
            screen.getByRole("button", { name: "Próxima imagem" }),
        );
        expect(
            screen.getByRole("img", { name: "Cultivo e trabalho no campo" }),
        ).toBeTruthy();
        expect(
            screen
                .getByRole("button", { name: "Ir para imagem 2" })
                .getAttribute("aria-current"),
        ).toBe("true");
        await user.click(
            screen.getByRole("button", { name: "Ir para imagem 3" }),
        );
        await user.click(
            screen.getByRole("button", { name: "Próxima imagem" }),
        );
        expect(
            screen.getByRole("img", { name: "Paisagem rural ao pôr do sol" }),
        ).toBeTruthy();
        await user.click(
            screen.getByRole("button", { name: "Imagem anterior" }),
        );
        expect(
            screen.getByRole("img", {
                name: "Horta e alimentos cultivados na terra",
            }),
        ).toBeTruthy();
    });

    it("responde às setas do teclado e ao deslize sem bloquear rolagem vertical", () => {
        render(<RuralCarousel />);
        const carousel = screen.getByRole("region", {
            name: "Paisagens da vida rural",
        });
        fireEvent.keyDown(carousel, { key: "ArrowRight" });
        expect(
            screen.getByRole("img", { name: "Cultivo e trabalho no campo" }),
        ).toBeTruthy();
        fireEvent.touchStart(carousel, { touches: [{ clientX: 180 }] });
        fireEvent.touchEnd(carousel, { changedTouches: [{ clientX: 80 }] });
        expect(
            screen.getByRole("img", {
                name: "Horta e alimentos cultivados na terra",
            }),
        ).toBeTruthy();
        fireEvent.touchStart(carousel, { touches: [{ clientX: 100 }] });
        fireEvent.touchEnd(carousel, { changedTouches: [{ clientX: 105 }] });
        expect(
            screen.getByRole("img", {
                name: "Horta e alimentos cultivados na terra",
            }),
        ).toBeTruthy();
    });

    it("não gira sozinho ao abrir e permite reproduzir, pausar e suspender ao interagir", () => {
        vi.useFakeTimers();
        render(<RuralCarousel />);
        act(() => {
            vi.advanceTimersByTime(12000);
        });
        expect(
            screen.getByRole("img", { name: "Paisagem rural ao pôr do sol" }),
        ).toBeTruthy();
        fireEvent.click(
            screen.getByRole("button", { name: "Reproduzir carrossel" }),
        );
        act(() => {
            vi.advanceTimersByTime(6000);
        });
        expect(
            screen.getByRole("img", { name: "Cultivo e trabalho no campo" }),
        ).toBeTruthy();
        const carousel = screen.getByRole("region", {
            name: "Paisagens da vida rural",
        });
        fireEvent.mouseEnter(carousel);
        act(() => {
            vi.advanceTimersByTime(12000);
        });
        expect(
            screen.getByRole("img", { name: "Cultivo e trabalho no campo" }),
        ).toBeTruthy();
        fireEvent.mouseLeave(carousel);
        fireEvent.click(
            screen.getByRole("button", { name: "Pausar carrossel" }),
        );
        act(() => {
            vi.advanceTimersByTime(12000);
        });
        expect(
            screen.getByRole("img", { name: "Cultivo e trabalho no campo" }),
        ).toBeTruthy();
    });

    it("mantém título e navegação disponíveis se a foto falhar", () => {
        render(<RuralCarousel />);
        fireEvent.error(screen.getByRole("img"));
        expect(screen.queryByRole("img")).toBeNull();
        expect(
            screen.getByRole("heading", { name: "Servimos a terra." }),
        ).toBeTruthy();
        fireEvent.click(screen.getByRole("button", { name: "Próxima imagem" }));
        expect(
            screen.getByRole("img", { name: "Cultivo e trabalho no campo" }),
        ).toBeTruthy();
    });
});
