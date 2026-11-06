import { isValidEmail } from "@/features/register/validators";

export type RecoveryRequestErrors = { email?: string };

export function validateRecoveryRequest(input: {
    email: string;
}): RecoveryRequestErrors {
    const email = input.email.trim();
    if (!email) return { email: "Informe o e-mail." };
    if (!isValidEmail(email)) return { email: "E-mail com formato inválido." };
    return {};
}