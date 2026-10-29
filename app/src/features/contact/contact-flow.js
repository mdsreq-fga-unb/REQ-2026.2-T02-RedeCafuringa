export const normalizeWhatsAppNumber = (number) => number.replace(/\D/g, "");

export const isWhatsAppContactAvailable = (authorized, number) => {
    const digits = normalizeWhatsAppNumber(number);
    return authorized && digits.length >= 10 && digits.length <= 15;
};

export const canStartWhatsAppContact = (role, authorized, number) =>
    role === "consumer" && isWhatsAppContactAvailable(authorized, number);

export const createWhatsAppUrl = (number, subject) => {
    const text = `Olá! Encontrei ${subject} na Rede Cafuringa e gostaria de tirar uma dúvida.`;
    return `https://wa.me/${normalizeWhatsAppNumber(number)}?text=${encodeURIComponent(text)}`;
};

export const getContactLoginRoute = (subjectId) =>
    `/entrar?contato=${encodeURIComponent(subjectId)}`;
