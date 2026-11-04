import { onlyDigits } from "@/features/auth/cpf";

function checkDigit(digits: number[], weights: number[]): number {
    const sum = digits.reduce((acc, d, i) => acc + d * weights[i], 0);
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
}

export function isValidCnpj(value: string): boolean {
    const digits = onlyDigits(value);
    if (digits.length !== 14 || /^(\d)\1+$/.test(digits)) return false;

    const nums = digits.split("").map(Number);
    const d1 = checkDigit(
        nums.slice(0, 12),
        [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
    );
    const d2 = checkDigit(
        nums.slice(0, 13),
        [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
    );
    return d1 === nums[12] && d2 === nums[13];
}

export function formatCnpj(value: string): string {
    const digits = onlyDigits(value).slice(0, 14);
    const part1 = digits.slice(0, 2);
    const part2 = digits.slice(2, 5);
    const part3 = digits.slice(5, 8);
    const part4 = digits.slice(8, 12);
    const part5 = digits.slice(12, 14);

    let formatted = part1;
    if (part2) formatted += `.${part2}`;
    if (part3) formatted += `.${part3}`;
    if (part4) formatted += `/${part4}`;
    if (part5) formatted += `-${part5}`;
    return formatted;
}

export function isValidPhone(value: string): boolean {
    const digits = onlyDigits(value);
    if (digits.length !== 10 && digits.length !== 11) return false;
    if (Number(digits.slice(0, 2)) < 11) return false;
    if (digits.length === 11 && digits[2] !== "9") return false;
    return true;
}

export function formatPhone(value: string): string {
    const digits = onlyDigits(value).slice(0, 11);
    const ddd = digits.slice(0, 2);
    const rest = digits.slice(2);
    const splitAt = digits.length > 10 ? 5 : 4;
    const first = rest.slice(0, splitAt);
    const last = rest.slice(splitAt);

    let formatted = ddd ? `(${ddd}` : "";
    if (first) formatted += `) ${first}`;
    if (last) formatted += `-${last}`;
    return formatted;
}

export function isValidEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isValidPassword(value: string): boolean {
    return (
        value.length >= 8 &&
        value.length <= 128 &&
        /\p{L}/u.test(value) &&
        /\d/.test(value)
    );
}

export function passwordsMatch(
    password: string,
    confirmation: string,
): boolean {
    return password === confirmation;
}
