import type { PublicTrajectory } from "@/features/trajectory/trajectoryService";
import type { ProducerOffer } from "./publicProfileService";
import { offers } from "@/features/offers/offerData";

// Conteúdo fictício exclusivo de VITE_USE_MOCK_AUTH=true.
export const demoPublicProfiles: PublicTrajectory[] = [
    {
        id: "demo-maria",
        nomeIniciativa: "Dona Maria",
        categoriaOfertada: "Produtos e Experiências",
        trajetoria:
            "Somos uma iniciativa familiar que conecta os saberes do campo à vida da cidade. Aqui, cada colheita conta uma história.",
        atividades:
            "Hortaliças da estação, cestas agroecológicas e visitas guiadas.",
        fotoUrl:
            "https://images.unsplash.com/photo-1622182476528-da0467612510?auto=format&fit=crop&w=800&q=75",
    },
    {
        id: "demo-cida",
        nomeIniciativa: "Dona Cida",
        categoriaOfertada: "Produtos",
        trajetoria:
            "Somos uma iniciativa familiar que conecta os saberes do campo à vida da cidade.",
        atividades: "Alimentos artesanais e produção agroecológica.",
    },
    {
        id: "demo-francisco",
        nomeIniciativa: "Francisco",
        categoriaOfertada: "Experiências",
        trajetoria: "Guia de passeios pela comunidade.",
        atividades: "Caminhadas e visitas guiadas.",
    },
];

export const demoPublicOffers: ProducerOffer[] = offers
    .filter((offer) => offer.id === "mel")
    .map((offer) => ({
        ...offer,
        producerId: "demo-maria",
    }));
