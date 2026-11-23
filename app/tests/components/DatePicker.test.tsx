import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DatePicker } from "@/components/ui/DatePicker";

afterEach(cleanup);

function renderPicker(onSelect = vi.fn()) {
    render(
        <>
            <DatePicker
                id="calendario"
                label="Escolha a data"
                selectedDate={null}
                minDate={new Date(Date.UTC(2026, 0, 1))}
                maxDate={new Date(Date.UTC(2026, 11, 31))}
                onSelect={onSelect}
            >
                <input aria-label="Data" />
            </DatePicker>
            <button type="button">Fora do calendário</button>
        </>,
    );
    return {
        user: userEvent.setup(),
        onSelect,
        trigger: screen.getByRole("button", { name: "Abrir calendário" }),
    };
}

describe("DatePicker: foco e fechamento (acessibilidade)", () => {
    it("move o foco para o calendário ao abri-lo", async () => {
        const { user, trigger } = renderPicker();

        await user.click(trigger);

        const dialog = screen.getByRole("dialog", { name: "Escolha a data" });
        expect(dialog.contains(document.activeElement)).toBe(true);
    });

    it("Escape fecha o calendário e devolve o foco ao botão que o abriu", async () => {
        const { user, trigger } = renderPicker();
        await user.click(trigger);

        await user.keyboard("{Escape}");

        expect(screen.queryByRole("dialog")).toBeNull();
        expect(document.activeElement).toBe(trigger);
    });

    it("fecha ao escolher um dia e devolve o foco ao botão", async () => {
        const { user, trigger, onSelect } = renderPicker();
        await user.click(trigger);

        const days = screen
            .getAllByRole("button")
            .filter((button) => /^\d+ de /.test(button.ariaLabel ?? ""));
        await user.click(days[0]);

        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(screen.queryByRole("dialog")).toBeNull();
        expect(document.activeElement).toBe(trigger);
    });

    it("fecha ao clicar fora do calendário", async () => {
        const { user, trigger } = renderPicker();
        await user.click(trigger);

        await user.click(
            screen.getByRole("button", { name: "Fora do calendário" }),
        );

        expect(screen.queryByRole("dialog")).toBeNull();
    });
});
