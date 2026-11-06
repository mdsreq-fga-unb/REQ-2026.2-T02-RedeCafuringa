// Simulação da recuperação de acesso para desenvolvimento enquanto o backend não
// tem as rotas da HU10. Só é usada com VITE_USE_MOCK_AUTH=true.
import {
    isMockEmailRegistered,
    updateMockPassword,
} from "@/features/auth/mockAuth";

export const recoveryTokensKey = "cafuringa-mock-recovery-tokens";

/** Validade do link de redefinição na simulação: 1 hora. */
const tokenLifetimeMs = 60 * 60 * 1000;

type MockRecoveryToken = { token: string; email: string; expiresAt: number };

function normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
}

function readTokens(): MockRecoveryToken[] {
    try {
        const saved = JSON.parse(
            localStorage.getItem(recoveryTokensKey) || "[]",
        ) as unknown;
        if (!Array.isArray(saved)) return [];
        return saved.filter(
            (item): item is MockRecoveryToken =>
                typeof item?.token === "string" &&
                typeof item?.email === "string" &&
                typeof item?.expiresAt === "number",
        );
    } catch {
        return [];
    }
}

function writeTokens(tokens: MockRecoveryToken[]): void {
    localStorage.setItem(recoveryTokensKey, JSON.stringify(tokens));
}

// Só para a demonstração: o token real vem do backend e não pode ser previsível.
function createToken(): string {
    return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
}

/** Sempre conclui, exista a conta ou não (resposta neutra); só gera token se existir. */
export async function requestMockRecovery(email: string): Promise<void> {
    const target = normalizeEmail(email);
    if (!isMockEmailRegistered(target)) return;

    const now = Date.now();
    const tokens = readTokens().filter(
        (item) => item.email !== target && item.expiresAt >= now,
    );
    tokens.push({
        token: createToken(),
        email: target,
        expiresAt: now + tokenLifetimeMs,
    });
    writeTokens(tokens);
}

/** Link de demonstração (no lugar do e-mail real); null se não houver token válido. */
export function getMockRecoveryLink(email: string): string | null {
    const target = normalizeEmail(email);
    const now = Date.now();
    const found = readTokens().find(
        (item) => item.email === target && item.expiresAt >= now,
    );
    return found ? `#/redefinir-senha?token=${found.token}` : null;
}

/** true quando o token era válido e a senha foi trocada; o token é de uso único. */
export async function resetMockPassword(input: {
    token: string;
    password: string;
}): Promise<boolean> {
    const tokens = readTokens();
    const found = tokens.find((item) => item.token === input.token.trim());
    if (!found || found.expiresAt < Date.now()) return false;
    if (!updateMockPassword(found.email, input.password)) return false;

    writeTokens(tokens.filter((item) => item.email !== found.email));
    return true;
}