import type { ApiProductDetails } from "./productTypes";

export const mockApiProducts: ApiProductDetails[] = [
    {
        id: "mel",
        nome: "Mel do Cerrado",
        produtor: "Dona Maria",
        preco: 32,
        unidade: "unidade",
        imagemUrl:
            "https://images.unsplash.com/photo-1587049352851-8d4e89133924?auto=format&fit=crop&w=1200&q=85",
        disponivel: true,
        descricao:
            "Mel produzido no território da Cafuringa. Consulte disponibilidade e formas de retirada diretamente com o produtor.",
        medida: "500 g",
        whatsapp: "5561900000001",
    },
    {
        id: "cesta",
        nome: "Cesta da estação",
        produtor: "Sítio Raízes",
        preco: 40,
        unidade: "cesta",
        imagemUrl:
            "https://images.unsplash.com/photo-1659822887922-c1386185cc6b?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D",
        disponivel: true,
        descricao:
            "Seleção de frutas, legumes e verduras da estação, colhidos pelo Sítio Raízes.",
        medida: "3 kg",
        whatsapp: "5561900000002",
    },
    {
        id: "geleia",
        nome: "Geleia de pimenta",
        produtor: "Sítio Raízes",
        preco: 18,
        unidade: "pote",
        imagemUrl:
            "https://images.unsplash.com/photo-1772900764482-ea6c74fb3bfa?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D",
        disponivel: false,
        descricao:
            "Geleia artesanal de pimenta, ótima para acompanhar queijos e pães.",
        medida: "250 g",
        whatsapp: "5561900000003",
    },
];