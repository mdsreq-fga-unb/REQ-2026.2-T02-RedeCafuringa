import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { App } from "@/app/App";

// Convenções propostas para a fase RED; ver hu15-tdd.md.
export const productRoute = "#/produtos/novo";
export const productPath = "/api/v1/products";
export const token = "hu15-producer-token";
export const producerId = "64b0c0ffee0000000000abcd";
export const product = {
    id: "64b0c0ffee0000000000beef",
    nome: "Cesta da estação",
    categoria: "Produtos",
    disponivel: true,
    descricao: "Mel produzido no território da Cafuringa.",
    precoPorUnidade: 40,
    gramasPorUnidade: 500,
    fotos: ["/api/v1/products/foto.webp"],
    produtor: { id: producerId, nomeIniciativa: "Horta da Joana" },
};

export function json(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { "content-type": "application/json" },
    });
}

export function session(role: "producer" | "consumer" = "producer") {
    localStorage.setItem("cafuringa-role", role);
    localStorage.setItem("cafuringa-token", token);
    localStorage.setItem("cafuringa-user-id", producerId);
    localStorage.setItem("cafuringa-name", "Horta da Joana");
}

export function mockProductApi(
    save: (init: RequestInit) => Response | Promise<Response> = () =>
        json(product, 201),
) {
    const api = vi
        .fn<typeof fetch>()
        .mockImplementation(async (input, init = {}) => {
            const path = new URL(String(input), "http://localhost").pathname;
            if (path === "/api/v1/auth/me")
                return json({
                    id: producerId,
                    nome: "Horta da Joana",
                    perfil:
                        localStorage.getItem("cafuringa-role") === "consumer"
                            ? "CONSUMIDOR"
                            : "PRODUTOR",
                });
            if (path === productPath && init.method === "POST")
                return save(init);
            if (path === `${productPath}/${product.id}`) return json(product);
            if (path === productPath && (!init.method || init.method === "GET"))
                return json({
                    itens: [product],
                    total: 1,
                    pagina: 1,
                    limite: 50,
                });
            throw new Error(
                `HTTP não previsto pela fixture HU15: ${init.method ?? "GET"} ${path}`,
            );
        });
    vi.stubGlobal("fetch", api);
    return api;
}

export function submissions(api: ReturnType<typeof mockProductApi>) {
    return api.mock.calls.filter(
        ([input, init]) =>
            new URL(String(input), "http://localhost").pathname ===
                productPath && init?.method === "POST",
    );
}

export async function openProduct() {
    window.location.hash = productRoute;
    const view = render(<App />);
    // Falha pelo comportamento ausente, sem importar módulos ainda inexistentes.
    expectHeading();
    return { ...view, user: userEvent.setup() };
}

function expectHeading() {
    screen.getByRole("heading", { name: "Divulgue um produto" });
}

export function fields() {
    return {
        nome: screen.getByLabelText(/^Nome\s*\*?$/i) as HTMLInputElement,
        categoria: screen.getByRole("combobox", {
            name: /^Categoria/i,
        }) as HTMLSelectElement,
        descricao: screen.getByLabelText(/^Descrição/i) as HTMLTextAreaElement,
        preco: screen.getByLabelText(/^Preço por unidade/i) as HTMLInputElement,
        gramas: screen.getByLabelText(
            /^Gramas por unidade/i,
        ) as HTMLInputElement,
        fotos: screen.getByLabelText(/^Adicionar fotos/i) as HTMLInputElement,
    };
}

export function photo() {
    // PNG 1x1 válido, sem depender de arquivos externos.
    const bytes = Uint8Array.from(
        atob(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
        ),
        (char) => char.charCodeAt(0),
    );
    return new File([bytes], "cesta.png", { type: "image/png" });
}

export async function fillProduct(user: ReturnType<typeof userEvent.setup>) {
    const f = fields();
    fireEvent.change(f.nome, { target: { value: product.nome } });
    await user.selectOptions(f.categoria, "Produtos");
    fireEvent.change(f.descricao, { target: { value: product.descricao } });
    fireEvent.change(f.preco, { target: { value: "40" } });
    fireEvent.change(f.gramas, { target: { value: "500" } });
    await user.upload(f.fotos, photo());
    return f;
}

export function submit() {
    const form = fields().nome.closest("form");
    if (!form)
        throw new Error("Os campos da HU15 devem pertencer a um formulário.");
    fireEvent.submit(form);
}
