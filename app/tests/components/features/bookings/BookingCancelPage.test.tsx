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
import { BookingCancelPage } from "@/features/bookings/BookingCancelPage";
import { BookingCancelError } from "@/features/bookings/bookingCancelService";
import type { BookingDetail } from "@/features/bookings/bookingDetails";
import { BookingSessionError } from "@/features/bookings/bookingService";
import type { Booking } from "@/features/bookings/bookingTypes";

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
        counterpart: { id: "p1", name: "Sítio Raízes" },
        ...overrides,
    };
}

const cancelled: Booking = {
    id: "b1",
    experienceId: "e1",
    date: "2026-12-20",
    time: "09:00",
    participants: 2,
    paymentMethod: "pix",
    status: "cancelada",
    createdAt: "2026-11-19T13:00:00.000Z",
};

function renderPage(
    props: Partial<Parameters<typeof BookingCancelPage>[0]> = {},
) {
    const load = vi.fn().mockResolvedValue(booking());
    const cancel = vi.fn().mockResolvedValue(cancelled);
    const onNavigate = vi.fn();
    const view = render(
        <BookingCancelPage
            id="b1"
            load={load}
            cancel={cancel}
            onNavigate={onNavigate}
            {...props}
        />,
    );
    return { ...view, load, cancel, onNavigate };
}

const confirmButton = () =>
    screen.getByRole("button", { name: "Sim, cancelar solicitação" });
const keepButton = () =>
    screen.getByRole("button", { name: "Manter solicitação" });
const ready = () =>
    screen.findByRole("heading", { level: 1, name: "Cancelar solicitação?" });

describe("HU46 — confirmar o cancelamento", () => {
    describe("CA02: pede a confirmação", () => {
        it("carrega a pré-reserva e mostra o resumo e o aviso", async () => {
            const { load } = renderPage();

            expect(screen.getByRole("status").textContent).toMatch(
                /Carregando pré-reserva/,
            );
            await ready();
            expect(load.mock.calls[0][0]).toBe("b1");
            expect(
                screen.getByRole("heading", {
                    level: 2,
                    name: "Sabores e caminhos do Cerrado",
                }),
            ).toBeTruthy();
            const details = within(
                screen.getByRole("list", { name: "Dados da solicitação" }),
            );
            expect(details.getByText("Sítio Raízes")).toBeTruthy();
            expect(details.getByText("20/12/2026")).toBeTruthy();
            expect(details.getByText("09h00")).toBeTruthy();
            expect(details.getByText("2 participantes")).toBeTruthy();
            expect(
                screen.getByText(
                    "Sua pré-reserva de 20/12/2026 será cancelada. A produtora verá a solicitação como cancelada.",
                ),
            ).toBeTruthy();
            expect(confirmButton()).toBeTruthy();
            expect(keepButton()).toBeTruthy();
        });
    });

    describe("CA04: desistir antes de confirmar", () => {
        it("Manter solicitação volta ao detalhe sem cancelar", async () => {
            const user = userEvent.setup();
            const { cancel, onNavigate } = renderPage();
            await ready();

            await user.click(keepButton());

            expect(onNavigate).toHaveBeenCalledWith("/reservas/b1");
            expect(cancel).not.toHaveBeenCalled();
        });

        it("Voltar também volta ao detalhe sem cancelar", async () => {
            const user = userEvent.setup();
            const { cancel, onNavigate } = renderPage();
            await ready();

            await user.click(screen.getByRole("button", { name: "Voltar" }));

            expect(onNavigate).toHaveBeenCalledWith("/reservas/b1");
            expect(cancel).not.toHaveBeenCalled();
        });
    });

    describe("CA03: confirmar", () => {
        it("cancela uma única vez e desabilita o botão enquanto envia", async () => {
            const user = userEvent.setup();
            let finish: (value: Booking) => void = () => {};
            const cancel = vi.fn().mockReturnValue(
                new Promise<Booking>((resolve) => {
                    finish = resolve;
                }),
            );
            renderPage({ cancel });
            await ready();

            await user.click(confirmButton());

            expect(cancel).toHaveBeenCalledTimes(1);
            expect(cancel.mock.calls[0][0]).toBe("b1");
            expect((confirmButton() as HTMLButtonElement).disabled).toBe(true);
            expect((keepButton() as HTMLButtonElement).disabled).toBe(true);
            await user.click(confirmButton());
            expect(cancel).toHaveBeenCalledTimes(1);

            finish(cancelled);
            await screen.findByRole("heading", {
                name: "Solicitação cancelada",
            });
        });

        it("no sucesso, confirma e oferece os próximos passos", async () => {
            const user = userEvent.setup();
            const { onNavigate } = renderPage();
            await ready();

            await user.click(confirmButton());

            expect(
                await screen.findByRole("heading", {
                    level: 1,
                    name: "Solicitação cancelada",
                }),
            ).toBeTruthy();
            expect(
                screen.getByText(
                    "Você cancelou a pré-reserva de Sabores e caminhos do Cerrado.",
                ),
            ).toBeTruthy();
            await user.click(
                screen.getByRole("button", { name: "Voltar às pré-reservas" }),
            );
            expect(onNavigate).toHaveBeenCalledWith("/reservas");
            await user.click(
                screen.getByRole("button", {
                    name: "Descobrir outras experiências",
                }),
            );
            expect(onNavigate).toHaveBeenCalledWith("/experiencias");
        });
    });

    describe("CA07: falha no cancelamento", () => {
        it("informa que não foi concluído, mantém a situação e permite tentar de novo", async () => {
            const user = userEvent.setup();
            const cancel = vi
                .fn()
                .mockRejectedValueOnce(new Error("rede"))
                .mockResolvedValueOnce(cancelled);
            renderPage({ cancel });
            await ready();

            await user.click(confirmButton());

            expect((await screen.findByRole("alert")).textContent).toBe(
                "O cancelamento não foi concluído. Sua pré-reserva continua aguardando resposta. Verifique a conexão e tente novamente.",
            );
            expect((confirmButton() as HTMLButtonElement).disabled).toBe(false);

            await user.click(confirmButton());

            expect(
                await screen.findByRole("heading", {
                    name: "Solicitação cancelada",
                }),
            ).toBeTruthy();
            expect(cancel).toHaveBeenCalledTimes(2);
        });

        it("RN20: se a situação mudou, mostra o motivo e não oferece cancelar de novo", async () => {
            const user = userEvent.setup();
            const { onNavigate } = renderPage({
                cancel: vi
                    .fn()
                    .mockRejectedValue(
                        new BookingCancelError(
                            "nao-cancelavel",
                            "Esta pré-reserva já foi aceita: apenas o produtor responsável pode cancelá-la",
                        ),
                    ),
            });
            await ready();

            await user.click(confirmButton());

            expect((await screen.findByRole("alert")).textContent).toBe(
                "Esta pré-reserva já foi aceita: apenas o produtor responsável pode cancelá-la",
            );
            expect(
                screen.queryByRole("button", {
                    name: "Sim, cancelar solicitação",
                }),
            ).toBeNull();
            await user.click(
                screen.getByRole("button", { name: "Ver pré-reserva" }),
            );
            expect(onNavigate).toHaveBeenCalledWith("/reservas/b1");
        });

        it("CA05: se a pré-reserva não for encontrada ao cancelar, informa", async () => {
            const user = userEvent.setup();
            renderPage({
                cancel: vi
                    .fn()
                    .mockRejectedValue(
                        new BookingCancelError(
                            "nao-encontrada",
                            "Pré-reserva não encontrada.",
                        ),
                    ),
            });
            await ready();

            await user.click(confirmButton());

            expect(
                await screen.findByRole("heading", {
                    level: 1,
                    name: "Pré-reserva não encontrada",
                }),
            ).toBeTruthy();
        });

        it("sessão expirada ao cancelar: pede para entrar de novo", async () => {
            const user = userEvent.setup();
            const { onNavigate } = renderPage({
                cancel: vi.fn().mockRejectedValue(new BookingSessionError()),
            });
            await ready();

            await user.click(confirmButton());

            expect((await screen.findByRole("alert")).textContent).toMatch(
                /Sua sessão expirou/,
            );
            await user.click(screen.getByRole("button", { name: "Entrar" }));
            expect(onNavigate).toHaveBeenCalledWith("/login/consumer");
        });
    });

    describe("ao abrir a confirmação", () => {
        it("CA05: pré-reserva de outra conta ou inexistente aparece como não encontrada", async () => {
            const { cancel } = renderPage({
                load: vi.fn().mockResolvedValue(null),
            });

            expect(
                await screen.findByRole("heading", {
                    level: 1,
                    name: "Pré-reserva não encontrada",
                }),
            ).toBeTruthy();
            expect(
                screen.queryByRole("button", {
                    name: "Sim, cancelar solicitação",
                }),
            ).toBeNull();
            expect(cancel).not.toHaveBeenCalled();
        });

        // RN20 revista em 25/11/2026: a aceita também se cancela.
        it("RN20: pré-reserva recusada não oferece o cancelamento", async () => {
            const user = userEvent.setup();
            const { onNavigate } = renderPage({
                load: vi
                    .fn()
                    .mockResolvedValue(booking({ status: "recusada" })),
            });

            expect(
                await screen.findByRole("heading", {
                    level: 1,
                    name: "Não é possível cancelar",
                }),
            ).toBeTruthy();
            expect(
                screen.getByText(
                    "Só é possível cancelar pré-reservas pendentes ou aceitas. Situação atual: Recusada pela produtora.",
                ),
            ).toBeTruthy();
            expect(
                screen.queryByRole("button", {
                    name: "Sim, cancelar solicitação",
                }),
            ).toBeNull();
            await user.click(
                screen.getByRole("button", { name: "Ver pré-reserva" }),
            );
            expect(onNavigate).toHaveBeenCalledWith("/reservas/b1");
        });

        it("erro ao carregar: avisa e permite tentar de novo", async () => {
            const user = userEvent.setup();
            const load = vi
                .fn()
                .mockRejectedValueOnce(new Error("rede"))
                .mockResolvedValueOnce(booking());
            renderPage({ load });

            expect((await screen.findByRole("alert")).textContent).toMatch(
                /Não foi possível carregar a pré-reserva/,
            );
            await user.click(
                screen.getByRole("button", { name: "Tentar novamente" }),
            );

            await ready();
            expect(load).toHaveBeenCalledTimes(2);
        });

        it("sessão expirada ao carregar: pede para entrar de novo", async () => {
            renderPage({
                load: vi.fn().mockRejectedValue(new BookingSessionError()),
            });

            expect((await screen.findByRole("alert")).textContent).toMatch(
                /Sua sessão expirou/,
            );
        });
    });

    describe("RNF04: acessibilidade", () => {
        it("sem violações WCAG A/AA na confirmação e no sucesso", async () => {
            const user = userEvent.setup();
            const { container } = renderPage();
            await ready();
            const run = () =>
                axe.run(container, {
                    runOnly: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
                    rules: { "color-contrast": { enabled: false } },
                });

            expect((await run()).violations).toEqual([]);

            await user.click(confirmButton());
            await waitFor(() =>
                expect(
                    screen.getByRole("heading", {
                        name: "Solicitação cancelada",
                    }),
                ).toBeTruthy(),
            );
            expect((await run()).violations).toEqual([]);
        });
    });
});
