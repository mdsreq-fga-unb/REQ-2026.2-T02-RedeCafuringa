import type { AuthResult } from "../../shared/types";
import { InvalidCredentialsError } from "./errors";
import { loginMock } from "./mockAuth";

const API_URL = import.meta.env.VITE_API_URL ?? "";

export const isMockAuthEnabled = import.meta.env.VITE_USE_MOCK_AUTH === "true";

export type Credentials = {
    cpf: string;
    password: string;
};

// Contrato assumido com o backend (combinar com a equipe):
//   POST /auth/login   { cpf: "52998224725", password: "..." }
//   200 -> { token, user: { id, name, role } }   role: "consumer" | "producer"
//   401 -> credenciais inválidas
export async function login(credentials: Credentials): Promise<AuthResult> {
    if (isMockAuthEnabled) return loginMock(credentials);

    const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
    });

    if (response.status === 401) throw new InvalidCredentialsError();
    if (!response.ok) throw new Error("Falha ao autenticar");

    return (await response.json()) as AuthResult;
}
