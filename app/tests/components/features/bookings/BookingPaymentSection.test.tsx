import {
    cleanup,
    fireEvent,
    render,
    screen,
    within,
} from "@testing-library/react";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BookingDetailPage } from "@/features/bookings/BookingDetailPage";
import type { BookingDetail } from "@/features/bookings/bookingDetails";
import { buildPixCode } from "@/features/payments/pixCode";

afterEach(cleanup);

const payment = {
    totalCents: 18200,
    depositCents: 9100,
    remainingCents: 9100,
    status: "aguardando-sinal" as const,
    depositDeadline: "2026-11-22T13:30:00.000Z",
};
const pix = {
    key: "+5561999998888",
    receiver: "Maria da Silva",
    city: "BRASILIA",
    txid: "b1",
};

function booking(overrides: Partial<BookingDetail> = {}): BookingDetail {
    return {
        id: "b1",
        experienceId: "e1",
        date: "2026-12-20",
        time: "09:00",
        participants: 4,
        paymentMethod: "pix",
        status: "aceita",
        createdAt: "2026-11-21T13:00:00.000Z",
        updatedAt: "2026-11-21T13:30:00.000Z",
        experience: {
            name: "Sabores e caminhos do Cerrado",
            local: "Sítio Raízes",
            pricePerPerson: 45.5,
            available: true,
        },
        counterpart: { id: "p1", name: "Sítio Raízes" },
        payment,
        pix,
        ...overrides,
    };
}

function renderPage(
    detail: BookingDetail,
    role: "consumer" | "producer" = "consumer",
) {
    return render(
        <BookingDetailPage
            id="b1"
            role={role}
            load={vi.fn().mockResolvedValue(detail)}
            onNavigate={vi.fn()}
        />,
    );
}

const depositHeading = () =>
    screen.findByRole("heading", {
        name: "Pague o sinal para garantir sua vaga",
    });
const rules = () =>
    screen.getByRole("checkbox", {
        name: "Li e aceito as regras de cancelamento",
    });

describe("pré-reserva aceita — sinal por Pix (consumidora)", () => {
    it("mostra o sinal, o prazo e quanto fica para o dia", async () => {
        renderPage(booking());

        const section = (await depositHeading()).closest("section")!;
        expect(
            within(section).getByText(
                "Pague R$ 91,00 (50% do total) até 22/11/2026 às 10h30. O restante, R$ 91,00, você paga no dia, com a produtora.",
            ),
        ).toBeTruthy();
    });

    it("mostra as regras de cancelamento antes do pagamento", async () => {
        renderPage(booking());

        const section = (await depositHeading()).closest("section")!;
        const list = within(section).getByRole("list", {
            name: "Regras de cancelamento",
        });
        expect(
            within(list)
                .getAllByRole("listitem")
                .map((item) => item.textContent),
        ).toEqual([
            "Cancelando até 72 horas antes, a produtora devolve o sinal.",
            "Com menos de 72 horas, o sinal não é devolvido.",
            "Se a produtora cancelar, ela devolve o sinal.",
            "O pagamento vai direto para a produtora. A Rede Cafuringa não recebe nem devolve valores.",
        ]);
    });

    it("o código Pix só aparece depois de aceitar as regras", async () => {
        renderPage(booking());
        await depositHeading();

        expect(screen.queryByLabelText("Código Pix copia e cola")).toBeNull();
        fireEvent.click(rules());

        const field = screen.getByLabelText(
            "Código Pix copia e cola",
        ) as HTMLTextAreaElement;
        expect(field.value).toBe(
            buildPixCode({
                chave: pix.key,
                nome: pix.receiver,
                cidade: pix.city,
                valorCentavos: 9100,
                txid: pix.txid,
            }),
        );
    });

    it("sem a chave liberada, orienta a falar com a produtora", async () => {
        renderPage(booking({ pix: undefined }));
        await depositHeading();

        expect(
            screen.getByText(
                "A produtora ainda não liberou a chave Pix. Fale com ela para combinar o pagamento do sinal.",
            ),
        ).toBeTruthy();
        expect(screen.queryByRole("checkbox")).toBeNull();
    });

    it.each([
        [
            "expirado",
            "O prazo para pagar o sinal terminou em 22/11/2026 às 10h30. A vaga foi liberada.",
        ],
        [
            "comprovante-enviado",
            "Comprovante enviado. A produtora vai conferir o pagamento no banco.",
        ],
        ["sinal-confirmado", "Sinal confirmado. Sua vaga está garantida."],
        [
            "dispensado",
            "Esta experiência não pede sinal. Você paga R$ 182,00 no dia, com a produtora.",
        ],
    ] as const)("situação %s: %s", async (status, text) => {
        renderPage(
            booking({ payment: { ...payment, status }, pix: undefined }),
        );

        expect(await screen.findByText(text)).toBeTruthy();
        expect(
            screen.queryByRole("heading", {
                name: "Pague o sinal para garantir sua vaga",
            }),
        ).toBeNull();
    });

    it("pré-reserva sem pagamento (pendente) não mostra nada de sinal", async () => {
        renderPage(
            booking({ status: "pendente", payment: undefined, pix: undefined }),
        );

        await screen.findByRole("heading", { level: 1 });
        expect(screen.queryByText(/sinal/i)).toBeNull();
    });

    it("RNF04: sem violações WCAG A/AA, antes e depois de aceitar as regras", async () => {
        const { container } = renderPage(booking());
        await depositHeading();
        const run = () =>
            axe.run(container, {
                runOnly: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
                rules: { "color-contrast": { enabled: false } },
            });

        expect((await run()).violations).toEqual([]);
        fireEvent.click(rules());
        await screen.findByRole("img");
        expect((await run()).violations).toEqual([]);
    });
});

describe("pré-reserva aceita — sinal (produtora)", () => {
    it("vê a situação do sinal, sem o bloco de pagamento", async () => {
        renderPage(booking({ pix: undefined }), "producer");

        expect(
            await screen.findByText(
                "Sinal de R$ 91,00: aguardando o pagamento da consumidora até 22/11/2026 às 10h30.",
            ),
        ).toBeTruthy();
        expect(
            screen.queryByRole("heading", {
                name: "Pague o sinal para garantir sua vaga",
            }),
        ).toBeNull();
    });
});
