export const normalizeWhatsAppNumber = (number) => number.replace(/\D/g, "");

export const isWhatsAppContactAvailable = (authorized, number) => {
    const digits = normalizeWhatsAppNumber(number);
    return authorized && digits.length >= 10 && digits.length <= 15;
};

/**
 * HU39/CA02: número no formato do wa.me (E.164 só com dígitos). O telefone
 * público vem da API com DDD e número (10 ou 11 dígitos, RN07); sem DDI,
 * assume o Brasil (55). Devolve undefined quando não há número válido (CA06).
 */
export const toWhatsAppNumber = (phone) => {
    const digits = normalizeWhatsAppNumber(phone ?? "");
    if (digits.length === 10 || digits.length === 11) return `55${digits}`;
    if (digits.length >= 12 && digits.length <= 15) return digits;
    return undefined;
};

export const createWhatsAppUrl = (number, subject) => {
    const text = `Olá! Encontrei ${subject} na Rede Cafuringa e gostaria de tirar uma dúvida.`;
    return `https://wa.me/${normalizeWhatsAppNumber(number)}?text=${encodeURIComponent(text)}`;
};

/** Link de contato a partir do telefone público; undefined sem contato (CA04, CA06). */
export const whatsAppContactUrl = (phone, subject) => {
    const number = toWhatsAppNumber(phone);
    return number ? createWhatsAppUrl(number, subject) : undefined;
};

/** RN17: só usuário autenticado inicia o contato; o visitante entra e volta à origem. */
export const getContactLoginRoute = (subject) =>
    `/entrar?contato=${encodeURIComponent(subject)}`;
