import { describe, expect, it } from "vitest";
import {
    buildRegisterPayload,
    validateRegisterForm,
    type RegisterFormValues,
} from "@/features/register/registerForm";

const validForm: RegisterFormValues = {
    documentType: "cpf",
    birthDate: "10-05-1990",
    name: "Maria da Silva",
    document: "529.982.247-25",
    phone: "(61) 91234-5678",
    email: "maria@exemplo.com",
    address: "Chácara 12, Núcleo Rural, Brasília - DF",
    password: "senha-segura-1",
    confirmPassword: "senha-segura-1",
};

describe("buildRegisterPayload", () => {
    it("normaliza os campos para o formato enviado à API", () => {
        const payload = buildRegisterPayload({
            ...validForm,
            name: "  Maria da Silva  ",
            document: "529.982.247-25",
            phone: "(61) 91234-5678",
            email: "  Maria@Exemplo.COM ",
            address: "  Chácara 12, Núcleo Rural  ",
        });

        expect(payload).toEqual({
            name: "Maria da Silva",
            document: "52998224725",
            phone: "61912345678",
            email: "maria@exemplo.com",
            address: "Chácara 12, Núcleo Rural",
            password: "senha-segura-1",
        });
    });

    it("usa só dígitos no CNPJ e preserva a senha exatamente como digitada", () => {
        const payload = buildRegisterPayload({
            ...validForm,
            documentType: "cnpj",
            document: "11.222.333/0001-81",
            password: " senha com espaço ",
            confirmPassword: " senha com espaço ",
        });

        expect(payload.document).toBe("11222333000181");
        expect(payload.password).toBe(" senha com espaço ");
    });
});

describe("validateRegisterForm: campos obrigatórios", () => {
    it("não retorna erros para um formulário válido", () => {
        expect(validateRegisterForm(validForm)).toEqual({});
    });

    it("sinaliza todos os campos obrigatórios vazios", () => {
        const empty: RegisterFormValues = {
            ...validForm,
            birthDate: "",
            name: "",
            document: "",
            phone: "",
            email: "",
            address: "",
            password: "",
            confirmPassword: "",
        };

        expect(validateRegisterForm(empty)).toEqual({
            name: "Informe o nome.",
            document: "Informe o CPF.",
            phone: "Informe o telefone.",
            email: "Informe o e-mail.",
            address: "Informe o endereço.",
            password: "Informe a senha.",
            confirmPassword: "Confirme a senha.",
            birthDate: "Informe a data de nascimento.",
        });
    });

    it("exige data válida e maioridade para pessoa física", () => {
        expect(
            validateRegisterForm({ ...validForm, birthDate: "31-02-1990" })
                .birthDate,
        ).toBe("Informe uma data válida no formato DD-MM-AAAA.");
        expect(
            validateRegisterForm({ ...validForm, birthDate: "04-11-2010" })
                .birthDate,
        ).toBe("É necessário ter 18 anos ou mais para se cadastrar.");
    });

    it("rejeita senha sem letra ou sem número", () => {
        const onlyNumbers = validateRegisterForm({
            ...validForm,
            password: "12345678",
            confirmPassword: "12345678",
        });
        const onlyLetters = validateRegisterForm({
            ...validForm,
            password: "somenteletras",
            confirmPassword: "somenteletras",
        });

        expect(onlyNumbers.password).toBe("A senha deve ter letras e números.");
        expect(onlyLetters.password).toBe("A senha deve ter letras e números.");
    });

    it("rejeita senha com mais de 128 caracteres", () => {
        const long = `a1${"x".repeat(127)}`;
        const errors = validateRegisterForm({
            ...validForm,
            password: long,
            confirmPassword: long,
        });

        expect(errors.password).toBe(
            "A senha deve ter no máximo 128 caracteres.",
        );
    });

    it("pede CNPJ quando o tipo de documento escolhido é CNPJ", () => {
        const errors = validateRegisterForm({
            ...validForm,
            documentType: "cnpj",
            document: "",
        });
        expect(errors.document).toBe("Informe o CNPJ.");
    });

    it("trata campos só com espaços como vazios", () => {
        const errors = validateRegisterForm({
            ...validForm,
            name: "   ",
            address: "  ",
        });
        expect(errors).toMatchObject({
            name: "Informe o nome.",
            address: "Informe o endereço.",
        });
    });

    describe("validateRegisterForm: formato e regras", () => {
        it("rejeita CPF inválido", () => {
            const errors = validateRegisterForm({
                ...validForm,
                document: "529.982.247-24",
            });
            expect(errors.document).toBe("CPF inválido.");
        });

        it("valida o documento conforme o tipo escolhido (CNPJ)", () => {
            const cnpj = {
                ...validForm,
                documentType: "cnpj" as const,
                birthDate: "",
            };

            expect(
                validateRegisterForm({
                    ...cnpj,
                    document: "11.222.333/0001-81",
                }).document,
            ).toBeUndefined();
            expect(
                validateRegisterForm({
                    ...cnpj,
                    document: "11.222.333/0001-82",
                }).document,
            ).toBe("CNPJ inválido.");
            expect(
                validateRegisterForm({ ...cnpj, document: "529.982.247-25" })
                    .document,
            ).toBe("CNPJ inválido.");
        });

        it("rejeita telefone fora do padrão", () => {
            const errors = validateRegisterForm({
                ...validForm,
                phone: "(61) 3333-444",
            });
            expect(errors.phone).toBe(
                "Telefone inválido. Informe o DDD e o número.",
            );
        });

        it("rejeita e-mail com formato inválido", () => {
            const errors = validateRegisterForm({
                ...validForm,
                email: "maria@exemplo",
            });
            expect(errors.email).toBe("E-mail inválido.");
        });

        it("ignora espaços nas pontas do e-mail", () => {
            const errors = validateRegisterForm({
                ...validForm,
                email: "  maria@exemplo.com  ",
            });
            expect(errors.email).toBeUndefined();
        });

        it("rejeita senha com menos de 8 caracteres", () => {
            const errors = validateRegisterForm({
                ...validForm,
                password: "curta12",
                confirmPassword: "curta12",
            });
            expect(errors.password).toBe(
                "A senha deve ter no mínimo 8 caracteres.",
            );
            expect(errors.confirmPassword).toBeUndefined();
        });

        it("rejeita confirmação diferente da senha", () => {
            const errors = validateRegisterForm({
                ...validForm,
                confirmPassword: "senha-segura-2",
            });
            expect(errors.confirmPassword).toBe("As senhas não conferem.");
        });
    });
});
