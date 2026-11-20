import {
    cleanup,
    fireEvent,
    render,
    screen,
    within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BookingFormPage } from "@/features/bookings/BookingFormPage";

afterEach(() => {
    cleanup();
});
const experience = {
    id: "64b0c0ffee0000000000e001",
    name: "Trilha guiada da nascente",
    producerName: "Jefferson Sooma",
    local: "Cafuringa, DF",
    duracao: "2 horas",
};

const renderPage = (onBack = vi.fn()) =>
    render(<BookingFormPage experience={experience} onBack={onBack} />);

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
