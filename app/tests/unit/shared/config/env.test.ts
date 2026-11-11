import { describe, expect, it } from "vitest";
import { EnvError, parseEnv } from "@/shared/config/env";

describe("parseEnv", () => {
    it("aceita ambiente vazio (URL da API é opcional)", () => {
        const { env, warnings } = parseEnv({});
        expect(env).toEqual({ apiUrl: "", useMockAuth: false });
        expect(warnings).toEqual([]);
    });

    it("normaliza a URL da API removendo a barra final", () => {
        expect(
            parseEnv({ VITE_API_URL: "http://localhost:3000/api/v1/" }).env
                .apiUrl,
        ).toBe("http://localhost:3000/api/v1");
        expect(
            parseEnv({ VITE_API_URL: " https://api.exemplo.com// " }).env
                .apiUrl,
        ).toBe("https://api.exemplo.com");
    });

    it("rejeita URL que não é http(s) válida", () => {
        for (const value of [
            "localhost:3000",
            "ftp://exemplo.com",
            "não é url",
            "javascript:alert(1)",
        ]) {
            expect(() => parseEnv({ VITE_API_URL: value }), value).toThrow(
                EnvError,
            );
        }
    });

    it("interpreta VITE_USE_MOCK_AUTH", () => {
        expect(parseEnv({ VITE_USE_MOCK_AUTH: "true" }).env.useMockAuth).toBe(
            true,
        );
        expect(parseEnv({ VITE_USE_MOCK_AUTH: "false" }).env.useMockAuth).toBe(
            false,
        );
        expect(parseEnv({ VITE_USE_MOCK_AUTH: "" }).env.useMockAuth).toBe(
            false,
        );
    });

    it("rejeita VITE_USE_MOCK_AUTH que não é true/false", () => {
        expect(() => parseEnv({ VITE_USE_MOCK_AUTH: "1" })).toThrow(EnvError);
        expect(() => parseEnv({ VITE_USE_MOCK_AUTH: "TRUE" })).toThrow(
            EnvError,
        );
    });

    it("avisa, sem falhar, quando o login falso está ligado em produção", () => {
        const { env, warnings } = parseEnv({
            VITE_USE_MOCK_AUTH: "true",
            PROD: true,
        });
        expect(env.useMockAuth).toBe(true);
        expect(warnings).toHaveLength(1);
        expect(
            parseEnv({ VITE_USE_MOCK_AUTH: "true", PROD: false }).warnings,
        ).toEqual([]);
    });

    it("reúne todos os problemas em um único erro", () => {
        try {
            parseEnv({ VITE_API_URL: "x", VITE_USE_MOCK_AUTH: "sim" });
            expect.unreachable("deveria lançar EnvError");
        } catch (error) {
            expect(error).toBeInstanceOf(EnvError);
            expect((error as EnvError).problems).toHaveLength(2);
        }
    });
});
