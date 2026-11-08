import {
    isValidEmail,
    isValidPassword,
    passwordsMatch,
} from "@/features/register/validators";

export type RecoveryRequestErrors = { email?: string };

export type NewPasswordErrors = {
    password?: string;
    confirmPassword?: string;
};

export function validateNewPassword(input: {
    password: string;
    confirmPassword: string;
}): NewPasswordErrors {
    const errors: NewPasswordErrors = {};
    const { password, confirmPassword } = input;

    if (!password) errors.password = "Informe a nova senha.";
    else if (password.length < 8) {
        errors.password = "A senha deve ter no mínimo 8 caracteres.";
    } else if (password.length > 128) {
        errors.password = "A senha deve ter no máximo 128 caracteres.";
    } else if (!isValidPassword(password)) {
        errors.password = "A senha deve ter letras e números.";
    }

    if (!confirmPassword) errors.confirmPassword = "Confirme a nova senha.";
    else if (!passwordsMatch(password, confirmPassword)) {
        errors.confirmPassword = "As senhas não conferem.";
    }

    return errors;
}

export function validateRecoveryRequest(input: {
    email: string;
}): RecoveryRequestErrors {
    const email = input.email.trim();
    if (!email) return { email: "Informe o e-mail." };
    if (!isValidEmail(email)) return { email: "E-mail com formato inválido." };
    return {};
}
