import { listExperiences } from "@/features/offers/catalogItems";
import type { Product } from "@/features/offers/productTypes";
import { depositOnCancel } from "./bookingCancellation";
import type { ApiBookingDetail, PaymentStatus } from "./bookingDetails";
import {
    DEMO_BOOKINGS_KEY,
    listMockBookings,
    type MockBookingRecord,
} from "./mockBookingService";

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
    if (record.status === "cancelada") return record.pagamentoCancelado;
    if (record.status !== "aceita" || !experience) return undefined;
    const totalCents =
        Math.round(experience.price * 100) * record.participantes;
    const depositCents = Math.ceil(totalCents / 2);
    if (depositCents === 0)
        return { total: 0, sinal: 0, restante: 0, situacao: "dispensado" };
    const acceptedAt = new Date(record.atualizadoEm ?? record.criadoEm);
    const deadline = new Date(acceptedAt.getTime() + DEPOSIT_DEADLINE_MS);
    const saved = record.situacaoPagamento ?? "aguardando-sinal";
    return {
        total: totalCents / 100,
        sinal: depositCents / 100,
        restante: (totalCents - depositCents) / 100,
        situacao:
            saved === "aguardando-sinal" && Date.now() > deadline.getTime()
                ? "expirado"
                : saved,
        prazoSinal: deadline.toISOString(),
    };
}

export type MockPaymentAction =
    | "enviar-comprovante"
    | "confirmar-sinal"
    | "nao-encontrado"
    | "sinal-devolvido";

/** Mesmas mensagens da API quando a ação não vale na situação atual. */
function paymentActionError(
    action: Exclude<MockPaymentAction, "sinal-devolvido">,
    record: MockBookingRecord,
    payment: DemoPayment | undefined,
): string | null {
    if (record.status !== "aceita")
        return {
            "enviar-comprovante":
                "Só é possível avisar o pagamento de uma pré-reserva aceita.",
            "confirmar-sinal":
                "Só é possível confirmar o sinal de uma pré-reserva aceita.",
            "nao-encontrado":
                "Só é possível contestar o pagamento de uma pré-reserva aceita.",
        }[action];
    if (!payment || payment.situacao === "dispensado")
        return "Esta pré-reserva não pede sinal.";
    if (payment.situacao === "sinal-confirmado")
        return "O sinal desta pré-reserva já foi confirmado.";
    if (action === "enviar-comprovante") {
        if (payment.situacao === "expirado")
            return "O prazo para pagar o sinal terminou. Fale com a produtora.";
        if (payment.situacao === "comprovante-enviado")
            return "Você já avisou que pagou o sinal. A produtora vai conferir.";
    }
    if (
        action === "nao-encontrado" &&
        payment.situacao !== "comprovante-enviado"
    )
        return "A consumidora ainda não avisou que pagou o sinal.";
    return null;
}

const NEXT_STATUS: Record<
    Exclude<MockPaymentAction, "sinal-devolvido">,
    PaymentStatus
> = {
    "enviar-comprovante": "comprovante-enviado",
    "confirmar-sinal": "sinal-confirmado",
    "nao-encontrado": "aguardando-sinal",
};

function saveRecord(records: MockBookingRecord[], updated: MockBookingRecord) {
    localStorage.setItem(
        DEMO_BOOKINGS_KEY,
        JSON.stringify(
            records.map((item) => (item.id === updated.id ? updated : item)),
        ),
    );
}

/** Aviso, confirmação ou contestação do sinal, com as regras da API. */
export async function updateMockPayment(
    id: string,
    action: MockPaymentAction,
    viewer: MockViewer,
): Promise<
    { ok: true; payment: DemoPayment } | { ok: false; message: string }
> {
    const records = listMockBookings();
    const record = records.find((item) => item.id === id);
    const experiences = await experiencesById();
    const experience = record && experiences.get(record.experienciaId);
    const producerAction = action !== "enviar-comprovante";
    if (
        !record ||
        !canView(record, experience, viewer) ||
        producerAction !== (viewer.role === "producer")
    )
        return { ok: false, message: "Pré-reserva não encontrada." };
    if (action === "sinal-devolvido") {
        const refund = record.pagamentoCancelado?.devolucao;
        if (refund === "feita")
            return {
                ok: false,
                message: "A devolução do sinal já foi registrada.",
            };
        if (record.status !== "cancelada" || refund !== "pendente")
            return {
                ok: false,
                message: "Não há sinal a devolver nesta pré-reserva.",
            };
        const payment: DemoPayment = {
            ...record.pagamentoCancelado!,
            devolucao: "feita",
        };
        saveRecord(records, { ...record, pagamentoCancelado: payment });
        return { ok: true, payment };
    }
    const error = paymentActionError(
        action,
        record,
        demoPayment(record, experience),
    );
    if (error) return { ok: false, message: error };
    const updated = { ...record, situacaoPagamento: NEXT_STATUS[action] };
    saveRecord(records, updated);
    return { ok: true, payment: demoPayment(updated, experience)! };
}

/** Por que a produtora não cancela: a pendente se responde (HU47). */
const PRODUCER_NOT_CANCELLABLE: Record<string, string> = {
    pendente:
        "Esta pré-reserva ainda está pendente: responda aceitando ou recusando.",
    recusada: "Esta pré-reserva foi recusada e não pode ser cancelada.",
    cancelada: "Esta pré-reserva já foi cancelada.",
};

type DemoCancelled = MockBookingRecord & {
    sinal?: { resultado: "devolver" | "retido"; valor: number };
};

/** Cancela a aceita com a regra do sinal, como a API (RN20 revista). */
export async function cancelMockAccepted(
    id: string,
    by: "consumidora" | "produtora",
    viewer: MockViewer,
): Promise<
    | { ok: true; booking: DemoCancelled }
    | { ok: false; reason: "nao-encontrada" }
    | { ok: false; reason: "nao-cancelavel"; message: string }
> {
    const records = listMockBookings();
    const record = records.find((item) => item.id === id);
    const experiences = await experiencesById();
    const experience = record && experiences.get(record.experienciaId);
    if (
        !record ||
        !canView(record, experience, viewer) ||
        (by === "produtora") !== (viewer.role === "producer")
    )
        return { ok: false, reason: "nao-encontrada" };
    if (record.status !== "aceita")
        return {
            ok: false,
            reason: "nao-cancelavel",
            message:
                (by === "produtora"
                    ? PRODUCER_NOT_CANCELLABLE[record.status]
                    : undefined) ?? "Esta pré-reserva não pode ser cancelada.",
        };
    const payment = demoPayment(record, experience);
    const outcome = payment
        ? depositOnCancel(
              {
                  date: record.data,
                  time: record.horario,
                  payment: {
                      totalCents: Math.round(payment.total * 100),
                      depositCents: Math.round(payment.sinal * 100),
                      remainingCents: Math.round(payment.restante * 100),
                      status: payment.situacao,
                  },
              },
              by,
          )
        : null;
    const updated: MockBookingRecord = {
        ...record,
        status: "cancelada",
        atualizadoEm: new Date().toISOString(),
        ...(payment
            ? {
                  pagamentoCancelado: {
                      ...payment,
                      ...(outcome
                          ? {
                                devolucao:
                                    outcome.result === "devolver"
                                        ? ("pendente" as const)
                                        : ("retido" as const),
                            }
                          : {}),
                  },
              }
            : {}),
    };
    saveRecord(records, updated);
    return {
        ok: true,
        booking: {
            ...updated,
            ...(outcome
                ? {
                      sinal: {
                          resultado: outcome.result,
                          valor: outcome.cents / 100,
                      },
                  }
                : {}),
        },
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
