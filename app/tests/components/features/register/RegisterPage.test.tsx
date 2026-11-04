import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RegisterPage } from "@/features/register/RegisterPage";
import { registerProducer } from "@/features/register/registerService";
import type { RegisterResult } from "@/features/register/registerService";

vi.mock("@/features/register/registerService");

beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(registerProducer).mockResolvedValue({ ok: true });
});

function renderRegister() {
    const onNavigate = vi.fn();
    render(<RegisterPage onNavigate={onNavigate} />);
    return { onNavigate, user: userEvent.setup() };
}

afterEach(() => {
    cleanup();
});

type User = ReturnType<typeof userEvent.setup>;

type FormInput = {
    documentLabel?: string;
    birthDate?: string;
    name?: string;
    document?: string;
    phone?: string;
    email?: string;
    address?: string;
    password?: string;
    confirmPassword?: string;
};

async function fillForm(user: User, input: FormInput = {}) {
    const values = {
        documentLabel: "CPF",
        birthDate: "10051990",
        name: "Maria da Silva",
        document: "52998224725",
        phone: "61912345678",
        email: "maria@exemplo.com",
        address: "Chácara 12, Núcleo Rural, Brasília - DF",
        password: "senha-segura-1",
        confirmPassword: "senha-segura-1",
        ...input,
    };

    await user.type(screen.getByLabelText("Nome da iniciativa"), values.name);
    await user.type(
        screen.getByLabelText(values.documentLabel),
        values.document,
    );
    if (values.documentLabel === "CPF") {
        await user.type(
            screen.getByLabelText("Data de nascimento"),
            values.birthDate,
        );
    }
    await user.type(screen.getByLabelText("Telefone"), values.phone);
    await user.type(screen.getByLabelText("E-mail"), values.email);
    await user.type(screen.getByLabelText("Localidade"), values.address);
    await user.type(screen.getByLabelText("Senha"), values.password);
    await user.type(
        screen.getByLabelText("Confirmar senha"),
        values.confirmPassword,
    );
}

async function submit(user: User) {
    await user.click(screen.getByRole("button", { name: "Continuar" }));
}

describe("RegisterPage — HU02 Cadastrar perfil de produtor", () => {
    it("mostra o título e leva de volta ao login pelo botão Voltar", async () => {
        const { onNavigate, user } = renderRegister();

        expect(
            screen.getByRole("heading", { name: "Cadastro de produtor" }),
        ).toBeTruthy();

        await user.click(screen.getByRole("button", { name: /Voltar/ }));
        expect(onNavigate).toHaveBeenCalledWith("/entrar");
    });

    // CA03
    it("mostra os campos exigidos e o botão Continuar", () => {
        renderRegister();

        for (const label of [
            "Nome da iniciativa",
            "Responsável",
            "Data de nascimento",
            "CPF",
            "Categoria",
            "Formas de pagamento",
            "Telefone",
            "E-mail",
            "Localidade",
            "Senha",
            "Confirmar senha",
        ]) {
            expect(screen.getByLabelText(label)).toBeTruthy();
        }
        expect(screen.getByRole("button", { name: "Continuar" })).toBeTruthy();
    });

    it("permite escolher a categoria e as formas de pagamento", async () => {
        const { user } = renderRegister();
        const category = screen.getByRole("combobox", { name: "Categoria" });
        const paymentMethods = screen.getByRole("combobox", {
            name: "Formas de pagamento",
        });

        await user.selectOptions(category, "Experiências");
        await user.selectOptions(paymentMethods, "Pix, Dinheiro");

        expect(category).toHaveProperty("value", "Experiências");
        expect(paymentMethods).toHaveProperty("value", "Pix, Dinheiro");
    });

    it("começa com CPF e troca o campo de documento para CNPJ ao escolher esse tipo", async () => {
        const { user } = renderRegister();

        const cpfOption = screen.getByRole("radio", {
            name: "Pessoa física (CPF)",
        }) as HTMLInputElement;
        expect(cpfOption.checked).toBe(true);

        await user.click(
            screen.getByRole("radio", { name: "Pessoa jurídica (CNPJ)" }),
        );

        expect(screen.getByLabelText("CNPJ (empresa / MEI)")).toBeTruthy();
        expect(screen.queryByLabelText("CPF")).toBeNull();
    });

    // CA07
    it("mostra a data de nascimento para pessoa física", () => {
        renderRegister();

        expect(screen.getByLabelText("Data de nascimento")).toBeTruthy();
        expect(screen.queryByRole("checkbox")).toBeNull();
    });

    it("não pede autodeclaração nem data de nascimento para pessoa jurídica", async () => {
        const { user } = renderRegister();

        await user.click(
            screen.getByRole("radio", { name: "Pessoa jurídica (CNPJ)" }),
        );

        expect(screen.queryByRole("checkbox")).toBeNull();
        expect(screen.queryByLabelText("Data de nascimento")).toBeNull();
    });

    it("limpa os erros visíveis ao trocar o tipo de documento", async () => {
        const { user } = renderRegister();

        await submit(user);
        expect(screen.getByText("Informe o CPF.")).toBeTruthy();
        expect(screen.getByText("Informe a data de nascimento.")).toBeTruthy();

        await user.click(
            screen.getByRole("radio", { name: "Pessoa jurídica (CNPJ)" }),
        );

        expect(screen.queryByText("Informe o CPF.")).toBeNull();
        expect(screen.queryByText("Informe a data de nascimento.")).toBeNull();
        expect(screen.queryByText("Informe o nome.")).toBeNull();
    });

    it("aplica a máscara de CPF enquanto o usuário digita", async () => {
        const { user } = renderRegister();

        await user.type(screen.getByLabelText("CPF"), "52998224725");

        expect((screen.getByLabelText("CPF") as HTMLInputElement).value).toBe(
            "529.982.247-25",
        );
    });

    it("aplica a máscara de CNPJ quando o tipo escolhido é CNPJ", async () => {
        const { user } = renderRegister();

        await user.click(
            screen.getByRole("radio", { name: "Pessoa jurídica (CNPJ)" }),
        );
        await user.type(
            screen.getByLabelText("CNPJ (empresa / MEI)"),
            "11222333000181",
        );

        expect(
            (screen.getByLabelText("CNPJ (empresa / MEI)") as HTMLInputElement)
                .value,
        ).toBe("11.222.333/0001-81");
    });

    it("limpa o documento digitado ao trocar o tipo de documento", async () => {
        const { user } = renderRegister();

        await user.type(screen.getByLabelText("CPF"), "52998224725");
        await user.click(
            screen.getByRole("radio", { name: "Pessoa jurídica (CNPJ)" }),
        );

        expect(
            (screen.getByLabelText("CNPJ (empresa / MEI)") as HTMLInputElement)
                .value,
        ).toBe("");
    });

    it("aplica a máscara de telefone enquanto o usuário digita", async () => {
        const { user } = renderRegister();

        await user.type(screen.getByLabelText("Telefone"), "61912345678");

        expect(
            (screen.getByLabelText("Telefone") as HTMLInputElement).value,
        ).toBe("(61) 91234-5678");
    });

    // CA06 e CA07
    it("sinaliza os campos obrigatórios vazios para pessoa física", async () => {
        const { user } = renderRegister();

        await submit(user);

        for (const message of [
            "Informe o nome.",
            "Informe o CPF.",
            "Informe a data de nascimento.",
            "Informe o telefone.",
            "Informe o e-mail.",
            "Informe o endereço.",
            "Informe a senha.",
            "Confirme a senha.",
        ]) {
            expect(screen.getByText(message)).toBeTruthy();
        }
    });

    it("liga o erro ao campo com aria-invalid e aria-describedby", async () => {
        const { user } = renderRegister();

        await submit(user);

        const name = screen.getByLabelText("Nome da iniciativa");
        expect(name.getAttribute("aria-invalid")).toBe("true");
        const errorId = name.getAttribute("aria-describedby") ?? "";
        expect(document.getElementById(errorId)?.textContent).toBe(
            "Informe o nome.",
        );
    });

    // CA05
    it("rejeita CPF, telefone e e-mail com formato inválido, com o erro no campo", async () => {
        const { user } = renderRegister();

        await fillForm(user, {
            document: "52998224724",
            phone: "6133334",
            email: "maria@exemplo",
        });
        await submit(user);

        expect(screen.getByText("CPF inválido.")).toBeTruthy();
        expect(
            screen.getByText("Telefone inválido. Informe o DDD e o número."),
        ).toBeTruthy();
        expect(screen.getByText("E-mail inválido.")).toBeTruthy();
    });

    it("rejeita CNPJ inválido quando o tipo de documento é CNPJ", async () => {
        const { user } = renderRegister();

        await user.click(
            screen.getByRole("radio", { name: "Pessoa jurídica (CNPJ)" }),
        );
        await fillForm(user, {
            documentLabel: "CNPJ (empresa / MEI)",
            document: "11222333000182",
        });
        await submit(user);

        expect(screen.getByText("CNPJ inválido.")).toBeTruthy();
    });

    // CA04
    it("rejeita senha com menos de 8 caracteres", async () => {
        const { user } = renderRegister();

        await fillForm(user, {
            password: "curta12",
            confirmPassword: "curta12",
        });
        await submit(user);

        expect(
            screen.getByText("A senha deve ter no mínimo 8 caracteres."),
        ).toBeTruthy();
    });

    it("rejeita confirmação de senha diferente da senha", async () => {
        const { user } = renderRegister();

        await fillForm(user, { confirmPassword: "senha-segura-2" });
        await submit(user);

        expect(screen.getByText("As senhas não conferem.")).toBeTruthy();
    });

    it("não mostra erros quando o formulário está válido, e limpa os erros anteriores", async () => {
        const { user } = renderRegister();

        await submit(user);
        expect(screen.getByText("Informe o nome.")).toBeTruthy();

        await fillForm(user);
        await submit(user);

        expect(document.querySelector(".field-error")).toBeNull();
    });

    // CA09
    it("envia o cadastro normalizado ao serviço e vai para o login com aviso de sucesso", async () => {
        const { onNavigate, user } = renderRegister();

        await fillForm(user);
        await submit(user);

        await waitFor(() =>
            expect(onNavigate).toHaveBeenCalledWith("/entrar?cadastro=ok"),
        );
        expect(registerProducer).toHaveBeenCalledWith({
            name: "Maria da Silva",
            document: "52998224725",
            phone: "61912345678",
            email: "maria@exemplo.com",
            address: "Chácara 12, Núcleo Rural, Brasília - DF",
            password: "senha-segura-1",
        });
    });

    it("não chama o serviço nem navega quando o formulário é inválido", async () => {
        const { onNavigate, user } = renderRegister();

        await submit(user);

        expect(registerProducer).not.toHaveBeenCalled();
        expect(onNavigate).not.toHaveBeenCalled();
    });

    it("desabilita o botão e mostra o andamento enquanto o cadastro é enviado", async () => {
        let finish: (result: RegisterResult) => void = () => {};
        vi.mocked(registerProducer).mockReturnValue(
            new Promise<RegisterResult>((resolve) => {
                finish = resolve;
            }),
        );
        const { onNavigate, user } = renderRegister();

        await fillForm(user);
        await submit(user);

        const button = await screen.findByRole("button", {
            name: "Continuando…",
        });
        expect((button as HTMLButtonElement).disabled).toBe(true);
        await user.click(button);
        expect(registerProducer).toHaveBeenCalledTimes(1);
        expect(onNavigate).not.toHaveBeenCalled();

        finish({ ok: true });
        await waitFor(() =>
            expect(onNavigate).toHaveBeenCalledWith("/entrar?cadastro=ok"),
        );
    });
});

describe("RegisterPage — falhas ao cadastrar", () => {
    // CA08
    it("orienta a entrar ou recuperar o acesso quando CPF/CNPJ ou e-mail já existem", async () => {
        vi.mocked(registerProducer).mockResolvedValue({
            ok: false,
            reason: "duplicate",
        });
        const { onNavigate, user } = renderRegister();

        await fillForm(user);
        await submit(user);

        const alert = await screen.findByRole("alert");
        expect(alert.textContent).toBe(
            "CPF/CNPJ ou e-mail já cadastrado. Entre na sua conta ou recupere o acesso.",
        );

        await user.click(
            screen.getByRole("button", { name: "Ir para o login" }),
        );
        expect(onNavigate).toHaveBeenCalledTimes(1);
        expect(onNavigate).toHaveBeenCalledWith("/entrar");
    });

    it("lista as mensagens do servidor quando os dados são recusados", async () => {
        vi.mocked(registerProducer).mockResolvedValue({
            ok: false,
            reason: "invalid",
            messages: ["CPF inválido", "Senha é obrigatória"],
        });
        const { user } = renderRegister();

        await fillForm(user);
        await submit(user);

        const alert = await screen.findByRole("alert");
        expect(alert.textContent).toContain("Confira os dados informados");
        expect(screen.getByText("CPF inválido")).toBeTruthy();
        expect(screen.getByText("Senha é obrigatória")).toBeTruthy();
    });

    it.each([
        [30, "Muitas tentativas. Tente novamente em 30 segundos."],
        [1, "Muitas tentativas. Tente novamente em 1 segundo."],
        [undefined, "Muitas tentativas. Tente novamente em instantes."],
    ] as const)(
        "avisa o limite de tentativas (espera: %s)",
        async (seconds, message) => {
            vi.mocked(registerProducer).mockResolvedValue({
                ok: false,
                reason: "rate_limit",
                retryAfterSeconds: seconds,
            });
            const { user } = renderRegister();

            await fillForm(user);
            await submit(user);

            const alert = await screen.findByRole("alert");
            expect(alert.textContent).toBe(message);
        },
    );

    it("mostra um erro genérico quando o serviço falha", async () => {
        vi.mocked(registerProducer).mockResolvedValue({
            ok: false,
            reason: "error",
        });
        const { user } = renderRegister();

        await fillForm(user);
        await submit(user);

        const alert = await screen.findByRole("alert");
        expect(alert.textContent).toBe(
            "Não foi possível concluir o cadastro agora. Tente novamente em instantes.",
        );
    });

    it("trata uma exceção inesperada do serviço como erro genérico", async () => {
        vi.mocked(registerProducer).mockRejectedValue(new Error("boom"));
        const { user } = renderRegister();

        await fillForm(user);
        await submit(user);

        const alert = await screen.findByRole("alert");
        expect(alert.textContent).toBe(
            "Não foi possível concluir o cadastro agora. Tente novamente em instantes.",
        );
    });

    it("mantém o que foi digitado e libera o botão depois da falha", async () => {
        vi.mocked(registerProducer).mockResolvedValue({
            ok: false,
            reason: "error",
        });
        const { user } = renderRegister();

        await fillForm(user);
        await submit(user);
        await screen.findByRole("alert");

        expect(
            (screen.getByLabelText("Nome da iniciativa") as HTMLInputElement)
                .value,
        ).toBe("Maria da Silva");
        expect(
            (
                screen.getByRole("button", {
                    name: "Continuar",
                }) as HTMLButtonElement
            ).disabled,
        ).toBe(false);
    });

    it("remove o aviso de falha ao enviar de novo", async () => {
        vi.mocked(registerProducer)
            .mockResolvedValueOnce({ ok: false, reason: "error" })
            .mockResolvedValueOnce({ ok: true });
        const { user } = renderRegister();

        await fillForm(user);
        await submit(user);
        await screen.findByRole("alert");

        await submit(user);

        await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
    });
});
