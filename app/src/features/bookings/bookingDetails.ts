import { apiResourceUrl } from "@/shared/api";
import type { components } from "@/shared/api/schema";
import { PAYMENT_LABELS } from "./bookingOptions";
import type { Booking, BookingStatus, PaymentMethod } from "./bookingTypes";

export type ApiBookingDetail = components["schemas"]["BookingDetailResponse"];
export type ApiBookingList = components["schemas"]["BookingListResponse"];

/** Pré-reserva consultada (HU45): a solicitação, a experiência e o outro lado. */
export type BookingDetail = Booking & {
    updatedAt: string;
    responseMessage?: string;
    experience: {
        name: string;
        local: string;
        pricePerPerson: number;
        available: boolean;
        photo?: string;
    };
    /** Consumidora (para a produtora) ou responsável (para a consumidora). */
    counterpart: { id: string; name: string };
};

const STATUS_LABELS: Record<BookingStatus, string> = {
    pendente: "Aguardando resposta",
    aceita: "Aceita pela produtora",
    recusada: "Recusada pela produtora",
    cancelada: "Cancelada",
};

const CURRENCY = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
});

/** HU45 CA04, CA07: converte a resposta da API, sempre com a situação atual. */
export function adaptBookingDetail(
    api: ApiBookingDetail,
    resolvePhoto: (path: string) => string = apiResourceUrl,
): BookingDetail {
    const { experiencia, contraparte } = api;
    return {
        id: api.id,
        experienceId: api.experienciaId,
        date: api.data,
        time: api.horario,
        participants: api.participantes,
        paymentMethod: api.formaPagamento,
        ...(api.mensagem ? { message: api.mensagem } : {}),
        ...(api.mensagemResposta
            ? { responseMessage: api.mensagemResposta }
            : {}),
        status: api.status,
        createdAt: api.criadoEm,
        updatedAt: api.atualizadoEm,
        experience: {
            name: experiencia.nome,
            local: experiencia.local,
            pricePerPerson: experiencia.valorPorPessoa,
            available: experiencia.disponivel,
            ...(experiencia.foto
                ? { photo: resolvePhoto(experiencia.foto) }
                : {}),
        },
        counterpart: { id: contraparte.id, name: contraparte.nome },
    };
}

export function bookingCode(id: string): string {
    return `CAF-${id.slice(-6).toUpperCase()}`;
}

export function bookingStatusLabel(status: BookingStatus): string {
    return STATUS_LABELS[status];
}

/** "2026-12-20" vira "20/12/2026" sem passar por Date (não desloca pelo fuso). */
export function formatBookingDate(date: string): string {
    const [year, month, day] = date.split("-");
    return `${day}/${month}/${year}`;
}

/** "09:00" vira "09h00", como no protótipo. */
export function formatBookingTime(time: string): string {
    return time.replace(":", "h");
}

export function formatParticipants(count: number): string {
    return count === 1 ? "1 participante" : `${count} participantes`;
}

export function paymentLabel(method: PaymentMethod): string {
    return PAYMENT_LABELS[method];
}

/** Valor da experiência para todos os participantes. */
export function bookingTotal(detail: BookingDetail): string {
    return CURRENCY.format(
        detail.experience.pricePerPerson * detail.participants,
    );
}
