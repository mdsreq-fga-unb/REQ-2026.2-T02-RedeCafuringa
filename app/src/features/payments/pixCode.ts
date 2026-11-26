/**
 * Código Pix "copia e cola" (BR Code do Banco Central), o mesmo texto que vira
 * o QR Code. Pix estático: o dinheiro vai direto para a chave da produtora, e
 * a plataforma não recebe nem guarda nada (proposta do pagamento por Pix).
 *
 * Formato: campos `ID + tamanho (2 dígitos) + valor`, terminados pelo
 * verificador CRC16 do próprio conteúdo.
 */
import { isValidCpf, onlyDigits } from "@/features/auth/cpf";
import {
    isValidCnpj,
    isValidEmail,
    isValidPhone,
} from "@/features/register/validators";

export type PixKeyType = "cpf" | "cnpj" | "telefone" | "email" | "aleatoria";

export class PixCodeError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "PixCodeError";
    }
}

const GUI = "br.gov.bcb.pix";
const NOME_MAX = 25;
const CIDADE_MAX = 15;
const TXID_MAX = 25;
/** Limite do campo da chave dentro da conta Pix (ID 26). */
const CHAVE_MAX = 77;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** CRC16-CCITT (polinômio 0x1021, início 0xFFFF), como o BR Code exige. */
export function crc16(data: string): string {
    let crc = 0xffff;
    for (const byte of new TextEncoder().encode(data)) {
        crc ^= byte << 8;
        for (let bit = 0; bit < 8; bit++)
            crc =
                crc & 0x8000
                    ? ((crc << 1) ^ 0x1021) & 0xffff
                    : (crc << 1) & 0xffff;
    }
    return crc.toString(16).toUpperCase().padStart(4, "0");
}

function field(id: string, value: string): string {
    if (value.length > 99)
        throw new PixCodeError("Um dos dados do Pix é longo demais.");
    return `${id}${String(value.length).padStart(2, "0")}${value}`;
}

/** Sem acento, em maiúsculas e só com letras, números e espaços. */
function plainText(value: string, max: number): string {
    return value
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toUpperCase()
        .replace(/[^A-Z0-9 ]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, max)
        .trimEnd();
}

function phoneKey(value: string): string | null {
    const digits = onlyDigits(value);
    const international = value.trim().startsWith("+");
    let national: string;
    if (international || digits.length > 11) {
        if (!digits.startsWith("55")) return null;
        national = digits.slice(2);
    } else national = digits;
    return isValidPhone(national) ? `+55${national}` : null;
}

/** Chave Pix no formato guardado pela API, ou null se não for válida. */
export function normalizePixKey(
    tipo: PixKeyType,
    valor: string,
): string | null {
    const text = valor.trim();
    switch (tipo) {
        case "cpf": {
            const digits = onlyDigits(text);
            return digits.length === 11 && isValidCpf(digits) ? digits : null;
        }
        case "cnpj": {
            const digits = onlyDigits(text);
            return digits.length === 14 && isValidCnpj(digits) ? digits : null;
        }
        case "telefone":
            return phoneKey(text);
        case "email": {
            const email = text.toLowerCase();
            return isValidEmail(email) && email.length <= CHAVE_MAX
                ? email
                : null;
        }
        case "aleatoria": {
            const key = text.toLowerCase();
            return UUID.test(key) ? key : null;
        }
    }
}

/** A chave já está no formato da API? Nesse formato, os tipos não se confundem. */
export function isNormalizedPixKey(chave: string): boolean {
    if (/^\+55\d{10,11}$/.test(chave)) return isValidPhone(chave.slice(3));
    if (/^\d{11}$/.test(chave)) return isValidCpf(chave);
    if (/^\d{14}$/.test(chave)) return isValidCnpj(chave);
    if (UUID.test(chave)) return true;
    return (
        chave === chave.toLowerCase() &&
        chave.length <= CHAVE_MAX &&
        isValidEmail(chave)
    );
}

export type PixCodeInput = {
    /** Chave já normalizada, como a API devolve. */
    chave: string;
    /** Nome do recebedor, como aparece no banco. */
    nome: string;
    cidade: string;
    /** Valor em centavos; sem ele, a pessoa digita o valor no banco. */
    valorCentavos?: number;
    /** Identificador da cobrança, por exemplo o da pré-reserva. */
    txid?: string;
};

export function buildPixCode({
    chave,
    nome,
    cidade,
    valorCentavos,
    txid,
}: PixCodeInput): string {
    if (!isNormalizedPixKey(chave))
        throw new PixCodeError("A chave Pix da produtora não é válida.");
    const recebedor = plainText(nome, NOME_MAX);
    const local = plainText(cidade, CIDADE_MAX);
    if (!recebedor)
        throw new PixCodeError("Falta o nome de quem recebe o Pix.");
    if (!local) throw new PixCodeError("Falta a cidade de quem recebe o Pix.");
    if (
        valorCentavos !== undefined &&
        (!Number.isSafeInteger(valorCentavos) || valorCentavos <= 0)
    )
        throw new PixCodeError("O valor do Pix precisa ser maior que zero.");
    const identificador =
        (txid ?? "").replace(/[^A-Za-z0-9]/g, "").slice(0, TXID_MAX) || "***";

    const payload =
        field("00", "01") +
        field("26", field("00", GUI) + field("01", chave)) +
        field("52", "0000") +
        field("53", "986") +
        (valorCentavos === undefined
            ? ""
            : field("54", (valorCentavos / 100).toFixed(2))) +
        field("58", "BR") +
        field("59", recebedor) +
        field("60", local) +
        field("62", field("05", identificador)) +
        "6304";
    return payload + crc16(payload);
}
