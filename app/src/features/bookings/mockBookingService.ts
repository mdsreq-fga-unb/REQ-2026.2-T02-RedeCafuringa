import type { PaymentStatus } from "./bookingDetails";
import { adaptBookingResponse } from "./bookingAdapter";
import type { Booking, BookingPayload, BookingResponse } from "./bookingTypes";

export const DEMO_BOOKINGS_KEY = "cafuringa-demo-bookings";

/**
 * Pré-reserva guardada na demonstração. Além do formato da API, guarda quem
 * enviou, para a consulta separar as solicitações por conta (HU45 CA05).
 */
export type MockBookingRecord = BookingResponse & {
    consumidorId?: string;
    consumidorNome?: string;
    /** Última mudança de situação (HU46). */
    atualizadoEm?: string;
    /** Situação do sinal depois do aviso ou da confirmação (pagamento por Pix). */
    situacaoPagamento?: PaymentStatus;
};

/** Mesmos motivos do servidor quando a solicitação não está pendente (RN20). */
const NOT_CANCELLABLE: Partial<Record<BookingResponse["status"], string>> = {
    aceita: "Esta pré-reserva já foi aceita: apenas o produtor responsável pode cancelá-la",
    recusada:
        "Esta pré-reserva foi recusada pelo produtor e não pode ser cancelada",
    cancelada: "Esta pré-reserva já foi cancelada",
};

export type MockCancelResult =
    | { ok: true; booking: BookingResponse }
    | { ok: false; reason: "nao-encontrada" }
    | { ok: false; reason: "nao-cancelavel"; message: string };

/** Lista as pré-reservas de demonstração, no formato da API. */
export function listMockBookings(): MockBookingRecord[] {
    try {
        const parsed: unknown = JSON.parse(
            localStorage.getItem(DEMO_BOOKINGS_KEY) ?? "[]",
        );
        return Array.isArray(parsed) ? (parsed as MockBookingRecord[]) : [];
    } catch {
        return [];
    }
}

export async function createMockBooking(
    payload: BookingPayload,
): Promise<Booking> {
    const bookings = listMockBookings();
    const consumidorId = localStorage.getItem("cafuringa-user-id");
    const consumidorNome = localStorage.getItem("cafuringa-name");
    const response: MockBookingRecord = {
        id: `demo-booking-${Date.now().toString(36)}-${bookings.length + 1}`,
        experienciaId: payload.experienciaId,
        data: payload.data,
        horario: payload.horario,
        participantes: payload.participantes,
        formaPagamento: payload.formaPagamento,
        ...(payload.mensagem ? { mensagem: payload.mensagem } : {}),
        status: "pendente",
        criadoEm: new Date().toISOString(),
        ...(consumidorId ? { consumidorId } : {}),
        ...(consumidorNome ? { consumidorNome } : {}),
    };
    localStorage.setItem(
        DEMO_BOOKINGS_KEY,
        JSON.stringify([...bookings, response]),
    );
    return adaptBookingResponse(response);
}

/**
 * HU46 na demonstração: a dona cancela a própria solicitação pendente. De
 * outra conta ou inexistente responde como o 404 da API (CA05).
 */
export function cancelMockBooking(
    id: string,
    userId: string,
): MockCancelResult {
    const bookings = listMockBookings();
    const record = bookings.find(
        (item) => item.id === id && item.consumidorId === userId,
    );
    if (!record) return { ok: false, reason: "nao-encontrada" };
    if (record.status !== "pendente")
        return {
            ok: false,
            reason: "nao-cancelavel",
            message:
                NOT_CANCELLABLE[record.status] ??
                "Apenas pré-reservas pendentes podem ser canceladas",
        };
    const updated: MockBookingRecord = {
        ...record,
        status: "cancelada",
        atualizadoEm: new Date().toISOString(),
    };
    localStorage.setItem(
        DEMO_BOOKINGS_KEY,
        JSON.stringify(
            bookings.map((item) => (item.id === id ? updated : item)),
        ),
    );
    return { ok: true, booking: updated };
}
