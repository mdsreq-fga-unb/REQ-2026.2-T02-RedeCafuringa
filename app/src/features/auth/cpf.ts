export function onlyDigits(value: string): string {
    return String(value).replace(/\D/g, "");
}

export function formatCpf(value: string): string {
    const digits = onlyDigits(value).slice(0, 11);
    const part1 = digits.slice(0, 3);
    const part2 = digits.slice(3, 6);
    const part3 = digits.slice(6, 9);
    const part4 = digits.slice(9, 11);

    let formatted = part1;
    if (part2) formatted += `.${part2}`;
    if (part3) formatted += `.${part3}`;
    if (part4) formatted += `-${part4}`;
    return formatted;
}

function checkDigit(base: string): number {
    let sum = 0;
    for (let index = 0; index < base.length; index++) {
        sum += Number(base[index]) * (base.length + 1 - index);
    }
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
}

export function isValidCpf(value: string): boolean {
    const cpf = onlyDigits(value);
    if (cpf.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cpf)) return false;

    const firstDigit = checkDigit(cpf.slice(0, 9));
    const secondDigit = checkDigit(cpf.slice(0, 10));
    return firstDigit === Number(cpf[9]) && secondDigit === Number(cpf[10]);
}
