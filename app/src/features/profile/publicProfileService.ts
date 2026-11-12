import { getApiClient } from "@/shared/api";
import { isMockAuthEnabled } from "@/features/auth/authMode";
import { readMockUserDetails } from "@/features/auth/mockAuth";
import { getPublicTrajectory } from "@/features/trajectory/trajectoryService";
import type { PublicTrajectory } from "@/features/trajectory/trajectoryService";
import type { Offer } from "@/shared/types";
import { demoPublicProfiles, demoPublicOffers } from "./publicProfileDemo";

export type ProducerOffer = Offer & { producerId: string };

// Contratos propostos pelo front da HU14; endpoints de listagem/ofertas
// ainda dependem do backend. Não usa /users (consulta administrativa).
export async function listPublicProducers(
    signal?: AbortSignal,
): Promise<PublicTrajectory[]> {
    if (isMockAuthEnabled) {
        const registered = await Promise.allSettled(
            readMockUserDetails()
                .filter((user) => user.perfil === "PRODUTOR")
                .map((user) => getPublicTrajectory(user.id, signal)),
        );
        return [
            ...demoPublicProfiles,
            ...registered.flatMap((result) =>
                result.status === "fulfilled" ? [result.value] : [],
            ),
        ];
    }
    const data = await getApiClient().get<PublicTrajectory[]>("/producers", {
        auth: false,
        signal,
    });
    if (!Array.isArray(data))
        throw new Error("Resposta de produtores inválida");
    return data.filter((profile) => profile && typeof profile.id === "string");
}

export async function listProducerOffers(
    id: string,
    signal?: AbortSignal,
): Promise<ProducerOffer[]> {
    const data = isMockAuthEnabled
        ? demoPublicOffers
        : await getApiClient().get<ProducerOffer[]>(
              `/producers/${encodeURIComponent(id)}/offers`,
              { auth: false, signal },
          );
    if (!Array.isArray(data)) throw new Error("Resposta de ofertas inválida");
    // Nunca mistura ofertas de outros produtores, mesmo se a API devolver uma lista ampla.
    return data.filter((offer) => offer.producerId === id);
}
