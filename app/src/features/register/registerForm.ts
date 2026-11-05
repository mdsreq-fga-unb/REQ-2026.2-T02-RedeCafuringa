import { onlyDigits } from "@/features/auth/cpf";
import { isValidCpf } from "@/features/auth/cpf";
import { isAdultBirthDate, parseBirthDate } from "@/features/auth/birthDate";
import {
    isValidCnpj,
    isValidEmail,
    isValidPassword,
    isValidPhone,
    passwordsMatch,
} from "./validators";

export type DocumentType = "cpf" | "cnpj";

export interface RegisterFormValues {
    documentType: DocumentType;
    birthDate: string;
    name: string;
    document: string;
    phone: string;
    email: string;
    address: string;
    password: string;
    confirmPassword: string;
}

export type RegisterFormErrors = Partial<
    Record<keyof RegisterFormValues, string>
>;

export function validateRegisterForm(
    values: RegisterFormValues,
): RegisterFormErrors {
    const errors: RegisterFormErrors = {};
    const document = values.document.trim();
    const phone = values.phone.trim();
    const email = values.email.trim();

    const isCnpj = values.documentType === "cnpj";
    const documentLabel = isCnpj ? "CNPJ" : "CPF";
    const documentIsValid = isCnpj
        ? isValidCnpj(document)
        : isValidCpf(document);

    if (!values.name.trim()) errors.name = "Informe o nome.";

    if (!document) errors.document = `Informe o ${documentLabel}.`;
    else if (!documentIsValid) errors.document = `${documentLabel} inválido.`;

    if (!phone) errors.phone = "Informe o telefone.";
    else if (!isValidPhone(phone))
        errors.phone = "Telefone inválido. Informe o DDD e o número.";

    if (!email) errors.email = "Informe o e-mail.";
    else if (!isValidEmail(email)) errors.email = "E-mail inválido.";

    if (!values.address.trim()) errors.address = "Informe o endereço.";

    if (!values.password) errors.password = "Informe a senha.";
    else if (values.password.length < 8) {
        errors.password = "A senha deve ter no mínimo 8 caracteres.";
    } else if (values.password.length > 128) {
        errors.password = "A senha deve ter no máximo 128 caracteres.";
    } else if (!isValidPassword(values.password)) {
        errors.password = "A senha deve ter letras e números.";
    }

    if (!values.confirmPassword) errors.confirmPassword = "Confirme a senha.";
    else if (!passwordsMatch(values.password, values.confirmPassword)) {
        errors.confirmPassword = "As senhas não conferem.";
    }

    if (!isCnpj) {
        if (!values.birthDate.trim()) {
            errors.birthDate = "Informe a data de nascimento.";
        } else if (!parseBirthDate(values.birthDate)) {
            errors.birthDate = "Informe uma data válida no formato DD-MM-AAAA.";
        } else if (!isAdultBirthDate(values.birthDate)) {
            errors.birthDate =
                "É necessário ter 18 anos ou mais para se cadastrar.";
        }
    }

    return errors;
}

export interface RegisterPayload {
    name: string;
    document: string;
    phone: string;
    email: string;
    address: string;
    password: string;
}

export function buildRegisterPayload(
    values: RegisterFormValues,
): RegisterPayload {
    return {
        name: values.name.trim(),
        document: onlyDigits(values.document),
        phone: onlyDigits(values.phone),
        email: values.email.trim().toLowerCase(),
        address: values.address.trim(),
        password: values.password,
    };
}
