import { listExperiences } from "@/features/offers/catalogItems";
import type { Product } from "@/features/offers/productTypes";
import type { ApiBookingDetail } from "./bookingDetails";
import { listMockBookings, type MockBookingRecord } from "./mockBookingService";

export type MockViewer = { role: string | null; userId: string };

/** Experiências da demonstração por id, para completar cada pré-reserva. */
async function experiencesById(): Promise<Map<string, Product>> {
    const experiences = await listExperiences();
    return new Map(experiences.map((item) => [item.id, item]));
}

/** Mesma regra da API (HU45 CA05): a consumidora vê as suas; a produtora, as recebidas. */
function canView(
    record: MockBookingRecord,
    experience: Product | undefined,
    viewer: MockViewer,
): boolean {
    if (viewer.role === "producer")
        return experience?.producerId === viewer.userId;
    return record.consumidorId === viewer.userId;
}

function toApiDetail(
    record: MockBookingRecord,
    experience: Product | undefined,
    viewer: MockViewer,
): ApiBookingDetail {
    const counterpart =
        viewer.role === "producer"
            ? {
                  id: record.consumidorId ?? "",
                  nome: record.consumidorNome || "Consumidora",
              }
            : {
                  id: experience?.producerId ?? "",
                  nome: experience?.producerName ?? "",
              };
    return {
        id: record.id,
        experienciaId: record.experienciaId,
        data: record.data,
        horario: record.horario,
        participantes: record.participantes,
        formaPagamento: record.formaPagamento,
        ...(record.mensagem ? { mensagem: record.mensagem } : {}),
        status: record.status,
        criadoEm: record.criadoEm,
        atualizadoEm: record.atualizadoEm ?? record.criadoEm,
        experiencia: {
            nome: experience?.name ?? "Experiência indisponível",
            local: experience?.local ?? "",
            valorPorPessoa: experience?.price ?? 0,
            disponivel: Boolean(experience),
            ...(experience?.image ? { foto: experience.image } : {}),
        },
        contraparte: counterpart,
    };
}

/** HU45 na demonstração: pré-reservas de quem está vendo, da mais nova à mais antiga. */
export async function listMockBookingDetails(
    viewer: MockViewer,
): Promise<ApiBookingDetail[]> {
    const experiences = await experiencesById();
    return listMockBookings()
        .filter((record) =>
            canView(record, experiences.get(record.experienciaId), viewer),
        )
        .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))
        .map((record) =>
            toApiDetail(record, experiences.get(record.experienciaId), viewer),
        );
}

/** Detalhe na demonstração; `null` como o 404 da API (CA05). */
export async function getMockBookingDetail(
    id: string,
    viewer: MockViewer,
): Promise<ApiBookingDetail | null> {
    const record = listMockBookings().find((item) => item.id === id);
    if (!record) return null;
    const experiences = await experiencesById();
    const experience = experiences.get(record.experienciaId);
    return canView(record, experience, viewer)
        ? toApiDetail(record, experience, viewer)
        : null;
}
