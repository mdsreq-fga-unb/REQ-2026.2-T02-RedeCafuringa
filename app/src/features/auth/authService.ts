import { ApiHttpError, getApiClient } from "../../shared/api";
import type { components } from "../../shared/api/schema";
import type { AuthResult, Role } from "../../shared/types";
import { InvalidCredentialsError } from "./errors";
import { loginMock } from "./mockAuth";

// Tipos vêm do contrato OpenAPI do backend (shared/openapi.json, via npm run api:types):
// se o backend mudar a rota ou os campos, o typecheck quebra aqui.
type LoginRequest = components["schemas"]["LoginDto"];
type LoginResponse = components["schemas"]["LoginResponse"];

export const isMockAuthEnabled = import.meta.env.VITE_USE_MOCK_AUTH === "true";

export type Credentials = {
    cpf: string;
    password: string;
};

// O app só tem telas para consumidor e produtor. O perfil ADMINISTRADOR existe no
// backend, mas ainda não tem área no app.
const roleByPerfil: Partial<Record<LoginResponse["usuario"]["perfil"], Role>> =
    {
        CONSUMIDOR: "consumer",
        PRODUTOR: "producer",
    };

/** Converte a resposta do backend (contrato OpenAPI) no formato usado pelo app. */
export function toAuthResult(response: LoginResponse): AuthResult {
    const role = roleByPerfil[response.usuario.perfil];
    if (!role) {
        throw new Error("Este perfil de acesso ainda não é suportado no app.");
    }
    return {
        token: response.accessToken,
        user: {
            id: response.usuario.id,
            name: response.usuario.nome,
            role,
        },
    };
}

// POST /auth/login  { cpf, senha }  ->  200 { accessToken, tokenType, expiresIn, usuario }
//   401 credenciais inválidas | 403 conta desativada | 429 muitas tentativas
export async function login(credentials: Credentials): Promise<AuthResult> {
    if (isMockAuthEnabled) return loginMock(credentials);

    const body: LoginRequest = {
        cpf: credentials.cpf,
        senha: credentials.password,
    };

    let response: LoginResponse;
    try {
        response = await getApiClient().post<LoginResponse>(
            "/auth/login",
            body,
            { auth: false },
        );
    } catch (error) {
        if (error instanceof ApiHttpError && error.status === 401) {
            throw new InvalidCredentialsError();
        }
        throw new Error("Falha ao autenticar", { cause: error });
    }

    return toAuthResult(response);
}
