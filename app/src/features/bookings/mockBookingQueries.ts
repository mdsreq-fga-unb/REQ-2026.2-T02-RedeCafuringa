import { listExperiences } from "@/features/offers/catalogItems";
import type { Product } from "@/features/offers/productTypes";
import type { ApiBookingDetail } from "./bookingDetails";
import { listMockBookings, type MockBookingRecord } from "./mockBookingService";

export type MockViewer = { role: string | null; userId: string };

/** Mesmos números da API: sinal de 50%, pago em até 24 horas do aceite. */
const DEPOSIT_DEADLINE_MS = 24 * 60 * 60 * 1000;
/** Chave de exemplo: na demonstração não há conta real de produtora. */
const DEMO_PIX_KEY = "pix.demonstracao@redecafuringa.org";

type DemoPayment = NonNullable<ApiBookingDetail["pagamento"]>;

/** Pagamento da pré-reserva aceita, calculado como a API faz no aceite. */
function demoPayment(
    record: MockBookingRecord,
    experience: Product | undefined,
): DemoPayment | undefined {
    if (record.status !== "aceita" || !experience) return undefined;
    const totalCents =
        Math.round(experience.price * 100) * record.participantes;
    const depositCents = Math.ceil(totalCents / 2);
    if (depositCents === 0)
        return { total: 0, sinal: 0, restante: 0, situacao: "dispensado" };
    const acceptedAt = new Date(record.atualizadoEm ?? record.criadoEm);
    const deadline = new Date(acceptedAt.getTime() + DEPOSIT_DEADLINE_MS);
    return {
        total: totalCents / 100,
        sinal: depositCents / 100,
        restante: (totalCents - depositCents) / 100,
        situacao:
            Date.now() > deadline.getTime() ? "expirado" : "aguardando-sinal",
        prazoSinal: deadline.toISOString(),
    };
}

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
        ...withPayment(record, experience, viewer),
    };
}

function withPayment(
    record: MockBookingRecord,
    experience: Product | undefined,
    viewer: MockViewer,
): Pick<ApiBookingDetail, "pagamento" | "pix"> {
    const pagamento = demoPayment(record, experience);
    if (!pagamento) return {};
    const needsPix =
        viewer.role !== "producer" && pagamento.situacao === "aguardando-sinal";
    return {
        pagamento,
        ...(needsPix
            ? {
                  pix: {
                      chave: DEMO_PIX_KEY,
                      nomeRecebedor:
                          experience?.producerName ||
                          "Produtora da demonstração",
                      cidade: "BRASILIA",
                      txid: record.id.replace(/[^A-Za-z0-9]/g, "").slice(0, 25),
                  },
              }
            : {}),
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
        .map((record) => {
            // Como na API, a lista nunca traz o Pix; só o detalhe.
            const item = toApiDetail(
                record,
                experiences.get(record.experienciaId),
                viewer,
            );
            delete item.pix;
            return item;
        });
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
