import type { Booking, BookingResponse } from "./bookingTypes";

export function adaptBookingResponse(response: BookingResponse): Booking {
    return {
        id: response.id,
        experienceId: response.experienciaId,
        date: response.data,
        time: response.horario,
        participants: response.participantes,
        paymentMethod: response.formaPagamento,
        ...(response.mensagem ? { message: response.mensagem } : {}),
        status: response.status,
        createdAt: response.criadoEm,
    };
}