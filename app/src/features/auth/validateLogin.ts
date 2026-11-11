export type LoginErrors = {
    email?: string;
    password?: string;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLogin(values: {
    email: string;
    password: string;
}): LoginErrors {
    const errors: LoginErrors = {};
    const email = values.email.trim();

    if (!email) errors.email = "Informe o e-mail.";
    else if (!emailPattern.test(email))
        errors.email = "E-mail com formato inválido.";

    if (!values.password) errors.password = "Informe a senha.";

    return errors;
}
