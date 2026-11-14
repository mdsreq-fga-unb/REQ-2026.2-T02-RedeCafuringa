export type Role = "consumer" | "producer" | "admin";

export type Offer = {
    images?: string[];
    id: string;
    title: string;
    category: string;
    image: string;
    price: string;
    details: string[];
    description: string;
};

export type ContactSettings = {
    whatsappNumber: string;
    authorized: boolean;
};

export type AuthUser = {
    // O backend usa string; o login falso de desenvolvimento usa número.
    id: string | number;
    name: string;
    role: Role;
    email?: string;
    cpf?: string;
};

export type AuthResult = {
    token: string;
    user: AuthUser;
};
