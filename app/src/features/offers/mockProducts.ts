import type { ApiProduct } from "./productTypes";

export const mockApiProducts: ApiProduct[] = [
    {
        id: "mel",
        nome: "Mel do Cerrado",
        produtor: "Dona Maria",
        preco: 32,
        unidade: "unidade",
        imagemUrl:
            "https://images.unsplash.com/photo-1587049352851-8d4e89133924?auto=format&fit=crop&w=1200&q=85",
        disponivel: true,
    },
    {
        id: "cesta",
        nome: "Cesta da estação",
        produtor: "Sítio Raízes",
        preco: 40,
        unidade: "cesta",
        imagemUrl: "/images/cesta-da-estacao.jpg",
        disponivel: true,
    },
    {
        id: "geleia",
        nome: "Geleia de pimenta",
        produtor: "Sítio Raízes",
        preco: 18,
        unidade: "pote",
        imagemUrl: "/images/geleia-de-pimenta.jpg",
        disponivel: false,
    },
];