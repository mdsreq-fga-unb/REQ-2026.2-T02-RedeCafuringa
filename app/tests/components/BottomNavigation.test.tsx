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
    it("leva ao catálogo de produtos (CA01)", () => {
        const { onNavigate } = renderNav("/perfil");

        fireEvent.click(screen.getByRole("button", { name: "Explorar" }));

        expect(onNavigate).toHaveBeenCalledWith("/produtos");
    });

    it.each(["/perfil", "/catalogo", "/produtos"])(
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
