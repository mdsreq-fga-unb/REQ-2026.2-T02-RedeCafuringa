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
        imagemUrl:
            "https://images.unsplash.com/photo-1659822887922-c1386185cc6b?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D",
        disponivel: true,
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
    },
];
