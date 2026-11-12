import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "@/app/App";
import { listProducts } from "@/features/offers/productService";
import type { Product } from "@/features/offers/productTypes";

vi.mock("@/features/offers/productService");

const products: Product[] = [
    {
        id: "mel",
        name: "Mel do Cerrado",
        producerName: "Dona Maria",
        price: 32,
        unit: "unidade",
        image: "https://exemplo.com/mel.jpg",
    },
    {
        id: "cesta",
        name: "Cesta da estação",
        producerName: "Sítio Raízes",
        price: 40,
        unit: "cesta",
        image: "https://exemplo.com/cesta.jpg",
    },
];

beforeEach(() => {
    vi.mocked(listProducts).mockResolvedValue(products);
    localStorage.clear();
    window.location.hash = "#/produtos";
});

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    localStorage.clear();
    window.location.hash = "";
});

describe("catálogo de produtos no app", () => {
    it("mostra o catálogo ao visitante sem pedir login (CA02 e CA07)", async () => {
        render(<App />);

        expect(
            await screen.findByRole("heading", { name: "Catálogo de Produtos" }),
        ).toBeTruthy();
        expect(await screen.findByText("Mel do Cerrado")).toBeTruthy();
        expect(screen.getByText("Sítio Raízes")).toBeTruthy();
        expect(window.location.hash).toBe("#/produtos");
        expect(
            screen.queryByRole("heading", { name: "Entre em sua conta" }),
        ).toBeNull();
    });

    it("abre os detalhes do produto ao acionar o card (CA05)", async () => {
        const user = userEvent.setup();
        render(<App />);

        await user.click(
            await screen.findByRole("button", { name: /Mel do Cerrado/ }),
        );

        expect(window.location.hash).toBe("#/oferta/mel");
        expect(
            await screen.findByRole("heading", { name: "Mel do Cerrado" }),
        ).toBeTruthy();
    });

    it("mostra o erro e recarrega ao tentar novamente (CA08)", async () => {
        vi.mocked(listProducts)
            .mockRejectedValueOnce(new Error("falhou"))
            .mockResolvedValueOnce(products);
        const user = userEvent.setup();
        render(<App />);

        expect((await screen.findByRole("alert")).textContent).toContain(
            "Não foi possível carregar os produtos.",
        );
        await user.click(
            screen.getByRole("button", { name: "Tentar novamente" }),
        );

        expect(await screen.findByText("Mel do Cerrado")).toBeTruthy();
        expect(screen.queryByRole("alert")).toBeNull();
    });

    it("abre os detalhes de um produto que só existe no catálogo e volta (CA05)", async () => {
        const user = userEvent.setup();
        render(<App />);

        await user.click(
            await screen.findByRole("button", { name: /Cesta da estação/ }),
        );

        expect(window.location.hash).toBe("#/oferta/cesta");
        expect(
            await screen.findByRole("heading", { name: "Cesta da estação" }),
        ).toBeTruthy();

        await user.click(screen.getByRole("button", { name: "Voltar" }));

        expect(window.location.hash).toBe("#/produtos");
        expect(await screen.findByText("Sítio Raízes")).toBeTruthy();
    });
});