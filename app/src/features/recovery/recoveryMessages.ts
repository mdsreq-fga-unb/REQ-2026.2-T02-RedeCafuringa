export function rateLimitMessage(retryAfterSeconds?: number): string {
    return retryAfterSeconds
        ? `Muitas tentativas. Tente novamente em ${retryAfterSeconds} segundos.`
        : "Muitas tentativas. Aguarde alguns instantes e tente novamente.";
}
