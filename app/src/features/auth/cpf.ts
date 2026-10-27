export function onlyDigits(value: ""): string { 
    return String(value).replace(/\D/g, "");
}

export function formatCpf(value: ""): string {
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