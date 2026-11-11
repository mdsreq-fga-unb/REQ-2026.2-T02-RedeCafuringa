import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useDemoSession } from "@/features/auth/useDemoSession";

const { get } = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock("@/shared/api", async (importOriginal) => ({
    ...(await importOriginal<typeof import("@/shared/api")>()),
    getApiClient: () => ({ get }),
}));
vi.mock("@/features/auth/authMode", () => ({ isMockAuthEnabled: false }));

afterEach(() => {
    cleanup();
    localStorage.clear();
    vi.clearAllMocks();
});

it("recupera email e CPF da API para uma sessão antiga sem esses dados", async () => {
    localStorage.setItem("cafuringa-role", "consumer");
    localStorage.setItem("cafuringa-token", "jwt-existing");
    get.mockResolvedValue({
        nome: "Maria",
        email: "maria@example.com",
        cpf: "***.982.247-**",
    });
    const { result } = renderHook(() => useDemoSession());
    await waitFor(() => expect(result.current.email).toBe("maria@example.com"));
    expect(get).toHaveBeenCalledWith("/auth/me", {
        headers: { Authorization: "Bearer jwt-existing" },
    });
    expect(result.current.cpf).toBe("***.982.247-**");
    expect(localStorage.getItem("cafuringa-cpf")).toBe("***.982.247-**");
});

it("ignora o perfil antigo quando o usuário sai antes da resposta", async () => {
    localStorage.setItem("cafuringa-role", "consumer");
    localStorage.setItem("cafuringa-token", "jwt-existing");
    let resolve!: (value: unknown) => void;
    get.mockReturnValue(
        new Promise((done) => {
            resolve = done;
        }),
    );
    const { result } = renderHook(() => useDemoSession());
    act(() => result.current.signOut());
    await act(async () =>
        resolve({
            nome: "Maria",
            email: "maria@example.com",
            cpf: "***.982.247-**",
        }),
    );
    expect(result.current.email).toBe("");
    expect(result.current.cpf).toBe("");
    expect(localStorage.getItem("cafuringa-email")).toBeNull();
});

// Expiração da sessão (JWT de 15 min, sem renovação): a interface não pode seguir
// "logada" com um token que a API já recusa. A leitura de `exp` aqui só decide a
// interface; quem recusa o token de verdade é o servidor.
function jwtExpiringAt(expSeconds: number): string {
    const encode = (value: object) =>
        btoa(JSON.stringify(value))
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=+$/, "");
    return `${encode({ alg: "HS256" })}.${encode({ sub: "u1", exp: expSeconds })}.assinatura`;
}

describe("expiração da sessão (HU09, RNF08)", () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it("não abre uma sessão cujo token já expirou", () => {
        localStorage.setItem("cafuringa-role", "producer");
        localStorage.setItem("cafuringa-name", "Dona Maria");
        localStorage.setItem(
            "cafuringa-token",
            jwtExpiringAt(Math.floor(Date.now() / 1000) - 60),
        );
        get.mockResolvedValue({ nome: "Maria", email: "m@example.com" });

        const { result } = renderHook(() => useDemoSession());

        expect(result.current.role).toBeNull();
        expect(localStorage.getItem("cafuringa-token")).toBeNull();
        expect(localStorage.getItem("cafuringa-role")).toBeNull();
    });

    it("encerra a sessão no instante em que o token expira", () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-11-08T12:00:00Z"));
        const exp = Math.floor(Date.now() / 1000) + 120;
        localStorage.setItem("cafuringa-role", "consumer");
        localStorage.setItem("cafuringa-token", jwtExpiringAt(exp));
        get.mockResolvedValue({ nome: "Maria", email: "m@example.com" });

        const { result } = renderHook(() => useDemoSession());
        expect(result.current.role).toBe("consumer");

        act(() => {
            vi.advanceTimersByTime(119_000);
        });
        expect(result.current.role).toBe("consumer");

        act(() => {
            vi.advanceTimersByTime(2_000);
        });
        expect(result.current.role).toBeNull();
        expect(localStorage.getItem("cafuringa-token")).toBeNull();
    });

    it("mantém a sessão quando o token não traz data de expiração legível", () => {
        localStorage.setItem("cafuringa-role", "consumer");
        localStorage.setItem("cafuringa-token", "jwt-existing");
        get.mockResolvedValue({ nome: "Maria", email: "m@example.com" });

        const { result } = renderHook(() => useDemoSession());

        expect(result.current.role).toBe("consumer");
    });

    it("troca o cronômetro quando um novo login entra", () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-11-08T12:00:00Z"));
        const now = Math.floor(Date.now() / 1000);
        const { result } = renderHook(() => useDemoSession());

        act(() =>
            result.current.signIn({
                token: jwtExpiringAt(now + 60),
                user: { id: 1, name: "Maria", role: "consumer" },
            }),
        );
        act(() => {
            vi.advanceTimersByTime(30_000);
        });
        expect(result.current.role).toBe("consumer");

        act(() => {
            vi.advanceTimersByTime(31_000);
        });
        expect(result.current.role).toBeNull();
    });
});
