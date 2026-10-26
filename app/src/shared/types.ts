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
