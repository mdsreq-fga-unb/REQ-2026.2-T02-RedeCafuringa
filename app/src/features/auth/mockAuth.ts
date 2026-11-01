// Usuários falsos para desenvolvimento enquanto não existe backend.
// Só são usados com VITE_USE_MOCK_AUTH=true (ver .env.development).
import type { AuthResult } from "../../shared/types";
import { producerName } from "../offers/offerData";
import { InvalidCredentialsError } from "./errors";
import type { ConsumerSignupData } from "./registrationService";

type MockUser = {
    cpf: string;
    password: string;
    email?: string;
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

const registeredUsersKey = "cafuringa-mock-users";

function readRegisteredUsers(): MockUser[] {
    try {
        const saved = JSON.parse(
            localStorage.getItem(registeredUsersKey) || "[]",
        ) as unknown;
        if (!Array.isArray(saved)) return [];
        return saved.filter(
            (item): item is MockUser =>
                typeof item?.cpf === "string" &&
                typeof item?.password === "string" &&
                typeof item?.email === "string" &&
                typeof item?.user?.id === "string" &&
                typeof item?.user?.name === "string" &&
                item?.user?.role === "consumer",
        );
    } catch {
        return [];
    }
}

export async function registerMockConsumer(
    data: ConsumerSignupData,
): Promise<void> {
    const cpf = data.cpf.replace(/\D/g, "");
    const email = data.email.trim().toLowerCase();
    const registeredUsers = readRegisteredUsers();

    if (
        registeredUsers.some((item) => item.cpf === cpf) ||
        mockUsers.some((item) => item.cpf === cpf)
    ) {
        throw new Error("CPF já cadastrado");
    }
    if (registeredUsers.some((item) => item.email === email)) {
        throw new Error("E-mail já cadastrado");
    }

    registeredUsers.push({
        cpf,
        email,
        password: data.senha,
        user: {
            id: `consumer-${Date.now()}-${registeredUsers.length + 1}`,
            name: data.nome.trim(),
            role: "consumer",
        },
    });
    localStorage.setItem(registeredUsersKey, JSON.stringify(registeredUsers));
}

export const demoHint =
    "Demonstração: CPF 529.982.247-25 (consumidor) ou 111.444.777-35 (produtor), senha senha123.";

export async function loginMock(credentials: {
    cpf: string;
    password: string;
}): Promise<AuthResult> {
    await new Promise((resolve) => setTimeout(resolve, 400));

    const found = [...mockUsers, ...readRegisteredUsers()].find(
        (item) =>
            item.cpf === credentials.cpf &&
            item.password === credentials.password,
    );
    if (!found) throw new InvalidCredentialsError();

    return { token: `mock-token-${found.user.id}`, user: found.user };
}
