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
import { BookingDetailPage } from "@/features/bookings/BookingDetailPage";
import type { BookingDetail } from "@/features/bookings/bookingDetails";
import { BookingSessionError } from "@/features/bookings/bookingService";
import type { BookingStatus } from "@/features/bookings/bookingTypes";

afterEach(cleanup);

function booking(overrides: Partial<BookingDetail> = {}): BookingDetail {
    return {
        id: "b1",
        experienceId: "e1",
        date: "2026-12-20",
        time: "09:00",
        participants: 2,
        paymentMethod: "pix",
        message: "Gostaríamos de conhecer o sítio.",
        status: "pendente",
        createdAt: "2026-11-19T13:00:00.000Z",
        updatedAt: "2026-11-20T13:00:00.000Z",
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

function renderPage(
    props: Partial<Parameters<typeof BookingDetailPage>[0]> = {},
) {
    const load = vi.fn().mockResolvedValue(booking());
    const onNavigate = vi.fn();
    const view = render(
        <BookingDetailPage
            id="b1"
            role="consumer"
            load={load}
            onNavigate={onNavigate}
            {...props}
        />,
    );
    return { ...view, load, onNavigate };
}

const normalize = (text: string | null) => (text ?? "").replace(/\s/g, " ");

describe("HU45 — detalhe da pré-reserva", () => {
    describe("CA04: informações registradas e situação", () => {
        it("busca a pré-reserva pelo id e mostra a situação em destaque", async () => {
            const { load } = renderPage();

            expect(screen.getByRole("status").textContent).toMatch(
                /Carregando pré-reserva/,
            );
            expect(
                await screen.findByRole("heading", {
                    level: 1,
                    name: "Aguardando resposta",
                }),
            ).toBeTruthy();
            expect(load.mock.calls[0][0]).toBe("b1");
        });

        it("mostra a experiência, o local, a data, o horário, os participantes, o valor e o pagamento", async () => {
            renderPage();

            expect(
                await screen.findByRole("heading", {
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
                details.getByText((text) => normalize(text) === "R$ 90,00"),
            ).toBeTruthy();
            expect(details.getByText("Pix")).toBeTruthy();
        });

        it("consumidora: mostra a mensagem como sua e a responsável pela experiência", async () => {
            renderPage({
                load: vi.fn().mockResolvedValue(
                    booking({
                        counterpart: { id: "p1", name: "Sítio Raízes" },
                    }),
                ),
            });

            expect(
                await screen.findByRole("heading", { name: "Sua mensagem" }),
            ).toBeTruthy();
            expect(
                screen.getByText("Gostaríamos de conhecer o sítio."),
            ).toBeTruthy();
            expect(screen.getByText("Responsável")).toBeTruthy();
        });

        it("produtora: mostra quem solicitou e a mensagem da consumidora", async () => {
            renderPage({ role: "producer" });

            expect(
                await screen.findByRole("heading", {
                    name: "Mensagem da consumidora",
                }),
            ).toBeTruthy();
            expect(screen.getByText("Solicitada por")).toBeTruthy();
            expect(screen.getByText("Ana Souza")).toBeTruthy();
        });

        it("sem mensagem, não mostra a seção de mensagem", async () => {
            renderPage({
                load: vi
                    .fn()
                    .mockResolvedValue(booking({ message: undefined })),
            });

            await screen.findByRole("heading", { level: 1 });
            expect(
                screen.queryByRole("heading", { name: /mensagem/i }),
            ).toBeNull();
        });

        it("avisa quando a experiência não está mais disponível", async () => {
            renderPage({
                load: vi.fn().mockResolvedValue(
                    booking({
                        experience: {
                            ...booking().experience,
                            available: false,
                        },
                    }),
                ),
            });

            expect(
                await screen.findByText(
                    "Esta experiência não está mais disponível.",
                ),
            ).toBeTruthy();
        });
    });

    describe("CA07: situação atualizada", () => {
        it.each<[BookingStatus, string]>([
            ["pendente", "Aguardando resposta"],
            ["aceita", "Pré-reserva aceita"],
            ["recusada", "Pré-reserva recusada"],
            ["cancelada", "Pré-reserva cancelada"],
        ])("situação %s aparece como %j", async (status, title) => {
            renderPage({
                load: vi.fn().mockResolvedValue(booking({ status })),
            });

            expect(
                await screen.findByRole("heading", { level: 1, name: title }),
            ).toBeTruthy();
        });

        it("mostra quando a situação foi atualizada", async () => {
            renderPage();

            expect(
                await screen.findByText("Última atualização: 20/11/2026"),
            ).toBeTruthy();
        });

        it("ao abrir de novo, busca a situação no servidor outra vez", async () => {
            const load = vi
                .fn()
                .mockResolvedValueOnce(booking({ status: "pendente" }))
                .mockResolvedValueOnce(booking({ status: "aceita" }));
            const { unmount } = renderPage({ load });
            await screen.findByRole("heading", {
                name: "Aguardando resposta",
            });
            unmount();

            renderPage({ load });

            expect(
                await screen.findByRole("heading", {
                    name: "Pré-reserva aceita",
                }),
            ).toBeTruthy();
            expect(load).toHaveBeenCalledTimes(2);
        });
    });

    describe("CA05: sem permissão ou inexistente", () => {
        it("mostra só que não foi encontrada, sem dados da solicitação", async () => {
            const user = userEvent.setup();
            const { onNavigate } = renderPage({
                load: vi.fn().mockResolvedValue(null),
            });

            expect(
                await screen.findByRole("heading", {
                    level: 1,
                    name: "Pré-reserva não encontrada",
                }),
            ).toBeTruthy();
            expect(
                screen.getByText(
                    "Ela não existe ou não está vinculada à sua conta.",
                ),
            ).toBeTruthy();
            expect(screen.queryByText(/Sabores e caminhos/)).toBeNull();

            await user.click(
                screen.getByRole("button", { name: "Ver minhas pré-reservas" }),
            );
            expect(onNavigate).toHaveBeenCalledWith("/reservas");
        });
    });

    describe("navegação e falhas", () => {
        it("Voltar leva à lista de pré-reservas", async () => {
            const user = userEvent.setup();
            const { onNavigate } = renderPage();
            await screen.findByRole("heading", { level: 1 });

            await user.click(screen.getByRole("button", { name: "Voltar" }));

            expect(onNavigate).toHaveBeenCalledWith("/reservas");
        });

        it("erro de rede: avisa e permite tentar de novo", async () => {
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

            expect(
                await screen.findByRole("heading", {
                    name: "Aguardando resposta",
                }),
            ).toBeTruthy();
            expect(load).toHaveBeenCalledTimes(2);
        });

        it("sessão expirada: pede para entrar de novo", async () => {
            const user = userEvent.setup();
            const { onNavigate } = renderPage({
                role: "producer",
                load: vi.fn().mockRejectedValue(new BookingSessionError()),
            });

            expect((await screen.findByRole("alert")).textContent).toMatch(
                /Sua sessão expirou/,
            );
            await user.click(screen.getByRole("button", { name: "Entrar" }));
            expect(onNavigate).toHaveBeenCalledWith("/login/producer");
        });
    });

    describe("RNF04: acessibilidade", () => {
        it.each([
            ["com a solicitação", booking()],
            ["não encontrada", null],
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

describe("HU46 — opção de cancelar no detalhe (CA01, CA02)", () => {
    const cancelButton = () =>
        screen.queryByRole("button", { name: "Cancelar solicitação" });

    it("consumidora com pré-reserva pendente vê o botão, que leva à confirmação", async () => {
        const user = userEvent.setup();
        const { onNavigate } = renderPage({
            id: "b 1",
            load: vi.fn().mockResolvedValue(booking({ id: "b 1" })),
        });

        await screen.findByRole("heading", { name: "Aguardando resposta" });
        await user.click(cancelButton() as HTMLElement);

        expect(onNavigate).toHaveBeenCalledWith("/reservas/b%201/cancelar");
    });

    it.each<BookingStatus>(["aceita", "recusada", "cancelada"])(
        "RN20: pré-reserva %s não oferece cancelamento à consumidora",
        async (status) => {
            renderPage({
                load: vi.fn().mockResolvedValue(booking({ status })),
            });

            await screen.findByRole("heading", { level: 1 });
            expect(cancelButton()).toBeNull();
        },
    );

    it("a produtora nunca vê o botão, nem na pendente", async () => {
        renderPage({ role: "producer" });

        await screen.findByRole("heading", { name: "Aguardando resposta" });
        expect(cancelButton()).toBeNull();
    });

    it("pré-reserva não encontrada não oferece cancelamento", async () => {
        renderPage({ load: vi.fn().mockResolvedValue(null) });

        await screen.findByRole("heading", {
            name: "Pré-reserva não encontrada",
        });
        expect(cancelButton()).toBeNull();
    });
});
