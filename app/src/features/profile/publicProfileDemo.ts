import type { PublicTrajectory } from "@/features/trajectory/trajectoryService";
import type { ProducerOffer } from "./publicProfileService";
import { offers } from "@/features/offers/offerData";

// Conteúdo fictício exclusivo de VITE_USE_MOCK_AUTH=true.
//
// Os ids são os mesmos dos produtores das ofertas de demonstração
// (`mockProducts.ts` e `listExperiences`), para o detalhe da oferta achar o
// perfil público. Como na API, `telefone` só aparece quando o produtor
// autorizou a divulgação (RN07). Assim o modo local mostra os três casos da
// HU39: contato autorizado (Dona Maria e Jefferson Sooma), telefone não
// autorizado (Sítio Raízes, CA04) e produtor sem telefone (Dona Cida e
// Francisco, CA06). Os números são fictícios.
export const demoPublicProfiles: PublicTrajectory[] = [
    {
        id: "demo-dona-maria",
        nomeIniciativa: "Dona Maria",
        categoriaOfertada: "Produtos e Experiências",
        trajetoria:
            "Somos uma iniciativa familiar que conecta os saberes do campo à vida da cidade. Aqui, cada colheita conta uma história.",
        atividades:
            "Hortaliças da estação, cestas agroecológicas e visitas guiadas.",
        telefone: "(61) 99999-0001",
        fotoUrl:
            "https://images.unsplash.com/photo-1622182476528-da0467612510?auto=format&fit=crop&w=800&q=75",
    },
    {
        id: "demo-sitio-raizes",
        nomeIniciativa: "Sítio Raízes",
        categoriaOfertada: "Produtos",
        trajetoria:
            "Produção agroecológica familiar no Núcleo Rural Cafuringa.",
        atividades: "Cestas da estação e conservas artesanais.",
    },
    {
        id: "demo-jefferson",
        nomeIniciativa: "Jefferson Sooma",
        categoriaOfertada: "Experiências",
        trajetoria: "Recebo visitantes para vivências no campo e degustações.",
        atividades: "Visitas guiadas e degustação de queijos.",
        telefone: "(61) 99999-0002",
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
        producerId: "demo-dona-maria",
    }));
