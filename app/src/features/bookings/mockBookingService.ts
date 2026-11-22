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
};

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
