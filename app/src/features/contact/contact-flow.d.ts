import type { Role } from "../../shared/types";

export function normalizeWhatsAppNumber(number: string): string;

export function isWhatsAppContactAvailable(
    authorized: boolean,
    number: string,
): boolean;

export function canStartWhatsAppContact(
    role: Role | null,
    authorized: boolean,
    number: string,
): boolean;

export function createWhatsAppUrl(number: string, subject: string): string;

export function getContactLoginRoute(subjectId: string): string;
