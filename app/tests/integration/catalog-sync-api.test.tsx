import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { App } from "@/app/App";
import {
    fillProduct,
    json,
    openProduct,
    product,
    session,
} from "../fixtures/hu15";

vi.mock("@/features/auth/authMode", () => ({ isMockAuthEnabled: false }));
beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.hash = "";
});
afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    localStorage.clear();
    sessionStorage.clear();
});

it("modo normal consulta novamente a API e mostra o produto salvo sem gravá-lo como demo", async () => {
    session();
    let saved = false;
    const api = vi
        .fn<typeof fetch>()
        .mockImplementation(async (input, init) => {
            const path = new URL(String(input), "http://localhost").pathname;
            if (path.endsWith("/auth/me"))
                return json({
                    id: product.produtor.id,
                    nome: "Horta da Joana",
                    perfil: "PRODUTOR",
                });
            if (path.endsWith("/products") && init?.method === "POST") {
                saved = true;
                return json(product, 201);
            }
            if (path.endsWith("/products"))
                return json({
                    itens: saved ? [{ ...product, disponivel: true }] : [],
                    total: saved ? 1 : 0,
                    pagina: 1,
                    limite: 50,
                });
            return json({ message: "Not found" }, 404);
        });
    vi.stubGlobal("fetch", api);
    const { user } = await openProduct();
    await fillProduct(user);
    await user.click(screen.getByRole("button", { name: "Adicionar produto" }));
    await screen.findByRole("heading", { name: "Sua oferta está na rede" });
    cleanup();
    window.location.hash = "#/produtos";
    render(<App />);
    expect(
        await screen.findByRole("button", { name: new RegExp(product.nome) }),
    ).toBeTruthy();
    expect(localStorage.getItem("cafuringa-demo-offers")).toBeNull();
    await user.click(
        screen.getByRole("button", { name: new RegExp(product.nome) }),
    );
    await user.click(screen.getByRole("button", { name: "Voltar" }));
    expect(window.location.hash).toBe("#/produtos");
});
