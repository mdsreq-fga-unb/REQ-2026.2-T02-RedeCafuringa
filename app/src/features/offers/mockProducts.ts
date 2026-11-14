import type { ApiProduct } from "./productTypes";

export const mockApiProducts: ApiProduct[] = [
    {
        id: "mel",
        nome: "Mel do Cerrado",
        categoria: "Produtos",
        descricao:
            "Mel produzido no território da Cafuringa. Consulte disponibilidade e formas de retirada diretamente com o produtor.",
        precoPorUnidade: 32,
        gramasPorUnidade: 500,
        fotos: [
            "https://images.unsplash.com/photo-1587049352851-8d4e89133924?auto=format&fit=crop&w=1200&q=85",
        ],
        produtor: {
            id: "demo-dona-maria",
            nomeIniciativa: "Dona Maria",
            localidade: "Cafuringa",
        },
        criadoEm: "2026-11-01T12:00:00.000Z",
        disponivel: true,
    },
    {
        id: "cesta",
        nome: "Cesta da estação",
        categoria: "Produtos",
        descricao:
            "Seleção de frutas, legumes e verduras da estação, colhidos pelo Sítio Raízes.",
        precoPorUnidade: 40,
        gramasPorUnidade: 3000,
        fotos: [
            "https://images.unsplash.com/photo-1659822887922-c1386185cc6b?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D",
        ],
        produtor: {
            id: "demo-sitio-raizes",
            nomeIniciativa: "Sítio Raízes",
            localidade: "Cafuringa",
        },
        criadoEm: "2026-11-02T12:00:00.000Z",
        disponivel: true,
    },
    {
        id: "geleia",
        nome: "Geleia de pimenta",
        categoria: "Produtos",
        descricao:
            "Geleia artesanal de pimenta, ótima para acompanhar queijos e pães.",
        precoPorUnidade: 18,
        gramasPorUnidade: 250,
        fotos: [
            "https://images.unsplash.com/photo-1772900764482-ea6c74fb3bfa?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D",
        ],
        produtor: {
            id: "demo-sitio-raizes",
            nomeIniciativa: "Sítio Raízes",
            localidade: "Cafuringa",
        },
        criadoEm: "2026-11-03T12:00:00.000Z",
        disponivel: false,
    },
];