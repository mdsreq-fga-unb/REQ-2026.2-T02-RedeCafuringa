import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
    ConsumerProfileSelectionPage,
    ConsumerSignupPage,
    ConsumerSignupSuccessPage,
} from "@/features/auth/registration";

const validSignup = {
    nome: "Gabriela Pereira da Silva",
    cpf: "529.982.247-25",
    email: "gabriela@exemplo.com",
    senha: "SenhaForte123",
};

function renderSignup(createAccount = vi.fn().mockResolvedValue(undefined)) {
    const onNavigate = vi.fn();
    render(
        <ConsumerSignupPage
            createAccount={createAccount}
            onNavigate={onNavigate}
        />,
    );
    return { createAccount, onNavigate, user: userEvent.setup() };
}

async function fillSignup(
    user: ReturnType<typeof userEvent.setup>,
    overrides: Partial<typeof validSignup> & {
        confirm?: string;
        dataNascimento?: string;
    } = {},
) {
    const values = {
        ...validSignup,
        dataNascimento: "10051990",
        ...overrides,
    };
    await user.type(screen.getByLabelText("Nome completo"), values.nome);
    await user.type(screen.getByLabelText("CPF"), values.cpf);
    await user.type(screen.getByLabelText("E-mail"), values.email);
    await user.type(
        screen.getByLabelText("Data de nascimento"),
        values.dataNascimento,
    );
    await user.type(screen.getByLabelText("Senha"), values.senha);
    await user.type(
        screen.getByLabelText("Confirmar senha"),
        overrides.confirm ?? values.senha,
    );
}

describe("Fluxo de cadastro de consumidor — HU01", () => {
    afterEach(() => cleanup());

    it("permite escolher consumidor e continuar para entrar", async () => {
        const onNavigate = vi.fn();
        const user = userEvent.setup();
        render(<ConsumerProfileSelectionPage onNavigate={onNavigate} />);

        const continueButton = screen.getByRole("button", {
            name: "Continuar",
        }) as HTMLButtonElement;
        expect(continueButton.disabled).toBe(false);
        expect(
            screen
                .getByRole("button", { name: /Sou consumidor/ })
                .getAttribute("aria-pressed"),
        ).toBe("true");

        await user.click(
            screen.getByRole("button", { name: /Sou consumidor/ }),
        );
        expect(continueButton.disabled).toBe(false);
        await user.click(continueButton);

        expect(onNavigate).toHaveBeenCalledWith("/login/consumer");
    });

    it("exibe os campos e o consentimento apresentados no protótipo", () => {
        renderSignup();

        expect(
            screen.getByRole("heading", { name: "Cadastro de consumidor" }),
        ).toBeTruthy();
        expect(screen.getByLabelText("Nome completo")).toBeTruthy();
        expect(screen.getByLabelText("CPF")).toBeTruthy();
        expect(screen.getByLabelText("E-mail")).toBeTruthy();
        expect(screen.getByLabelText("Data de nascimento")).toBeTruthy();
        expect(screen.getByLabelText("Senha")).toBeTruthy();
        expect(screen.getByLabelText("Confirmar senha")).toBeTruthy();
        expect(
            screen.getByText(/você concorda com o uso dos seus dados/i),
        ).toBeTruthy();
    });

    it("CA02: informa os campos obrigatórios e não envia formulário vazio", async () => {
        const { createAccount, user } = renderSignup();

        await user.click(screen.getByRole("button", { name: "Criar conta" }));

        expect(await screen.findByRole("alert")).toBeTruthy();
        for (const label of [
            "Nome completo",
            "CPF",
            "E-mail",
            "Data de nascimento",
            "Senha",
            "Confirmar senha",
        ]) {
            expect(
                screen.getByLabelText(label).getAttribute("aria-invalid"),
            ).toBe("true");
        }
        expect(createAccount).not.toHaveBeenCalled();
    });

    it("CA02: rejeita CPF/e-mail inválidos e senhas diferentes", async () => {
        const { createAccount, user } = renderSignup();
        await fillSignup(user, {
            cpf: "111.111.111-11",
            email: "email-invalido",
            confirm: "OutraSenha123",
        });

        await user.click(screen.getByRole("button", { name: "Criar conta" }));

        expect(await screen.findByRole("alert")).toBeTruthy();
        expect(createAccount).not.toHaveBeenCalled();
    });

    it.each(["Ab12345", "SomenteLetras", "12345678"])(
        "CA02: rejeita senha que não atende à política da conta (%s)",
        async (senha) => {
            const { createAccount, user } = renderSignup();
            await fillSignup(user, { senha, confirm: senha });

            await user.click(
                screen.getByRole("button", { name: "Criar conta" }),
            );

            expect(await screen.findByRole("alert")).toBeTruthy();
            expect(createAccount).not.toHaveBeenCalled();
        },
    );

    it("CA02/RNF15: impede cadastro de pessoa menor de 18 anos", async () => {
        const { createAccount, user } = renderSignup();
        await fillSignup(user, { dataNascimento: "10052015" });

        await user.click(screen.getByRole("button", { name: "Criar conta" }));

        expect(
            await screen.findByText(
                "É necessário ter 18 anos ou mais para se cadastrar.",
            ),
        ).toBeTruthy();
        expect(createAccount).not.toHaveBeenCalled();
    });

    it("formata a data como DD-MM-AAAA e limita o ano a quatro dígitos", async () => {
        const { user } = renderSignup();
        const birthDate = screen.getByLabelText("Data de nascimento");

        await user.type(birthDate, "010519901234");

        expect(birthDate).toHaveProperty("value", "01-05-1990");
    });

    it("rejeita uma data inexistente", async () => {
        const { createAccount, user } = renderSignup();
        await fillSignup(user, { dataNascimento: "31021990" });

        await user.click(screen.getByRole("button", { name: "Criar conta" }));

        expect(
            await screen.findByText(
                "Informe uma data válida no formato DD-MM-AAAA.",
            ),
        ).toBeTruthy();
        expect(createAccount).not.toHaveBeenCalled();
    });

    it("permite escolher a data pelo calendário temático", async () => {
        const { user } = renderSignup();

        await user.click(
            screen.getByRole("button", { name: "Abrir calendário" }),
        );

        const calendar = screen.getByRole("dialog", {
            name: "Selecionar data de nascimento",
        });
        const dayGroup = within(calendar).getByRole("group", {
            name: "Dias do mês",
        });
        const firstAvailableDay = within(dayGroup)
            .getAllByRole("button")
            .find((button) => !(button as HTMLButtonElement).disabled);

        expect(firstAvailableDay).toBeTruthy();
        await user.click(firstAvailableDay!);

        expect(
            screen.getByLabelText("Data de nascimento").getAttribute("value"),
        ).toMatch(/^\d{2}-\d{2}-\d{4}$/);
        expect(
            screen
                .getByRole("button", { name: "Abrir calendário" })
                .getAttribute("aria-expanded"),
        ).toBe("false");
    });

    it("permite ir diretamente ao ano de nascimento no calendário", async () => {
        const { user } = renderSignup();
        await user.click(
            screen.getByRole("button", { name: "Abrir calendário" }),
        );
        await user.selectOptions(
            screen.getByRole("combobox", { name: "Ano" }),
            "1990",
        );

        expect(
            screen.getByRole("button", { name: /10 de novembro de 1990/i }),
        ).toBeTruthy();
    });

    it("CA01/CA05: envia dados válidos e abre a confirmação de cadastro", async () => {
        const { createAccount, onNavigate, user } = renderSignup();
        await fillSignup(user);

        await user.click(screen.getByRole("button", { name: "Criar conta" }));

        expect(createAccount).toHaveBeenCalledWith({
            ...validSignup,
            dataNascimento: "10-05-1990",
        });
        expect(onNavigate).toHaveBeenCalledWith("/conta-criada/consumer");
    });

    it.each([["E-mail já cadastrado"], ["CPF já cadastrado"]])(
        "CA03/CA04: informa conflito de cadastro: %s",
        async (message) => {
            const createAccount = vi.fn().mockRejectedValue(new Error(message));
            const { onNavigate, user } = renderSignup(createAccount);
            await fillSignup(user);

            await user.click(
                screen.getByRole("button", { name: "Criar conta" }),
            );

            expect((await screen.findByRole("alert")).textContent).toContain(
                message,
            );
            expect(onNavigate).not.toHaveBeenCalled();
        },
    );

    it("mantém os dados preenchidos após falha e permite tentar novamente", async () => {
        const createAccount = vi
            .fn()
            .mockRejectedValueOnce(new Error("Sem conexão"))
            .mockResolvedValueOnce(undefined);
        const { onNavigate, user } = renderSignup(createAccount);
        await fillSignup(user);

        await user.click(screen.getByRole("button", { name: "Criar conta" }));

        expect(await screen.findByRole("alert")).toBeTruthy();
        expect(screen.getByLabelText("Nome completo")).toHaveProperty(
            "value",
            validSignup.nome,
        );
        await user.click(screen.getByRole("button", { name: "Criar conta" }));

        expect(createAccount).toHaveBeenCalledTimes(2);
        expect(onNavigate).toHaveBeenCalledWith("/conta-criada/consumer");
    });

    it("mostra a conclusão e permite entrar na conta recém-criada", async () => {
        const onNavigate = vi.fn();
        const user = userEvent.setup();
        render(<ConsumerSignupSuccessPage onNavigate={onNavigate} />);

        expect(
            screen.getByRole("heading", { name: "Você já faz parte da rede" }),
        ).toBeTruthy();
        await user.click(
            screen.getByRole("button", { name: "Entrar na minha conta" }),
        );

        expect(onNavigate).toHaveBeenCalledWith("/login/consumer");
    });
});
