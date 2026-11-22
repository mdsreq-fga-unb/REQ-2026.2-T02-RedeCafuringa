import {
    act,
    cleanup,
    fireEvent,
    render,
    screen,
    within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BookingFormPage } from "@/features/bookings/BookingFormPage";
import {
    loadBookingDraft,
    saveBookingDraft,
} from "@/features/bookings/bookingDraft";
import { createBooking } from "@/features/bookings/bookingService";
import type { Booking } from "@/features/bookings/bookingTypes";

vi.mock("@/features/bookings/bookingService", () => ({
    createBooking: vi.fn(),
}));
const createBookingMock = vi.mocked(createBooking);

const booking: Booking = {
    id: "64b0c0ffee0000000000b001",
    experienceId: "64b0c0ffee0000000000e001",
    date: "2026-12-20",
    time: "09:00",
    participants: 2,
    paymentMethod: "pix",
    status: "pendente",
    createdAt: "2026-11-19T13:00:00.000Z",
};

afterEach(() => {
    cleanup();
});

beforeEach(() => {
    createBookingMock.mockReset();
    createBookingMock.mockResolvedValue(booking);
    localStorage.clear();
});

const experience = {
    id: "64b0c0ffee0000000000e001",
    name: "Trilha guiada da nascente",
    producerName: "Jefferson Sooma",
    local: "Cafuringa, DF",
    duracao: "2 horas",
};

const renderPage = (onBack = vi.fn(), onSent = vi.fn()) =>
    render(
        <BookingFormPage
            experience={experience}
            onBack={onBack}
            onSent={onSent}
        />,
    );

const optionLabels = (select: HTMLElement) =>
    within(select)
        .getAllByRole("option")
        .map((option) => option.textContent);

describe("BookingFormPage: estrutura (HU44 CA02 e CA03)", () => {
    it("mostra o título da tela", () => {
        renderPage();
        expect(
            screen.getByRole("heading", {
                level: 1,
                name: "Planeje seu encontro",
            }),
        ).toBeTruthy();
    });

    it("mostra anfitrião, duração e local da experiência", () => {
        renderPage();
        expect(screen.getByText("Anfitrião: Jefferson Sooma")).toBeTruthy();
        expect(screen.getByText("Duração: 2 horas")).toBeTruthy();
        expect(screen.getByText("Local: Cafuringa, DF")).toBeTruthy();
    });

    it("omite duração e local quando a experiência não os informa", () => {
        render(
            <BookingFormPage
                experience={{ id: "e1", name: "Trilha", producerName: "Maria" }}
                onSent={vi.fn()}
                onBack={vi.fn()}
            />,
        );
        expect(screen.getByText("Anfitrião: Maria")).toBeTruthy();
        expect(screen.queryByText(/Duração:/)).toBeNull();
        expect(screen.queryByText(/Local:/)).toBeNull();
    });

    it("tem o campo de data desejada", () => {
        renderPage();
        const input = screen.getByLabelText("Data desejada");
        expect(input.getAttribute("type")).toBe("date");
    });

    it("oferece horários de hora em hora, de 00h00 a 23h00", () => {
        renderPage();
        const labels = optionLabels(screen.getByLabelText("Horário"));
        expect(labels).toHaveLength(25);
        expect(labels[0]).toBe("Selecione");
        expect(labels[1]).toBe("00h00");
        expect(labels[10]).toBe("09h00");
        expect(labels[24]).toBe("23h00");
    });

    it("oferece de 1 a 50 participantes", () => {
        renderPage();
        const labels = optionLabels(screen.getByLabelText("Participantes"));
        expect(labels).toHaveLength(51);
        expect(labels[1]).toBe("1 pessoa");
        expect(labels[2]).toBe("2 pessoas");
        expect(labels[50]).toBe("50 pessoas");
    });

    it("oferece as quatro formas de pagamento", () => {
        renderPage();
        expect(
            optionLabels(screen.getByLabelText("Forma de pagamento")),
        ).toEqual([
            "Selecione",
            "Pix",
            "Dinheiro",
            "Cartão de crédito",
            "Cartão de débito",
        ]);
    });

    it("marca os quatro campos obrigatórios e deixa a mensagem opcional", () => {
        renderPage();
        for (const label of [
            "Data desejada",
            "Horário",
            "Participantes",
            "Forma de pagamento",
        ]) {
            expect(
                screen.getByLabelText(label).getAttribute("aria-required"),
            ).toBe("true");
        }
        expect(
            screen
                .getByLabelText("Mensagem ao produtor")
                .getAttribute("aria-required"),
        ).toBe("false");
    });

    it("começa com todos os campos vazios", () => {
        renderPage();
        for (const label of [
            "Data desejada",
            "Horário",
            "Participantes",
            "Forma de pagamento",
            "Mensagem ao produtor",
        ]) {
            expect(
                (screen.getByLabelText(label) as HTMLInputElement).value,
            ).toBe("");
        }
    });

    it("permite preencher todos os campos (CA03)", async () => {
        const user = userEvent.setup();
        renderPage();

        fireEvent.change(screen.getByLabelText("Data desejada"), {
            target: { value: "2026-12-20" },
        });
        await user.selectOptions(screen.getByLabelText("Horário"), "09:00");
        await user.selectOptions(screen.getByLabelText("Participantes"), "2");
        await user.selectOptions(
            screen.getByLabelText("Forma de pagamento"),
            "pix",
        );
        await user.type(
            screen.getByLabelText("Mensagem ao produtor"),
            "Gostaríamos de conhecer o sítio.",
        );

        const value = (label: string) =>
            (screen.getByLabelText(label) as HTMLInputElement).value;
        expect(value("Data desejada")).toBe("2026-12-20");
        expect(value("Horário")).toBe("09:00");
        expect(value("Participantes")).toBe("2");
        expect(value("Forma de pagamento")).toBe("pix");
        expect(value("Mensagem ao produtor")).toBe(
            "Gostaríamos de conhecer o sítio.",
        );
    });

    it("tem o botão de enviar a pré-reserva", () => {
        renderPage();
        const button = screen.getByRole("button", {
            name: "Enviar pré-reserva",
        });
        expect(button.getAttribute("type")).toBe("submit");
    });

    it("volta quando o usuário aciona o Voltar", async () => {
        const onBack = vi.fn();
        renderPage(onBack);
        await userEvent.click(screen.getByRole("button", { name: /voltar/i }));
        expect(onBack).toHaveBeenCalledTimes(1);
    });
});

type FormFill = Partial<
    Record<"data" | "horario" | "participantes" | "formaPagamento", string>
>;
type User = ReturnType<typeof userEvent.setup>;

async function fillForm(user: User, fill: FormFill) {
    if (fill.data) {
        fireEvent.change(screen.getByLabelText("Data desejada"), {
            target: { value: fill.data },
        });
    }
    if (fill.horario) {
        await user.selectOptions(
            screen.getByLabelText("Horário"),
            fill.horario,
        );
    }
    if (fill.participantes) {
        await user.selectOptions(
            screen.getByLabelText("Participantes"),
            fill.participantes,
        );
    }
    if (fill.formaPagamento) {
        await user.selectOptions(
            screen.getByLabelText("Forma de pagamento"),
            fill.formaPagamento,
        );
    }
}

const submit = (user: User) =>
    user.click(screen.getByRole("button", { name: "Enviar pré-reserva" }));

const fieldErrors = () => document.querySelectorAll(".field-error");

const VALID_FILL: FormFill = {
    data: "2026-12-20",
    horario: "09:00",
    participantes: "2",
    formaPagamento: "pix",
};

describe("BookingFormPage: validação ao enviar (HU44 CA04)", () => {
    beforeEach(() => {
        // 19/11/2026 10:00. Só o Date é falso, para não travar o userEvent.
        vi.useFakeTimers({ toFake: ["Date"] });
        vi.setSystemTime(new Date(2026, 10, 19, 10, 0));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("não mostra erros antes do envio", () => {
        renderPage();
        expect(screen.queryByText(/Informe|Escolha/)).toBeNull();
    });

    it("mostra um erro por campo obrigatório ao enviar vazio", async () => {
        const user = userEvent.setup();
        renderPage();
        await submit(user);

        expect(screen.getByText("Informe a data desejada.")).toBeTruthy();
        expect(screen.getByText("Escolha o horário.")).toBeTruthy();
        expect(
            screen.getByText("Informe o número de participantes."),
        ).toBeTruthy();
        expect(screen.getByText("Escolha a forma de pagamento.")).toBeTruthy();
        expect(fieldErrors()).toHaveLength(4);
    });

    it("foca o primeiro campo inválido da tela", async () => {
        const user = userEvent.setup();
        renderPage();
        await submit(user);
        expect(document.activeElement).toBe(
            screen.getByLabelText("Data desejada"),
        );
    });

    it("foca o primeiro campo inválido na ordem da tela", async () => {
        const user = userEvent.setup();
        renderPage();
        await fillForm(user, { data: "2026-12-20", horario: "09:00" });
        await submit(user);
        expect(document.activeElement).toBe(
            screen.getByLabelText("Participantes"),
        );
    });

    it("liga a mensagem de erro ao campo (acessibilidade)", async () => {
        const user = userEvent.setup();
        renderPage();
        await submit(user);

        const field = screen.getByLabelText("Data desejada");
        expect(field.getAttribute("aria-invalid")).toBe("true");
        const describedBy = field.getAttribute("aria-describedby") ?? "";
        expect(document.getElementById(describedBy)?.textContent).toBe(
            "Informe a data desejada.",
        );
    });

    it("não marca como inválido um campo preenchido corretamente", async () => {
        const user = userEvent.setup();
        renderPage();
        await fillForm(user, {
            data: "2026-12-20",
            horario: "09:00",
            participantes: "2",
        });
        await submit(user);

        expect(
            screen.getByLabelText("Data desejada").getAttribute("aria-invalid"),
        ).toBe("false");
        expect(
            screen
                .getByLabelText("Forma de pagamento")
                .getAttribute("aria-invalid"),
        ).toBe("true");
    });

    it("recusa uma data no passado (RN21)", async () => {
        const user = userEvent.setup();
        renderPage();
        await fillForm(user, { ...VALID_FILL, data: "2026-11-18" });
        await submit(user);

        expect(
            screen.getByText("A data não pode estar no passado."),
        ).toBeTruthy();
        expect(document.activeElement).toBe(
            screen.getByLabelText("Data desejada"),
        );
    });

    it("recusa hoje em um horário que já passou (RN21)", async () => {
        const user = userEvent.setup();
        renderPage();
        await fillForm(user, {
            ...VALID_FILL,
            data: "2026-11-19",
            horario: "09:00",
        });
        await submit(user);

        expect(screen.getByText("Esse horário já passou.")).toBeTruthy();
        expect(document.activeElement).toBe(screen.getByLabelText("Horário"));
    });

    it("não mostra erros quando tudo está válido", async () => {
        const user = userEvent.setup();
        renderPage();
        await fillForm(user, VALID_FILL);
        await submit(user);

        expect(fieldErrors()).toHaveLength(0);
        expect(document.querySelector('[aria-invalid="true"]')).toBeNull();
    });

    it("some com os erros quando o usuário corrige e envia de novo", async () => {
        const user = userEvent.setup();
        renderPage();
        await submit(user);
        expect(fieldErrors()).toHaveLength(4);

        await fillForm(user, VALID_FILL);
        await submit(user);
        expect(fieldErrors()).toHaveLength(0);
    });
});

describe("BookingFormPage: envio (HU44 CA05 e CA06)", () => {
    beforeEach(() => {
        // 19/11/2026 10:00. Só o Date é falso, para não travar o userEvent.
        vi.useFakeTimers({ toFake: ["Date"] });
        vi.setSystemTime(new Date(2026, 10, 19, 10, 0));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("não envia quando o formulário é inválido", async () => {
        const user = userEvent.setup();
        renderPage();
        await submit(user);
        expect(createBookingMock).not.toHaveBeenCalled();
    });

    it("envia o corpo da pré-reserva montado a partir do formulário", async () => {
        const user = userEvent.setup();
        renderPage();
        await fillForm(user, VALID_FILL);
        await user.type(
            screen.getByLabelText("Mensagem ao produtor"),
            "  Olá!  ",
        );
        await submit(user);

        expect(createBookingMock).toHaveBeenCalledTimes(1);
        expect(createBookingMock).toHaveBeenCalledWith({
            experienciaId: "64b0c0ffee0000000000e001",
            data: "2026-12-20",
            horario: "09:00",
            participantes: 2,
            formaPagamento: "pix",
            mensagem: "Olá!",
        });
    });

    it("avisa que a solicitação foi enviada, com a pré-reserva registrada", async () => {
        const user = userEvent.setup();
        const onSent = vi.fn();
        renderPage(vi.fn(), onSent);
        await fillForm(user, VALID_FILL);
        await submit(user);

        expect(onSent).toHaveBeenCalledTimes(1);
        expect(onSent).toHaveBeenCalledWith(booking);
    });

    it("limpa o rascunho depois de enviar", async () => {
        const user = userEvent.setup();
        localStorage.setItem("cafuringa-user-id", "user-1");
        saveBookingDraft(experience.id, {
            data: "2026-12-20",
            horario: "09:00",
            participantes: "2",
            formaPagamento: "pix",
            mensagem: "",
        });
        renderPage();
        await fillForm(user, VALID_FILL);
        await submit(user);

        expect(loadBookingDraft(experience.id)).toBeNull();
    });

    it("desabilita o botão e não envia duas vezes enquanto aguarda a resposta", async () => {
        const user = userEvent.setup();
        const onSent = vi.fn();
        let resolveBooking!: (value: Booking) => void;
        createBookingMock.mockReturnValue(
            new Promise<Booking>((resolve) => {
                resolveBooking = resolve;
            }),
        );
        renderPage(vi.fn(), onSent);
        await fillForm(user, VALID_FILL);
        await submit(user);

        const button = screen.getByRole("button", {
            name: "Enviando…",
        }) as HTMLButtonElement;
        expect(button.disabled).toBe(true);
        await user.click(button);
        expect(createBookingMock).toHaveBeenCalledTimes(1);
        expect(onSent).not.toHaveBeenCalled();

        await act(async () => {
            resolveBooking(booking);
        });
        expect(onSent).toHaveBeenCalledWith(booking);
    });
});

const apiError = (status: number) =>
    Object.assign(new Error(`HTTP ${status}`), { status });

describe("BookingFormPage: falha no envio (HU44 CA08)", () => {
    beforeEach(() => {
        // 19/11/2026 10:00. Só o Date é falso, para não travar o userEvent.
        vi.useFakeTimers({ toFake: ["Date"] });
        vi.setSystemTime(new Date(2026, 10, 19, 10, 0));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("mostra a mensagem da falha e mantém tudo o que foi preenchido", async () => {
        const user = userEvent.setup();
        const onSent = vi.fn();
        createBookingMock.mockRejectedValue(apiError(500));
        renderPage(vi.fn(), onSent);
        await fillForm(user, VALID_FILL);
        await user.type(screen.getByLabelText("Mensagem ao produtor"), "Olá!");
        await submit(user);

        expect(screen.getByRole("alert").textContent).toBe(
            "Não foi possível enviar a pré-reserva. Seus dados foram mantidos, tente novamente.",
        );
        const value = (label: string) =>
            (screen.getByLabelText(label) as HTMLInputElement).value;
        expect(value("Data desejada")).toBe("2026-12-20");
        expect(value("Horário")).toBe("09:00");
        expect(value("Participantes")).toBe("2");
        expect(value("Forma de pagamento")).toBe("pix");
        expect(value("Mensagem ao produtor")).toBe("Olá!");
        expect(onSent).not.toHaveBeenCalled();
    });

    it("reabilita o botão e permite tentar de novo", async () => {
        const user = userEvent.setup();
        const onSent = vi.fn();
        createBookingMock.mockRejectedValueOnce(apiError(500));
        renderPage(vi.fn(), onSent);
        await fillForm(user, VALID_FILL);
        await submit(user);
        expect(screen.getByRole("alert")).toBeTruthy();

        const button = screen.getByRole("button", {
            name: "Enviar pré-reserva",
        }) as HTMLButtonElement;
        expect(button.disabled).toBe(false);

        await submit(user);
        expect(createBookingMock).toHaveBeenCalledTimes(2);
        expect(onSent).toHaveBeenCalledWith(booking);
        expect(screen.queryByRole("alert")).toBeNull();
    });

    it.each([
        [404, "Esta experiência não está mais disponível para pré-reserva."],
        [
            429,
            "Muitas tentativas seguidas. Aguarde um instante e tente de novo.",
        ],
    ])("explica a falha %i", async (status, message) => {
        const user = userEvent.setup();
        createBookingMock.mockRejectedValue(apiError(status));
        renderPage();
        await fillForm(user, VALID_FILL);
        await submit(user);
        expect(screen.getByRole("alert").textContent).toBe(message);
    });

    it("trata a falta de conexão como falha de envio", async () => {
        const user = userEvent.setup();
        createBookingMock.mockRejectedValue(new TypeError("Failed to fetch"));
        renderPage();
        await fillForm(user, VALID_FILL);
        await submit(user);
        expect(screen.getByRole("alert").textContent).toContain(
            "Não foi possível enviar a pré-reserva",
        );
    });

    describe("rascunho local", () => {
        const value = (label: string) =>
            (screen.getByLabelText(label) as HTMLInputElement).value;

        beforeEach(() => {
            localStorage.setItem("cafuringa-user-id", "user-1");
        });

        it("guarda o que foi preenchido quando o envio falha", async () => {
            const user = userEvent.setup();
            createBookingMock.mockRejectedValue(apiError(500));
            renderPage();
            await fillForm(user, VALID_FILL);
            await user.type(
                screen.getByLabelText("Mensagem ao produtor"),
                "Olá!",
            );
            await submit(user);

            expect(loadBookingDraft(experience.id)).toEqual({
                data: "2026-12-20",
                horario: "09:00",
                participantes: "2",
                formaPagamento: "pix",
                mensagem: "Olá!",
            });
        });

        it("restaura o rascunho quando o usuário volta ao formulário", async () => {
            const user = userEvent.setup();
            createBookingMock.mockRejectedValue(apiError(401));
            renderPage();
            await fillForm(user, VALID_FILL);
            await user.type(
                screen.getByLabelText("Mensagem ao produtor"),
                "Olá!",
            );
            await submit(user);
            cleanup();

            renderPage();
            expect(value("Data desejada")).toBe("2026-12-20");
            expect(value("Horário")).toBe("09:00");
            expect(value("Participantes")).toBe("2");
            expect(value("Forma de pagamento")).toBe("pix");
            expect(value("Mensagem ao produtor")).toBe("Olá!");
        });

        it("não restaura o rascunho de outra experiência", async () => {
            saveBookingDraft("64b0c0ffee0000000000e999", {
                data: "2026-12-20",
                horario: "09:00",
                participantes: "2",
                formaPagamento: "pix",
                mensagem: "outra",
            });
            renderPage();
            expect(value("Data desejada")).toBe("");
            expect(value("Mensagem ao produtor")).toBe("");
        });

        it("não guarda rascunho quando a validação barra o envio", async () => {
            const user = userEvent.setup();
            renderPage();
            await submit(user);
            expect(loadBookingDraft(experience.id)).toBeNull();
        });

        it("não guarda nada sem usuário logado", async () => {
            localStorage.removeItem("cafuringa-user-id");
            const user = userEvent.setup();
            createBookingMock.mockRejectedValue(apiError(500));
            renderPage();
            await fillForm(user, VALID_FILL);
            await submit(user);
            expect(localStorage.length).toBe(0);
        });
    });
});
