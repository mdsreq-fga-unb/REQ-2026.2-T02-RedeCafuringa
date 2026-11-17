export function normalizeWhatsAppNumber(number: string): string;

export function isWhatsAppContactAvailable(
    authorized: boolean,
    number: string,
): boolean;

export function toWhatsAppNumber(
    phone: string | null | undefined,
): string | undefined;

export function createWhatsAppUrl(number: string, subject: string): string;

export function whatsAppContactUrl(
    phone: string | null | undefined,
    subject: string,
): string | undefined;

export function getContactLoginRoute(subject: string): string;
