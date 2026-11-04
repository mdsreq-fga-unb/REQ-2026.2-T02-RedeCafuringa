export function parseBirthDate(value: string): Date | undefined {
    const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(value);
    if (!match) return undefined;

    const [, dayValue, monthValue, yearValue] = match;
    const day = Number(dayValue);
    const month = Number(monthValue);
    const year = Number(yearValue);
    const date = new Date(Date.UTC(year, month - 1, day));

    if (
        date.getUTCFullYear() !== year ||
        date.getUTCMonth() !== month - 1 ||
        date.getUTCDate() !== day
    ) {
        return undefined;
    }
    return date;
}

export function isAdultBirthDate(value: string): boolean {
    const birthDate = parseBirthDate(value);
    if (!birthDate) return false;

    const adulthood = new Date(birthDate);
    adulthood.setUTCFullYear(birthDate.getUTCFullYear() + 18);
    return adulthood <= new Date();
}
