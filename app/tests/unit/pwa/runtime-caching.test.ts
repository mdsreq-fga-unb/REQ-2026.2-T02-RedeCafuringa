import { describe, expect, it } from "vitest";
import {
    apiCacheRule,
    skipAuthenticatedResponses,
} from "@/pwa/runtime-caching";

const API = "http://localhost:3000/api/v1";

function pattern(apiUrl: string): RegExp {
    const rule = apiCacheRule(apiUrl);
    expect(rule).toBeDefined();
    return rule!.urlPattern as RegExp;
}

describe("apiCacheRule", () => {
    it("não cria regra sem URL de API válida", () => {
        for (const value of [
            "",
            "   ",
            "não é url",
            "ftp://exemplo.com",
            "javascript:alert(1)",
        ]) {
            expect(apiCacheRule(value), value).toBeUndefined();
        }
    });

    it("cacheia só GET, com NetworkFirst, só status 200 e com limites", () => {
        const rule = apiCacheRule(API)!;

        expect(rule.method).toBe("GET");
        expect(rule.handler).toBe("NetworkFirst");
        expect(rule.options).toMatchObject({
            cacheName: "api-get-public",
            networkTimeoutSeconds: 5,
            expiration: { maxEntries: 50, maxAgeSeconds: 86_400 },
            cacheableResponse: { statuses: [200] },
        });
    });

    it("casa com os recursos da API e ignora o resto", () => {
        const re = pattern(API);

        expect(re.test(`${API}/ofertas`)).toBe(true);
        expect(re.test(`${API}/ofertas?page=2&q=caf%C3%A9`)).toBe(true);
        expect(re.test(`${API}/health/live`)).toBe(true);

        expect(re.test("http://localhost:3000/api/v10/ofertas")).toBe(false);
        expect(re.test("http://localhost:3000/ofertas")).toBe(false);
        expect(re.test("http://localhost:5173/api/v1/ofertas")).toBe(false);
        expect(re.test("https://localhost:3000/api/v1/ofertas")).toBe(false);
        expect(re.test("https://outro.com/api/v1/ofertas")).toBe(false);
    });

    it("nunca cacheia /auth/ (sessão e dados da pessoa)", () => {
        const re = pattern(API);

        for (const path of ["/auth/login", "/auth/me", "/auth/refresh"]) {
            expect(re.test(`${API}${path}`), path).toBe(false);
        }
        // Só o segmento exato: um recurso público que apenas começa com "auth" segue valendo.
        expect(re.test(`${API}/autores`)).toBe(true);
    });

    it("trata ponto e barra final da URL como literais, não como regex", () => {
        const re = pattern("https://api.exemplo.com/v1/");

        expect(re.test("https://api.exemplo.com/v1/ofertas")).toBe(true);
        expect(re.test("https://apiXexemplo.com/v1/ofertas")).toBe(false);
        expect(re.test("https://api.exemplo.com/v1x/ofertas")).toBe(false);
    });

    it("aceita API na raiz do domínio", () => {
        const re = pattern("https://api.exemplo.com");

        expect(re.test("https://api.exemplo.com/ofertas")).toBe(true);
        expect(re.test("https://api.exemplo.com/auth/login")).toBe(false);
    });
});

describe("skipAuthenticatedResponses", () => {
    const { cacheWillUpdate } = skipAuthenticatedResponses;

    it("não grava resposta de requisição autenticada (dados pessoais)", async () => {
        const request = new Request(`${API}/me`, {
            headers: { Authorization: "Bearer tok" },
        });
        const response = new Response("{}");

        expect(await cacheWillUpdate({ request, response })).toBeNull();
    });

    it("grava resposta de requisição pública", async () => {
        const request = new Request(`${API}/ofertas`);
        const response = new Response("[]");

        expect(await cacheWillUpdate({ request, response })).toBe(response);
    });

    it("é autocontido: funciona depois de serializado, como dentro do sw.js", async () => {
        // O Workbox grava esta função como texto no service worker, onde não existem
        // os imports nem as variáveis deste módulo. Reconstruímos só a partir do texto.
        const rebuilt = new Function(
            `return (${cacheWillUpdate.toString()})`,
        )() as typeof cacheWillUpdate;

        const withAuth = new Request(`${API}/me`, {
            headers: { authorization: "Bearer tok" },
        });
        const response = new Response("{}");
        const anonymous = new Request(`${API}/ofertas`);

        expect(await rebuilt({ request: withAuth, response })).toBeNull();
        expect(await rebuilt({ request: anonymous, response })).toBe(response);
    });
});
