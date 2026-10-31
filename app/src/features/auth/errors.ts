export class InvalidCredentialsError extends Error {
    constructor() {
        super("CPF ou senha inválidos");
        this.name = "InvalidCredentialsError";
    }
}
