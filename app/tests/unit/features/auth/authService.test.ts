import { afterEach, describe, expect, it, vi } from "vitest";
import { login } from "@/features/auth/authService";
import { InvalidCredentialsError } from "@/features/auth/errors";
import type { AuthResult } from "@/shared/types";

afterEach(() => {
    vi.unstubAllGlobals();
});

describe("authService.login", () => {
    it("envia CPF e senha para POST /auth/login e devolve token e usuário", async () => {
        const result: AuthResult = {
            token: "abc",
            user: { id: 2, name: "Dona Maria", role: "producer" },
        };
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => result,
        });
        vi.stubGlobal("fetch", fetchMock);

        const response = await login({
            cpf: "52998224725",
            password: "senha123",
        });

        expect(fetchMock).toHaveBeenCalledWith(
            "/auth/login",
            expect.objectContaining({
                method: "POST",
                body: JSON.stringify({
                    cpf: "52998224725",
                    password: "senha123",
                }),
            }),
        );
        expect(response).toEqual(result);
    });

    it("lança InvalidCredentialsError quando o servidor responde 401", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue({ ok: false, status: 401 }),
        );

        await expect(
            login({ cpf: "52998224725", password: "errada" }),
        ).rejects.toBeInstanceOf(InvalidCredentialsError);
    });

    it("lança um erro diferente de credenciais quando o servidor falha", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue({ ok: false, status: 500 }),
        );

        const error = await login({
            cpf: "52998224725",
            password: "senha123",
        }).catch((caught: unknown) => caught);

        expect(error).toBeInstanceOf(Error);
        expect(error).not.toBeInstanceOf(InvalidCredentialsError);
    });
});
