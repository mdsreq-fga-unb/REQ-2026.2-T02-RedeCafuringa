export type ApiProduct = {
    id: string;
    nome: string;
    produtor: string;
    preco: number;
    unidade: string;
    imagemUrl: string;
    disponivel: boolean;
};

export type Product = {
    id: string;
    name: string;
    producerName: string;
    price: number;
    unit: string;
    image: string;
};

export type ApiProductDetails = ApiProduct & {
    descricao?: string;
    medida?: string;
    whatsapp?: string;
};

export type ProductDetails = Product & {
    available: boolean;
    description?: string;
    measure?: string;
    whatsapp?: string;
};