import type { BookingFormValues } from "./bookingTypes";

const USER_ID_KEY = "cafuringa-user-id";
const KEY_PREFIX = "cafuringa-booking-draft";
const FIELDS = [
    "data",
    "horario",
    "participantes",
    "formaPagamento",
    "mensagem",
] as const;

/** Chave por usuário e experiência; null sem usuário logado (nada é guardado). */
export function bookingDraftStorageKey(experienceId: string): string | null {
    const userId = localStorage.getItem(USER_ID_KEY);
    return userId ? `${KEY_PREFIX}:${userId}:${experienceId}` : null;
}

/** Só aceita o formato esperado e descarta campos que não são do formulário. */
function toDraft(value: unknown): BookingFormValues | null {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
        return null;
    }
    const source = value as Record<string, unknown>;
    const draft = {} as BookingFormValues;
    for (const field of FIELDS) {
        const item = source[field];
        if (typeof item !== "string") return null;
        draft[field] = item;
    }
    return draft;
}

export function saveBookingDraft(
    experienceId: string,
    values: BookingFormValues,
): void {
    const key = bookingDraftStorageKey(experienceId);
    if (!key) return;
    try {
        localStorage.setItem(key, JSON.stringify(values));
    } catch {
        // Sem espaço ou bloqueado: o rascunho é só uma conveniência.
    }
}

export function loadBookingDraft(
    experienceId: string,
): BookingFormValues | null {
    const key = bookingDraftStorageKey(experienceId);
    if (!key) return null;
    try {
        const raw = localStorage.getItem(key);
        return raw === null ? null : toDraft(JSON.parse(raw));
    } catch {
        return null;
    }
}

export function clearBookingDraft(experienceId: string): void {
    const key = bookingDraftStorageKey(experienceId);
    if (!key) return;
    try {
        localStorage.removeItem(key);
    } catch {
        // Idem: não impede o fluxo.
    }
}
