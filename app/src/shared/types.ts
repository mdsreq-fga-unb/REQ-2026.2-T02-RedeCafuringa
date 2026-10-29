export type Role = "consumer" | "producer";

export type Offer = {
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
    id: number;
    name: string;
    role: Role;
};

export type AuthResult = {
    token: string;
    user: AuthUser;
};