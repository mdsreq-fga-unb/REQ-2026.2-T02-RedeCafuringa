/** E-mail ou senha não conferem (a API não diz qual dos dois, para não revelar contas). */
export class InvalidCredentialsError extends Error {
    constructor() {
        super("E-mail ou senha inválidos");
        this.name = "InvalidCredentialsError";
    }
}

/** A senha confere, mas a conta foi desativada: tentar de novo não resolve. */
export class AccountDisabledError extends Error {
    constructor() {
        super("Conta desativada");
        this.name = "AccountDisabledError";
    }
}

/** Limite de tentativas de autenticação por IP atingido (HTTP 429). */
export class TooManyAttemptsError extends Error {
    readonly retryAfterSeconds?: number;

    constructor(retryAfterSeconds?: number) {
        super("Muitas tentativas de login");
        this.name = "TooManyAttemptsError";
        this.retryAfterSeconds = retryAfterSeconds;
    }
}
