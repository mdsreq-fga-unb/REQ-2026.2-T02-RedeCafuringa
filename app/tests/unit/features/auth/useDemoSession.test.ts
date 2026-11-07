import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
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
