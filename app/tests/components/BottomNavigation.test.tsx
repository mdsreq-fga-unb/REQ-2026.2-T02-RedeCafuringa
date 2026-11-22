import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BottomNavigation } from "@/components";

afterEach(cleanup);

function renderNav(path: string) {
    const onNavigate = vi.fn();
    render(
        <BottomNavigation path={path} role={null} onNavigate={onNavigate} />,
    );
    return { onNavigate };
}

describe("BottomNavigation: Explorar", () => {
    it("leva à exploração de produtores (HU14 CA01)", () => {
        const { onNavigate } = renderNav("/perfil");

        fireEvent.click(screen.getByRole("button", { name: "Explorar" }));

        expect(onNavigate).toHaveBeenCalledWith("/explorar");
    });

    it.each(["/explorar", "/perfil", "/catalogo", "/produtos", "/produtor/p1"])(
        "fica ativo em %s",
        (path) => {
            renderNav(path);

            expect(
                screen.getByRole("button", { name: "Explorar" }).className,
            ).toBe("active");
        },
    );

    it("não fica ativo em outras telas", () => {
        renderNav("/conta");

        expect(screen.getByRole("button", { name: "Explorar" }).className).toBe(
            "",
        );
    });
});

describe("BottomNavigation: Pré-reservas (HU45 CA01)", () => {
    function renderAs(role: "consumer" | "producer", path: string) {
        const onNavigate = vi.fn();
        render(
            <BottomNavigation
                path={path}
                role={role}
                onNavigate={onNavigate}
            />,
        );
        return { onNavigate };
    }

    const bookings = () => screen.getByRole("button", { name: "Pré-reservas" });

    it("a produtora ganha o item Pré-reservas, sem perder o Adicionar", () => {
        const { onNavigate } = renderAs("producer", "/explorar");

        expect(screen.getByRole("button", { name: "Adicionar" })).toBeTruthy();
        expect(
            screen
                .getByRole("navigation", { name: "Navegação principal" })
                .querySelectorAll("button"),
        ).toHaveLength(5);

        fireEvent.click(bookings());
        expect(onNavigate).toHaveBeenCalledWith("/reservas");
    });

    it("a consumidora continua com um único item Pré-reservas", () => {
        const { onNavigate } = renderAs("consumer", "/explorar");

        expect(
            screen.getAllByRole("button", { name: "Pré-reservas" }),
        ).toHaveLength(1);
        fireEvent.click(bookings());
        expect(onNavigate).toHaveBeenCalledWith("/reservas");
    });

    it.each([
        ["consumer", "/reservas"],
        ["consumer", "/reservas/b1"],
        ["producer", "/reservas"],
        ["producer", "/reservas/b1"],
    ] as const)("fica ativo para %s em %s", (role, path) => {
        renderAs(role, path);

        expect(bookings().getAttribute("aria-current")).toBe("page");
        expect(bookings().className).toBe("active");
    });

    it("na lista da produtora, o Adicionar não fica ativo", () => {
        renderAs("producer", "/reservas");

        const add = screen.getByRole("button", { name: "Adicionar" });
        expect(add.getAttribute("aria-current")).toBeNull();
        expect(add.className).toBe("");
    });
});
