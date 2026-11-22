import { ApiHttpError } from "@/shared/api";
import type {
    BookingDecision,
    ReceivedBooking,
} from "./receivedBookingsService";

export const DEMO_BOOKING_RESPONSES_KEY = "cafuringa-demo-booking-responses";

// Dados fictícios da conta produtora de demonstração.
const sample: ReceivedBooking = {
    id: "demo-reserva-124",
    experienciaId: "queijos",
    codigo: "CAF-0124",
    experienciaNome: "Visita e Degustação de Queijos",
    propriedade: "Cafuringa, DF",
    consumidorNome: "Ana Oliveira",
    data: "2026-10-17",
    horario: "09:00",
    participantes: 2,
    valorTotal: 90,
    formaPagamento: "pix",
    mensagem: "Gostaríamos de conhecer o sítio.",
    status: "pendente",
    criadoEm: "2026-10-01T12:00:00Z",
};

const bookings = [
    sample,
    {
        ...sample,
        id: "demo-reserva-125",
        codigo: "CAF-0125",
        consumidorNome: "Carlos de Andrade",
        data: "2026-10-18",
        horario: "15:00",
        participantes: 4,
        valorTotal: 180,
        status: "aceita",
        mensagemResposta: "Esperamos vocês às 15h.",
    },
    {
        ...sample,
        id: "demo-reserva-126",
        codigo: "CAF-0126",
        consumidorNome: "Carlos de Andrade",
        status: "recusada",
        mensagemResposta: "Não teremos disponibilidade.",
    },
] satisfies ReceivedBooking[];

function canViewDemoBookings() {
    return (
        localStorage.getItem("cafuringa-role") === "producer" &&
        localStorage.getItem("cafuringa-user-id") === "2" &&
        localStorage.getItem("cafuringa-token") === "mock-token-2"
    );
}

type DemoResponse = {
    status: BookingDecision;
    mensagemResposta: string;
};

function readResponses(): Record<string, DemoResponse> {
    try {
        const stored: unknown = JSON.parse(
            localStorage.getItem(DEMO_BOOKING_RESPONSES_KEY) ?? "{}",
        );
        if (!stored || typeof stored !== "object" || Array.isArray(stored)) {
            return {};
        }
        return Object.fromEntries(
            Object.entries(stored).filter(
                ([, response]) =>
                    response &&
                    (response.status === "aceita" ||
                        response.status === "recusada") &&
                    typeof response.mensagemResposta === "string",
            ),
        );
    } catch {
        return {};
    }
}

function list(): ReceivedBooking[] {
    if (!canViewDemoBookings()) return [];
    const responses = readResponses();
    return bookings.map((booking) => ({
        ...booking,
        ...responses[booking.id],
    }));
}

function get(id: string): ReceivedBooking {
    if (!canViewDemoBookings()) {
        throw new ApiHttpError({ status: 403, message: "Acesso negado." });
    }
    const booking = list().find((item) => item.id === id);
    if (!booking) {
        throw new ApiHttpError({
            status: 404,
            message: "Solicitação não encontrada.",
        });
    }
    return booking;
}

export const demoReceivedBookings = {
    list,
    get,
    respond(
        id: string,
        status: BookingDecision,
        mensagemResposta: string,
    ): ReceivedBooking {
        const booking = get(id);
        if (booking.status !== "pendente") {
            throw new ApiHttpError({
                status: 409,
                message: "Solicitação já respondida.",
            });
        }
        const response = { status, mensagemResposta };
        localStorage.setItem(
            DEMO_BOOKING_RESPONSES_KEY,
            JSON.stringify({ ...readResponses(), [id]: response }),
        );
        return { ...booking, ...response };
    },
};
