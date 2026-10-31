import { isValidCpf, onlyDigits } from "./cpf";

export type LoginErrors = {
    cpf?: string;
    password?: string;
};

export function validateLogin(values: {
    cpf: string;
    password: string;
}): LoginErrors {
    const errors: LoginErrors = {};

    if (!onlyDigits(values.cpf)) errors.cpf = "Informe o CPF.";
    else if (!isValidCpf(values.cpf)) errors.cpf = "CPF com formato inválido.";

    if (!values.password) errors.password = "Informe a senha.";

    return errors;
}
