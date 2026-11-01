import { cleanup, render, screen } from "@testing-library/react";
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
    overrides: Partial<typeof validSignup> & { confirm?: string } = {},
) {
    const values = { ...validSignup, ...overrides };
    await user.type(screen.getByLabelText("Nome completo"), values.nome);
    await user.type(screen.getByLabelText("CPF"), values.cpf);
    await user.type(screen.getByLabelText("E-mail"), values.email);
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

    it("CA01/CA05: envia dados válidos e abre a confirmação de cadastro", async () => {
        const { createAccount, onNavigate, user } = renderSignup();
        await fillSignup(user);

        await user.click(screen.getByRole("button", { name: "Criar conta" }));

        expect(createAccount).toHaveBeenCalledWith(validSignup);
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
