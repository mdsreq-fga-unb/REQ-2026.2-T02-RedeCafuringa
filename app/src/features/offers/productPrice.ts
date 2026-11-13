export function formatProductPrice(price: number, unit: string): string {
    const value = new Intl.NumberFormat("pt-BR", {
        minimumFractionDigits: Number.isInteger(price) ? 0 : 2,
        maximumFractionDigits: 2,
    }).format(price);
    return `R$ ${value} / ${unit}`;
}
