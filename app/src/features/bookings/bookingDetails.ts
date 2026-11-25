import { apiResourceUrl } from "@/shared/api";
import type { components } from "@/shared/api/schema";
import { PAYMENT_LABELS } from "./bookingOptions";
import type { Booking, BookingStatus, PaymentMethod } from "./bookingTypes";

/** Situação do sinal (pagamento por Pix), como a API devolve. */
export type PaymentStatus =
    | "aguardando-sinal"
    | "comprovante-enviado"
    | "sinal-confirmado"
    | "expirado"
    | "dispensado";

/** Pagamento e Pix do detalhe; ainda fora do contrato gerado. */
export type ApiPayment = {
    total: number;
    sinal: number;
    restante: number;
    situacao: PaymentStatus;
    prazoSinal?: string;
    /** Depois do cancelamento com sinal pago. */
    devolucao?: RefundStatus;
};

/** A produtora ainda deve devolver, já devolveu, ou o sinal ficou com ela. */
export type RefundStatus = "pendente" | "feita" | "retido";
type ApiPix = {
    chave: string;
    nomeRecebedor: string;
    cidade: string;
    txid: string;
};
export type ApiBookingDetail =
    components["schemas"]["BookingDetailResponse"] & {
        pagamento?: ApiPayment;
        pix?: ApiPix;
    };
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
    /** Só depois do aceite. Valores em centavos, para o código Pix. */
    payment?: BookingPayment;
    /** Só para a consumidora, enquanto o sinal está por pagar. */
    pix?: BookingPix;
};

export type BookingPayment = {
    totalCents: number;
    depositCents: number;
    remainingCents: number;
    status: PaymentStatus;
    depositDeadline?: string;
    refund?: RefundStatus;
};

export type BookingPix = {
    key: string;
    receiver: string;
    city: string;
    txid: string;
};

const toCents = (reais: number) => Math.round(reais * 100);

export function adaptPayment(api: ApiPayment): BookingPayment {
    return {
        totalCents: toCents(api.total),
        depositCents: toCents(api.sinal),
        remainingCents: toCents(api.restante),
        status: api.situacao,
        ...(api.prazoSinal ? { depositDeadline: api.prazoSinal } : {}),
        ...(api.devolucao ? { refund: api.devolucao } : {}),
    };
}

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
        ...(api.pagamento ? { payment: adaptPayment(api.pagamento) } : {}),
        ...(api.pix
            ? {
                  pix: {
                      key: api.pix.chave,
                      receiver: api.pix.nomeRecebedor,
                      city: api.pix.cidade,
                      txid: api.pix.txid,
                  },
              }
            : {}),
    };
}

const DEADLINE = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
});

/** Prazo do sinal no horário de Brasília: "22/11/2026 às 10h30". */
export function formatDepositDeadline(iso: string): string {
    const part = Object.fromEntries(
        DEADLINE.formatToParts(new Date(iso)).map((p) => [p.type, p.value]),
    );
    return `${part.day}/${part.month}/${part.year} às ${part.hour}h${part.minute}`;
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
