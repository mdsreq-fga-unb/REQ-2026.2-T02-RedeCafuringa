import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { App } from "@/app/App";
import type { components } from "@/shared/api/schema";

export const producerId = "64b0c0ffee0000000000abcd";
export const token = "hu12-producer-token";
export const ownPath = "/api/v1/producers/me/trajectory";
export const publicPath = `/api/v1/producers/${producerId}/trajectory`;
export const editorRoute = "#/minha-trajetoria";
export const signupRoute = "#/cadastro/trajetoria";
export const publicRoute = `#/produtor/${producerId}`;
export const story =
    "Nossa família cultiva alimentos agroecológicos desde 1990.";
export const activities = "Hortaliças da estação, cestas e visitas guiadas.";
export const ownTrajectory = {
    trajetoria: story,
    atividades: activities,
    telefone: "61999999999",
    telefonePublico: false,
} satisfies components["schemas"]["OwnTrajectoryResponse"];
export const publicTrajectory = {
    id: producerId,
    nomeIniciativa: "Horta da Maria",
    categoriaOfertada: "Produtos",
    trajetoria: story,
    atividades: activities,
} satisfies components["schemas"]["PublicTrajectoryResponse"];

export function json(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { "content-type": "application/json" },
    });
}

export function seedSession(
    role: "producer" | "consumer" | "admin" = "producer",
) {
    localStorage.setItem("cafuringa-role", role);
    localStorage.setItem("cafuringa-name", "Horta da Maria");
    localStorage.setItem("cafuringa-token", token);
}

type Handler = (init: RequestInit) => Response | Promise<Response>;

/** Fronteira HTTP real do frontend; não simula o componente a implementar. */
export function mockTrajectoryApi(
    options: {
        own?: components["schemas"]["OwnTrajectoryResponse"];
        publicData?: components["schemas"]["PublicTrajectoryResponse"];
        getOwn?: Handler;
        save?: Handler;
        getPublic?: Handler;
        register?: Handler;
        login?: Handler;
    } = {},
) {
    const fetchMock = vi
        .fn<typeof fetch>()
        .mockImplementation(async (input, init = {}) => {
            const path = new URL(String(input), "http://localhost").pathname;
            const method = init.method ?? "GET";
            if (path === "/api/v1/auth/me")
                return json({
                    id: producerId,
                    nome: "Horta da Maria",
                    perfil: "PRODUTOR",
                    email: "maria@example.com",
                    cpf: "***.982.247-**",
                });
            if (path === "/api/v1/users/producers" && method === "POST")
                return (
                    options.register?.(init) ?? json({ id: producerId }, 201)
                );
            if (path === "/api/v1/auth/login" && method === "POST")
                return (
                    options.login?.(init) ??
                    json({
                        accessToken: token,
                        tokenType: "Bearer",
                        expiresIn: 900,
                        usuario: {
                            id: producerId,
                            nome: "Horta da Maria",
                            email: "maria@example.com",
                            perfil: "PRODUTOR",
                        },
                    } satisfies components["schemas"]["LoginResponse"])
                );
            if (path === ownPath && method === "GET")
                return (
                    options.getOwn?.(init) ?? json(options.own ?? ownTrajectory)
                );
            if (path === ownPath && method === "PUT")
                return (
                    options.save?.(init) ??
                    json({
                        ...JSON.parse(String(init.body)),
                        atualizadoEm: "2026-11-06T12:00:00.000Z",
                    })
                );
            if (path === publicPath && method === "GET")
                return (
                    options.getPublic?.(init) ??
                    json(options.publicData ?? publicTrajectory)
                );
            throw new Error(
                `Requisição fora do contrato HU12: ${method} ${path}`,
            );
        });
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
}

export function callsTo(
    fetchMock: ReturnType<typeof mockTrajectoryApi>,
    path: string,
    method = "GET",
) {
    return fetchMock.mock.calls.filter(
        ([input, init]) =>
            new URL(String(input), "http://localhost").pathname === path &&
            (init?.method ?? "GET") === method,
    );
}

export async function openEditor() {
    window.location.hash = editorRoute;
    const rendered = render(<App />);
    // A ausência desta tela é a falha funcional esperada na fase RED.
    expectHeading();
    // O usuário só pode editar depois do carregamento: os campos ficam
    // desabilitados enquanto a consulta inicial está pendente.
    await waitFor(() => {
        if (screen.queryByText("Carregando sua trajetória…"))
            throw new Error("Aguardando o carregamento da trajetória");
    });
    return { ...rendered, user: userEvent.setup() };
}

function expectHeading() {
    return screen.getByRole("heading", { name: "Conte sua história" });
}

export function fillTrajectory(text = story, work = activities) {
    fireEvent.change(screen.getByLabelText(/^Minha Trajetória/i), {
        target: { value: text },
    });
    fireEvent.change(
        screen.getByLabelText(/^Produção\s*\/\s*Experiências\s*\/\s*Eventos/i),
        { target: { value: work } },
    );
}

export async function selectPhoto(user: ReturnType<typeof userEvent.setup>) {
    // PNG válido de 1 × 1: só testa a seleção local, não inventa upload no backend.
    const bytes = Uint8Array.from(
        atob(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aD1sAAAAASUVORK5CYII=",
        ),
        (c) => c.charCodeAt(0),
    );
    const file = new File([bytes], "horta.png", { type: "image/png" });
    await user.upload(screen.getByLabelText(/^Adicionar foto/i), file);
    return file;
}

export async function fillProducerDetails() {
    fireEvent.click(screen.getByRole("checkbox", { name: "Pix" }));
    const fields = [
        ["Nome da iniciativa", "Horta da Maria"],
        ["Responsável", "Maria da Silva"],
        ["CPF", "52998224725"],
        ["Data de nascimento", "10-05-1990"],
        ["Telefone", "61999999999"],
        ["E-mail", "maria@example.com"],
        ["Localidade", "Chácara 12, Núcleo Rural"],
        ["Senha", "SenhaSegura123"],
        ["Confirmar senha", "SenhaSegura123"],
    ];
    for (const [label, value] of fields)
        fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

export async function continueSignup() {
    window.location.hash = "#/cadastro";
    render(<App />);
    await fillProducerDetails();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Continuar" }));
    await waitFor(() => expectHeading());
    return user;
}
