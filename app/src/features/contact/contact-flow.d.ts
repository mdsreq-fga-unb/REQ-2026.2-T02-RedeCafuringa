export function normalizeWhatsAppNumber(number: string): string;

export function isWhatsAppContactAvailable(
    authorized: boolean,
    number: string,
): boolean;

export function toWhatsAppNumber(
    phone: string | null | undefined,
): string | undefined;

export type ContactContext = {
    kind: "product" | "experience" | "profile";
    route: string;
};

export function createWhatsAppUrl(
    number: string,
    subject: string,
    context?: ContactContext,
): string;

export function whatsAppContactUrl(
    phone: string | null | undefined,
    subject: string,
    context?: ContactContext,
): string | undefined;
