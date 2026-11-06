// Usuários falsos para desenvolvimento enquanto não existe backend.
// Só são usados com VITE_USE_MOCK_AUTH=true (ver .env.development).
import type { AuthResult, Role } from "../../shared/types";
import { producerName } from "../offers/offerData";
import { InvalidCredentialsError } from "./errors";
import type { ConsumerSignupData } from "./registrationService";

type MockUser = {
    // Administrador não tem CPF (HU03).
    cpf?: string;
    password: string;
    email: string;
    user: AuthResult["user"];
};

const mockUsers: MockUser[] = [
    {
        cpf: "52998224725",
        email: "ana@exemplo.com",
        password: "senha123",
        user: {
            id: 1,
            name: "Gabriela Pereira da Silva",
            role: "consumer",
        },
    },
    {
        cpf: "11144477735",
        email: "produtor@exemplo.com",
        password: "senha123",
        user: { id: 2, name: producerName, role: "producer" },
    },
    {
        email: "admin@exemplo.com",
        password: "senha123",
        user: { id: 3, name: "Administrador", role: "admin" },
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

// Só existe com o login falso ligado (dados fictícios de demonstração): por isso a
// senha do administrador criado na demonstração fica no localStorage para ele poder entrar.
const mockAdminsKey = "cafuringa-mock-admin-emails";

type MockAdmin = { email: string; password: string };

function readMockAdmins(): MockAdmin[] {
    try {
        const saved = JSON.parse(
            localStorage.getItem(mockAdminsKey) || "[]",
        ) as unknown;
        if (!Array.isArray(saved)) return [];
        return saved.filter(
            (item): item is MockAdmin =>
                typeof item?.email === "string" &&
                typeof item?.password === "string",
        );
    } catch {
        return [];
    }
}

export async function registerMockAdmin(data: {
    email: string;
    senha: string;
}): Promise<void> {
    const email = data.email.trim().toLowerCase();
    const admins = readMockAdmins();
    if (
        admins.some((item) => item.email === email) ||
        mockUsers.some((item) => item.email === email) ||
        readRegisteredUsers().some((item) => item.email === email)
    ) {
        throw new Error("E-mail já cadastrado");
    }
    admins.push({ email, password: data.senha });
    localStorage.setItem(mockAdminsKey, JSON.stringify(admins));
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
    "Demonstração: ana@exemplo.com (consumidor) ou produtor@exemplo.com (produtor), senha senha123.";

export async function loginMock(credentials: {
    email: string;
    password: string;
}): Promise<AuthResult> {
    await new Promise((resolve) => setTimeout(resolve, 400));

    const adminUsers: MockUser[] = readMockAdmins().map((item, index) => ({
        email: item.email,
        password: item.password,
        user: {
            id: `admin-${index + 1}`,
            name: "Administrador",
            role: "admin" as const,
        },
    }));
    const found = [...mockUsers, ...readRegisteredUsers(), ...adminUsers].find(
        (item) =>
            item.email === credentials.email.trim().toLowerCase() &&
            item.password === credentials.password,
    );
    if (!found) throw new InvalidCredentialsError();

    return {
        token: `mock-token-${found.user.id}`,
        user: { ...found.user, cpf: found.cpf, email: found.email },
    };
}

export function registerMockUser(account: {
    cpf: string;
    email: string;
    password: string;
    name: string;
    role: Role;
}): AuthResult["user"] {
    const numericIds = mockUsers
        .map((item) => Number(item.user.id))
        .filter(Number.isFinite);
    const nextId = Math.max(0, ...numericIds) + 1;
    const user: AuthResult["user"] = {
        id: nextId,
        name: account.name,
        role: account.role,
    };
    mockUsers.push({
        cpf: account.cpf,
        email: account.email.trim().toLowerCase(),
        password: account.password,
        user,
    });
    return user;
}

export function isMockCpfRegistered(cpf: string): boolean {
    return mockUsers.some((item) => item.cpf === cpf);
}

function normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
}

/** Usado pela recuperação de acesso (HU10) para só gerar link quando a conta existe. */
export function isMockEmailRegistered(email: string): boolean {
    const target = normalizeEmail(email);
    return (
        mockUsers.some((item) => item.email === target) ||
        readRegisteredUsers().some((item) => item.email === target) ||
        readMockAdmins().some((item) => item.email === target)
    );
}

/**
 * Troca a senha onde o usuário estiver guardado: usuários fixos e produtores
 * (memória, valem até recarregar a página), consumidores e administradores
 * cadastrados (localStorage). Devolve false quando o e-mail não tem conta.
 */
export function updateMockPassword(
    email: string,
    newPassword: string,
): boolean {
    const target = normalizeEmail(email);
    let updated = false;

    for (const item of mockUsers) {
        if (item.email === target) {
            item.password = newPassword;
            updated = true;
        }
    }

    const registered = readRegisteredUsers();
    if (registered.some((item) => item.email === target)) {
        localStorage.setItem(
            registeredUsersKey,
            JSON.stringify(
                registered.map((item) =>
                    item.email === target
                        ? { ...item, password: newPassword }
                        : item,
                ),
            ),
        );
        updated = true;
    }

    const admins = readMockAdmins();
    if (admins.some((item) => item.email === target)) {
        localStorage.setItem(
            mockAdminsKey,
            JSON.stringify(
                admins.map((item) =>
                    item.email === target
                        ? { ...item, password: newPassword }
                        : item,
                ),
            ),
        );
        updated = true;
    }

    return updated;
}
