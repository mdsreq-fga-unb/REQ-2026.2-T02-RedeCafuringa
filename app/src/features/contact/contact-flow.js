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

export const createWhatsAppUrl = (number, subject, context) => {
    let text = `Olá! Encontrei ${subject} na Rede Cafuringa e gostaria de tirar uma dúvida.`;
    if (context) {
        const question = {
            product:
                "Você pode me informar se o produto está disponível e como posso fazer o pedido ou combinar a retirada?",
            experience:
                "Você pode me informar quais datas estão disponíveis e como faço para reservar?",
            profile:
                "Gostaria de conhecer melhor a sua iniciativa e saber quais produtos ou experiências estão disponíveis.",
        }[context.kind];
        const page = new URL(window.location.href);
        page.search = "";
        page.hash = context.route;
        text = `Olá! Encontrei ${subject} na Rede Cafuringa.\n\n${question}\n\nLink: ${page.href}`;
    }
    return `https://wa.me/${normalizeWhatsAppNumber(number)}?text=${encodeURIComponent(text)}`;
};

/** Link de contato a partir do telefone público; undefined sem contato (CA04, CA06). */
export const whatsAppContactUrl = (phone, subject, context) => {
    const number = toWhatsAppNumber(phone);
    return number ? createWhatsAppUrl(number, subject, context) : undefined;
};
