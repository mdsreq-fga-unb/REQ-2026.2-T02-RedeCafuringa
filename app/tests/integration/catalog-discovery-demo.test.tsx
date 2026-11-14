import {
    cleanup,
    fireEvent,
    render,
    screen,
    within,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { App } from "@/app/App";
import { fillProduct, openProduct, session } from "../fixtures/hu15";
import { experience, fillExperience, openExperience } from "../fixtures/hu21";

vi.mock("@/features/auth/authMode", () => ({ isMockAuthEnabled: true }));
vi.mock("@/features/profile/publicProfileService", () => ({
    listPublicProducers: vi.fn().mockResolvedValue([]),
    listProducerOffers: vi.fn().mockResolvedValue([]),
}));
beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.hash = "";
});
afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    localStorage.clear();
    sessionStorage.clear();
});

it("produto criado aparece no perfil, na prévia e no catálogo e persiste após recarregar", async () => {
    session();
    const { user } = await openProduct();
    const f = await fillProduct(user);
    fireEvent.change(f.nome, { target: { value: "Produto recém-publicado" } });
    await user.click(screen.getByRole("button", { name: "Adicionar produto" }));
    await screen.findByRole("heading", { name: "Sua oferta está na rede" });
    await user.click(screen.getByRole("button", { name: "Voltar" }));
    expect(
        await screen.findByRole("button", { name: /Produto recém-publicado/ }),
    ).toBeTruthy();
    await user.click(
        screen.getByRole("button", { name: /Produto recém-publicado/ }),
    );
    await screen.findByRole("heading", { name: "Produto recém-publicado" });
    await user.click(screen.getByRole("button", { name: "Voltar" }));
    expect(window.location.hash).toBe("#/catalogo");
    await user.click(screen.getByRole("button", { name: "Painel" }));
    const preview = await screen.findByRole("region", {
        name: "Prévia de produtos",
    });
    expect(
        await within(preview).findByRole("button", {
            name: /Produto recém-publicado/,
        }),
    ).toBeTruthy();
    expect(within(preview).getAllByRole("listitem")).toHaveLength(2);
    await user.click(
        within(preview).getByRole("button", { name: /Ver mais produtos/ }),
    );
    expect(window.location.hash).toBe("#/produtos");
    expect(
        await screen.findByRole("button", { name: /Produto recém-publicado/ }),
    ).toBeTruthy();
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    cleanup();
    render(<App />);
    expect(
        await screen.findByRole("button", { name: /Produto recém-publicado/ }),
    ).toBeTruthy();
});

it("limita experiências na página inicial e mostra todas em Ver mais", async () => {
    localStorage.setItem(
        "cafuringa-demo-offers",
        JSON.stringify(
            [1, 2, 3].map((id) => ({
                ...experience,
                id: `passeio-${id}`,
                nome: `Passeio ${id}`,
            })),
        ),
    );
    window.location.hash = "#/explorar";
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: /Experiências Viva/ }));
    const preview = screen.getByRole("region", {
        name: "Prévia de experiências",
    });
    await within(preview).findByRole("button", { name: /Passeio 1/ });
    expect(within(preview).getAllByRole("listitem")).toHaveLength(2);
    await user.click(
        within(preview).getByRole("button", { name: /Ver mais experiências/ }),
    );
    expect(
        await screen.findByRole("button", { name: /Passeio 3/ }),
    ).toBeTruthy();
    expect(screen.getAllByRole("listitem")).toHaveLength(4);
});

it("experiência aparece na categoria correta e Voltar restaura a tela de origem", async () => {
    session();
    const { user } = await openExperience();
    const f = await fillExperience(user);
    fireEvent.change(f.nome, { target: { value: "Passeio recém-publicado" } });
    await user.click(
        screen.getByRole("button", { name: "Adicionar experiência" }),
    );
    await screen.findByRole("heading", { name: "Sua oferta está na rede" });
    await user.click(screen.getByRole("button", { name: "Voltar" }));
    await user.click(screen.getByRole("button", { name: "Painel" }));
    await user.click(screen.getByRole("button", { name: /Experiências Viva/ }));
    const preview = await screen.findByRole("region", {
        name: "Prévia de experiências",
    });
    await user.click(
        await within(preview).findByRole("button", {
            name: /Passeio recém-publicado/,
        }),
    );
    expect(
        await screen.findByRole("heading", { name: "Passeio recém-publicado" }),
    ).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Voltar" }));
    expect(window.location.hash).toBe("#/explorar");
    expect(
        screen.getByRole("region", { name: "Prévia de experiências" }),
    ).toBeTruthy();
    await user.click(
        screen.getByRole("button", { name: /Ver mais experiências/ }),
    );
    expect(window.location.hash).toBe("#/experiencias");
    await user.click(
        await screen.findByRole("button", { name: /Passeio recém-publicado/ }),
    );
    await user.click(screen.getByRole("button", { name: "Voltar" }));
    expect(window.location.hash).toBe("#/experiencias");
});
