import type { Offer } from "../../shared/types";

export const producerName = "Dona Maria";

export const offers: Offer[] = [
    {
        id: "queijos",
        title: "Visita e Degustação de Queijos",
        category: "Experiências",
        image: "https://images.unsplash.com/photo-1452195100486-9cc805987862?auto=format&fit=crop&w=1200&q=85",
        price: "R$ 45 / pessoa",
        details: [
            "Anfitrião: Jefferson Sooma",
            "Duração: 2 horas",
            "Local: Cafuringa, DF",
        ],
        description:
            "Caminhe pelo sítio, conheça a produção familiar e prove sabores da estação. Use calçado fechado e leve água.",
    },
    {
        id: "mel",
        title: "Mel do Cerrado",
        category: "Produtos",
        image: "https://images.unsplash.com/photo-1587049352851-8d4e89133924?auto=format&fit=crop&w=1200&q=85",
        price: "R$ 32 / unidade",
        details: ["Produtor: Dona Maria", "500 g por unidade"],
        description:
            "Mel produzido no território da Cafuringa. Consulte disponibilidade e formas de retirada diretamente com o produtor.",
    },
];
