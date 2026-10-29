// Usuários falsos para desenvolvimento enquanto não existe backend.
// Só são usados com VITE_USE_MOCK_AUTH=true (ver .env.development).
import type { AuthResult } from "../../shared/types";
import { producerName } from "../offers/offerData";
import { InvalidCredentialsError } from "./errors";

type MockUser = {
    cpf: string;
    password: string;
    user: AuthResult["user"];
};

const mockUsers: MockUser[] = [
    {
        cpf: "52998224725",
        password: "senha123",
        user: { id: 1, name: "Gabriela Pereira da Silva", role: "consumer" },
    },
    {
        cpf: "11144477735",
        password: "senha123",
        user: { id: 2, name: producerName, role: "producer" },
    },
];

export const demoHint =
    "Demonstração: CPF 529.982.247-25 (consumidor) ou 111.444.777-35 (produtor), senha senha123.";

export async function loginMock(credentials: {
    cpf: string;
    password: string;
}): Promise<AuthResult> {
    await new Promise((resolve) => setTimeout(resolve, 400));

    const found = mockUsers.find(
        (item) =>
            item.cpf === credentials.cpf &&
            item.password === credentials.password,
    );
    if (!found) throw new InvalidCredentialsError();

    return { token: `mock-token-${found.user.id}`, user: found.user };
}
