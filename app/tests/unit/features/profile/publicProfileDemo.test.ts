import { describe, expect, it } from "vitest";
import { mockApiProducts } from "@/features/offers/mockProducts";
import {
    demoPublicOffers,
    demoPublicProfiles,
} from "@/features/profile/publicProfileDemo";
import { whatsAppContactUrl } from "@/features/contact";

// HU39 no modo local (VITE_USE_MOCK_AUTH=true): o detalhe da oferta busca o
// perfil público pelo id do produtor. Se os ids divergirem, o botão de
// contato some de todas as telas de demonstração.
describe("perfis públicos de demonstração (HU39)", () => {
    const profileIds = new Set(demoPublicProfiles.map((profile) => profile.id));

    it("todo produtor das ofertas de demonstração tem perfil público", () => {
        const producerIds = [
            ...mockApiProducts.map((product) => product.produtor.id),
            ...demoPublicOffers.map((offer) => offer.producerId),
            // Anfitrião das experiências de demonstração (listExperiences).
            "demo-jefferson",
        ];
        for (const id of producerIds) expect(profileIds).toContain(id);
    });

    it("cobre contato autorizado, não autorizado e ausente", () => {
        const contact = (id: string) =>
            whatsAppContactUrl(
                demoPublicProfiles.find((profile) => profile.id === id)
                    ?.telefone,
                "Mel do Cerrado",
            );
        expect(contact("demo-dona-maria")).toMatch(/^https:\/\/wa\.me\/55\d+/);
        expect(contact("demo-jefferson")).toMatch(/^https:\/\/wa\.me\/55\d+/);
        // Sem autorização a API não devolve o telefone (CA04).
        expect(contact("demo-sitio-raizes")).toBeUndefined();
        // Produtor sem telefone (CA06).
        expect(contact("demo-cida")).toBeUndefined();
    });
});
