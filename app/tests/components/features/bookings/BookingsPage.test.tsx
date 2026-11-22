import {
    cleanup,
    render,
    screen,
    waitFor,
    within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BookingsPage } from "@/features/bookings/BookingsPage";
import type { BookingDetail } from "@/features/bookings/bookingDetails";
import type { BookingPage } from "@/features/bookings/bookingQueryService";
import { BookingSessionError } from "@/features/bookings/bookingService";

afterEach(cleanup);

function booking(overrides: Partial<BookingDetail> = {}): BookingDetail {
    return {
        id: "b1",
        experienceId: "e1",
        date: "2026-12-20",
        time: "09:00",
        participants: 2,
        paymentMethod: "pix",
        status: "pendente",
        createdAt: "2026-11-19T13:00:00.000Z",
        updatedAt: "2026-11-19T13:00:00.000Z",
        experience: {
            name: "Sabores e caminhos do Cerrado",
            local: "Sítio Raízes",
            pricePerPerson: 45,
            available: true,
        },
        counterpart: { id: "c1", name: "Ana Souza" },
        ...overrides,
    };
}

const page = (items: BookingDetail[], total = items.length): BookingPage => ({
    items,
    total,
});

function renderPage(props: Partial<Parameters<typeof BookingsPage>[0]> = {}) {
    const load = vi.fn().mockResolvedValue(
        page([
            booking(),
            booking({
                id: "b2",
                status: "aceita",
                participants: 1,
                experience: {
                    name: "Manhã de agroecologia",
                    local: "Horta da Maria",
                    pricePerPerson: 30,
                    available: true,
                },
            }),
        ]),
    );
    const onNavigate = vi.fn();
    const view = render(
        <BookingsPage
            role="consumer"
            load={load}
            onNavigate={onNavigate}
            {...props}
        />,
    );
    return { ...view, load, onNavigate };
}

const cards = () => screen.getAllByRole("article");

describe("HU45 — lista de pré-reservas", () => {
    describe("CA01, CA02: consumidora", () => {
        it("mostra o título e carrega as solicitações dela", async () => {
            const { load } = renderPage();

            expect(
                screen.getByRole("heading", {
                    level: 1,
                    name: "Minhas pré-reservas",
                }),
            ).toBeTruthy();
            expect(screen.getByRole("status").textContent).toMatch(
                /Carregando pré-reservas/,
            );
            await waitFor(() => expect(cards()).toHaveLength(2));
            expect(load).toHaveBeenCalledTimes(1);
        });

        it("cada card mostra a experiência, a data, o horário, os participantes e a situação", async () => {
            renderPage();

            const [primeiro, segundo] = await screen.findAllByRole("article");
            const first = within(primeiro);
            expect(
                first.getByRole("heading", {
                    level: 2,
                    name: "Sabores e caminhos do Cerrado",
                }),
            ).toBeTruthy();
            expect(
                first.getByText("20/12/2026 · 09h00 · 2 participantes"),
            ).toBeTruthy();
            expect(first.getByText("Aguardando resposta")).toBeTruthy();
            expect(
                within(segundo).getByText("Aceita pela produtora"),
            ).toBeTruthy();
            expect(within(segundo).getByText(/1 participante$/)).toBeTruthy();
        });

        it("não mostra o nome da consumidora para ela mesma", async () => {
            renderPage();

            await screen.findAllByRole("article");
            expect(screen.queryByText(/Ana Souza/)).toBeNull();
        });
    });

    describe("CA01, CA03: produtora", () => {
        it("mostra as recebidas com o nome de quem pediu", async () => {
            renderPage({
                role: "producer",
                load: vi.fn().mockResolvedValue(page([booking()])),
            });

            expect(
                screen.getByRole("heading", {
                    level: 1,
                    name: "Pré-reservas recebidas",
                }),
            ).toBeTruthy();
            const [card] = await screen.findAllByRole("article");
            expect(
                within(card).getByText("Solicitada por Ana Souza"),
            ).toBeTruthy();
        });
    });

    describe("CA04: abrir uma solicitação", () => {
        it("Ver solicitação leva ao detalhe daquela pré-reserva", async () => {
            const user = userEvent.setup();
            const { onNavigate } = renderPage();

            const [, segundo] = await screen.findAllByRole("article");
            await user.click(
                within(segundo).getByRole("button", {
                    name: /Ver solicitação/,
                }),
            );

            expect(onNavigate).toHaveBeenCalledWith("/reservas/b2");
        });

        it("o botão diz de qual experiência é a solicitação", async () => {
            renderPage();

            const [primeiro] = await screen.findAllByRole("article");
            expect(
                within(primeiro).getByRole("button", {
                    name: "Ver solicitação: Sabores e caminhos do Cerrado",
                }),
            ).toBeTruthy();
        });
    });

    describe("CA06: sem solicitações", () => {
        it("consumidora: avisa e oferece explorar experiências", async () => {
            const user = userEvent.setup();
            const { onNavigate } = renderPage({
                load: vi.fn().mockResolvedValue(page([])),
            });

            expect(
                (
                    await screen.findByText("Você ainda não tem pré-reservas.")
                ).closest("[role=status]"),
            ).toBeTruthy();
            await user.click(
                screen.getByRole("button", { name: "Explorar experiências" }),
            );
            expect(onNavigate).toHaveBeenCalledWith("/experiencias");
        });

        it("produtora: avisa que não há solicitações para as experiências dela", async () => {
            renderPage({
                role: "producer",
                load: vi.fn().mockResolvedValue(page([])),
            });

            expect(
                await screen.findByText(
                    "Ainda não há pré-reservas para as suas experiências.",
                ),
            ).toBeTruthy();
            expect(
                screen.queryByRole("button", {
                    name: "Explorar experiências",
                }),
            ).toBeNull();
        });
    });

    it("informa quando há mais solicitações do que as mostradas", async () => {
        renderPage({
            load: vi.fn().mockResolvedValue(
                page(
                    Array.from({ length: 50 }, (_, index) =>
                        booking({ id: `b${index + 1}` }),
                    ),
                    60,
                ),
            ),
        });

        expect(
            await screen.findByText(
                "A lista mostra apenas as 50 pré-reservas mais recentes.",
            ),
        ).toBeTruthy();
        expect(await screen.findByText("Mostrando 50 de 60")).toBeTruthy();
    });

    describe("falhas", () => {
        it("erro de rede: avisa e permite tentar de novo", async () => {
            const user = userEvent.setup();
            const load = vi
                .fn()
                .mockRejectedValueOnce(new Error("rede"))
                .mockResolvedValueOnce(page([booking()]));
            renderPage({ load });

            expect((await screen.findByRole("alert")).textContent).toMatch(
                /Não foi possível carregar as pré-reservas/,
            );
            await user.click(
                screen.getByRole("button", { name: "Tentar novamente" }),
            );

            await waitFor(() => expect(cards()).toHaveLength(1));
            expect(load).toHaveBeenCalledTimes(2);
            expect(screen.queryByRole("alert")).toBeNull();
        });

        it.each([
            ["consumer", "/login/consumer"],
            ["producer", "/login/producer"],
        ] as const)(
            "sessão expirada (%s): pede para entrar de novo",
            async (role, loginRoute) => {
                const user = userEvent.setup();
                const { onNavigate } = renderPage({
                    role,
                    load: vi.fn().mockRejectedValue(new BookingSessionError()),
                });

                expect((await screen.findByRole("alert")).textContent).toMatch(
                    /Sua sessão expirou/,
                );
                expect(
                    screen.queryByRole("button", { name: "Tentar novamente" }),
                ).toBeNull();
                await user.click(
                    screen.getByRole("button", { name: "Entrar" }),
                );
                expect(onNavigate).toHaveBeenCalledWith(loginRoute);
            },
        );
    });

    describe("RNF04: acessibilidade", () => {
        it.each([
            ["com solicitações", page([booking(), booking({ id: "b2" })])],
            ["sem solicitações", page([])],
        ])("sem violações WCAG A/AA: %s", async (_caso, result) => {
            const { container } = renderPage({
                load: vi.fn().mockResolvedValue(result),
            });
            await waitFor(() =>
                expect(screen.queryByText(/Carregando/)).toBeNull(),
            );

            const report = await axe.run(container, {
                runOnly: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
                rules: { "color-contrast": { enabled: false } },
            });

            expect(report.violations).toEqual([]);
        });
    });
});
