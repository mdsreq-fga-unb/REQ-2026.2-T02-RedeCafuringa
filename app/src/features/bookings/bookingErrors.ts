const SEND_FAILED =
    "Não foi possível enviar a pré-reserva. Seus dados foram mantidos, tente novamente.";

const MESSAGES_BY_STATUS: Record<number, string> = {
    400: "Confira os dados da pré-reserva e tente novamente.",
    401: "Sua sessão expirou. Entre novamente para solicitar a pré-reserva.",
    403: "Seu perfil não pode solicitar pré-reservas.",
    404: "Esta experiência não está mais disponível para pré-reserva.",
    429: "Muitas tentativas seguidas. Aguarde um instante e tente de novo.",
};

/** Traduz a falha do envio em uma mensagem para o usuário, sem expor detalhes técnicos. */
export function describeBookingError(error: unknown): string {
    const status =
        typeof error === "object" && error !== null && "status" in error
            ? (error as { status: unknown }).status
            : undefined;
    return (
        (typeof status === "number" ? MESSAGES_BY_STATUS[status] : undefined) ??
        SEND_FAILED
    );
}
