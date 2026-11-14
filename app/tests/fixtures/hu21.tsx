import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { App } from "@/app/App";

// Convenções propostas para a fase RED; ver hu21-tdd.md.
export const experienceRoute = "#/experiencias/nova";
export const experiencePath = "/api/v1/experiences";
export const token = "hu21-producer-token";
export const producerId = "64b0c0ffee0000000000abcd";
export const experience = {
    id: "64b0c0ffee0000000000beef",
    nome: "Visita e Degustação de Queijo",
    categoria: "Experiência",
    descricao:
        "Caminhe pelo sítio, conheça a produção familiar e prove sabores da estação. Use calçado fechado e leve água.",
    valorPorPessoa: 45,
    local: "Sítio Raízes, Cafuringa, DF",
    duracao: "2 horas",
    fotos: ["/api/v1/experiences/foto.webp"],
    produtor: { id: producerId, nomeIniciativa: "Horta da Joana" },
};

export function json(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { "content-type": "application/json" },
    });
}

export function session(role: "producer" | "consumer" | "admin" = "producer") {
    localStorage.setItem("cafuringa-role", role);
    localStorage.setItem("cafuringa-token", token);
    localStorage.setItem("cafuringa-user-id", producerId);
    localStorage.setItem("cafuringa-name", "Horta da Joana");
}

export function mockExperienceApi(
    save: (init: RequestInit) => Response | Promise<Response> = () =>
        json(experience, 201),
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
                            : localStorage.getItem("cafuringa-role") === "admin"
                              ? "ADMINISTRADOR"
                              : "PRODUTOR",
                });
            if (path === experiencePath && init.method === "POST")
                return save(init);
            if (path === `${experiencePath}/${experience.id}`)
                return json(experience);
            if (
                path === experiencePath &&
                (!init.method || init.method === "GET")
            )
                return json([experience]);
            throw new Error(
                `HTTP não previsto pela fixture HU21: ${init.method ?? "GET"} ${path}`,
            );
        });
    vi.stubGlobal("fetch", api);
    return api;
}

export function submissions(api: ReturnType<typeof mockExperienceApi>) {
    return api.mock.calls.filter(
        ([input, init]) =>
            new URL(String(input), "http://localhost").pathname ===
                experiencePath && init?.method === "POST",
    );
}

export async function openExperience() {
    window.location.hash = experienceRoute;
    const view = render(<App />);
    // Falha pelo comportamento ausente, sem importar módulos ainda inexistentes.
    expectHeading();
    return { ...view, user: userEvent.setup() };
}

function expectHeading() {
    screen.getByRole("heading", { name: "Divulgue uma experiência" });
}

export function fields() {
    return {
        nome: screen.getByLabelText(/^Título/i) as HTMLInputElement,
        categoria: screen.getByRole("combobox", {
            name: /^Categoria/i,
        }) as HTMLSelectElement,
        descricao: screen.getByLabelText(/^Descrição/i) as HTMLTextAreaElement,
        local: screen.getByLabelText(/^Local/i) as HTMLInputElement,
        duracao: screen.getByLabelText(/^Duração/i) as HTMLInputElement,
        preco: screen.getByLabelText(/^Valor por pessoa/i) as HTMLInputElement,
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
    return new File([bytes], "visita.png", { type: "image/png" });
}

export async function fillExperience(user: ReturnType<typeof userEvent.setup>) {
    const f = fields();
    fireEvent.change(f.nome, { target: { value: experience.nome } });
    await user.selectOptions(f.categoria, "Experiência");
    fireEvent.change(f.descricao, { target: { value: experience.descricao } });
    fireEvent.change(f.preco, { target: { value: "45" } });
    fireEvent.change(f.local, { target: { value: experience.local } });
    fireEvent.change(f.duracao, { target: { value: experience.duracao } });
    await user.upload(f.fotos, photo());
    return f;
}

export function submit() {
    const form = fields().nome.closest("form");
    if (!form)
        throw new Error("Os campos da HU21 devem pertencer a um formulário.");
    fireEvent.submit(form);
}
