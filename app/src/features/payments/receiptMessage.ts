/**
 * Comprovante do sinal pelo WhatsApp: o arquivo vai direto da consumidora
 * para a produtora, sem passar pelo servidor do projeto.
 */
import { formatBookingDate } from "@/features/bookings/bookingDetails";
import { formatCentavos } from "./money";

export function receiptMessage({
    depositCents,
    experienceName,
    date,
}: {
    depositCents: number;
    experienceName: string;
    date: string;
}): string {
    return `Olá! Paguei o sinal de ${formatCentavos(depositCents)} da pré-reserva de ${experienceName} para ${formatBookingDate(date)}. Segue o comprovante.`;
}

/** Quem não consegue pagar por Pix pede outra forma à produtora. */
export function noPixMessage({
    experienceName,
    date,
}: {
    experienceName: string;
    date: string;
}): string {
    return `Olá! Tenho uma pré-reserva de ${experienceName} para ${formatBookingDate(date)} e não consigo pagar o sinal por Pix. Podemos combinar outra forma?`;
}

/** Conversa com a produtora no WhatsApp, já com a mensagem; sem telefone válido, nada. */
export function receiptWhatsAppUrl(
    phone: string | undefined,
    text: string,
): string | undefined {
    const digits = (phone ?? "").replace(/\D/g, "");
    const international =
        digits.length === 10 || digits.length === 11
            ? `55${digits}`
            : digits.length >= 12 && digits.startsWith("55")
              ? digits
              : "";
    return international
        ? `https://wa.me/${international}?text=${encodeURIComponent(text)}`
        : undefined;
}
