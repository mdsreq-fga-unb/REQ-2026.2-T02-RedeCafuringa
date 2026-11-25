/**
 * Aviso na solicitação: o que acontece com o pagamento se a produtora aceitar.
 * Mesmos números da API (sinal de 50%, prazo de 24 horas).
 */
import { formatCentavos } from "@/features/payments/money";

export function depositNotice({
    pricePerPerson,
    participants,
    requiresDeposit = true,
    method,
}: {
    pricePerPerson: number;
    participants: number;
    /** Ausente nas experiências antigas: pedem sinal. */
    requiresDeposit?: boolean;
    method: string;
}): string {
    const totalCents = Math.round(pricePerPerson * 100) * participants;
    if (totalCents <= 0) return "";
    const cash = method === "dinheiro";
    if (!requiresDeposit)
        return cash
            ? `Esta experiência não pede sinal. Você paga ${formatCentavos(totalCents)} em dinheiro no dia. Leve o valor trocado, se possível.`
            : `Esta experiência não pede sinal. Você paga ${formatCentavos(totalCents)} no dia, com a produtora.`;
    const depositCents = Math.ceil(totalCents / 2);
    const rest = formatCentavos(totalCents - depositCents);
    return `Se a produtora aceitar, você terá 24 horas para pagar o sinal de 50% (${formatCentavos(depositCents)}) por Pix e garantir a vaga. ${
        cash
            ? `O restante (${rest}) você paga em dinheiro no dia.`
            : `O restante (${rest}) você paga no dia, com a produtora.`
    }`;
}
