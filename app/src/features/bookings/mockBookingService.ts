import { adaptBookingResponse } from "./bookingAdapter";
import type { Booking, BookingPayload, BookingResponse } from "./bookingTypes";

export const DEMO_BOOKINGS_KEY = "cafuringa-demo-bookings";

/** Lista as pré-reservas de demonstração, no formato da API. */
export function listMockBookings(): BookingResponse[] {
    try {
        const parsed: unknown = JSON.parse(
            localStorage.getItem(DEMO_BOOKINGS_KEY) ?? "[]",
        );
        return Array.isArray(parsed) ? (parsed as BookingResponse[]) : [];
    } catch {
        return [];
    }
}

export async function createMockBooking(
    payload: BookingPayload,
): Promise<Booking> {
    const bookings = listMockBookings();
    const response: BookingResponse = {
        id: `demo-booking-${Date.now().toString(36)}-${bookings.length + 1}`,
        experienciaId: payload.experienciaId,
        data: payload.data,
        horario: payload.horario,
        participantes: payload.participantes,
        formaPagamento: payload.formaPagamento,
        ...(payload.mensagem ? { mensagem: payload.mensagem } : {}),
        status: "pendente",
        criadoEm: new Date().toISOString(),
    };
    localStorage.setItem(
        DEMO_BOOKINGS_KEY,
        JSON.stringify([...bookings, response]),
    );
    return adaptBookingResponse(response);
}
