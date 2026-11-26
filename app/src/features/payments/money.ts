const currency = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
});

/** "R$ 45,00", com espaço comum (o Intl usa espaço não separável). */
export function formatCentavos(valorCentavos: number): string {
    return currency.format(valorCentavos / 100).replace(/\s/g, " ");
}
