import { describe, expect, it } from "vitest";
import {
    IMAGE_HOSTS,
    apiOrigin,
    buildCsp,
    cspSnippet,
} from "../../../nginx/csp.ts";

function directive(csp: string, name: string): string[] {
    const found = csp
        .split("; ")
        .map((d) => d.split(" "))
        .find(([n]) => n === name);
    expect(found, `diretiva ${name}`).toBeDefined();
    return found!.slice(1);
}

describe("apiOrigin", () => {
    it("extrai só a origem, sem caminho nem barra", () => {
        expect(apiOrigin("http://localhost:3000/api/v1")).toBe(
            "http://localhost:3000",
        );
        expect(apiOrigin("https://api.exemplo.com/v1/")).toBe(
            "https://api.exemplo.com",
        );
        expect(apiOrigin(" https://api.exemplo.com:8443 ")).toBe(
            "https://api.exemplo.com:8443",
        );
    });

    it("ignora o que não é URL http(s) válida", () => {
        for (const value of [
            undefined,
            "",
            "   ",
            "não é url",
            "ftp://exemplo.com",
            "javascript:alert(1)",
            "localhost:3000",
        ]) {
            expect(apiOrigin(value), String(value)).toBeUndefined();
        }
    });
});

describe("buildCsp", () => {
    it("sem URL de API, connect-src fica só 'self'", () => {
        expect(directive(buildCsp(), "connect-src")).toEqual(["'self'"]);
        expect(directive(buildCsp({ apiUrl: "lixo" }), "connect-src")).toEqual([
            "'self'",
        ]);
    });

    it("com URL de API, libera exatamente a origem da API", () => {
        const csp = buildCsp({ apiUrl: "https://api.exemplo.com/api/v1" });
        expect(directive(csp, "connect-src")).toEqual([
            "'self'",
            "https://api.exemplo.com",
        ]);
    });

    it("é restritiva: nada de unsafe-inline, unsafe-eval ou curinga", () => {
        const csp = buildCsp({ apiUrl: "https://api.exemplo.com" });
        expect(csp).not.toContain("unsafe-inline");
        expect(csp).not.toContain("unsafe-eval");
        expect(csp).not.toMatch(/(^|\s)\*(\s|;|$)/);
        expect(directive(csp, "default-src")).toEqual(["'self'"]);
        expect(directive(csp, "script-src")).toEqual(["'self'"]);
        expect(directive(csp, "style-src")).toEqual(["'self'"]);
        expect(directive(csp, "font-src")).toEqual(["'self'"]);
        expect(directive(csp, "object-src")).toEqual(["'none'"]);
        expect(directive(csp, "frame-ancestors")).toEqual(["'none'"]);
        expect(directive(csp, "base-uri")).toEqual(["'self'"]);
        expect(directive(csp, "form-action")).toEqual(["'self'"]);
    });

    it("permite o service worker e o manifesto do PWA", () => {
        const csp = buildCsp();
        expect(directive(csp, "worker-src")).toEqual(["'self'"]);
        expect(directive(csp, "manifest-src")).toEqual(["'self'"]);
    });

    it("libera as imagens de exemplo e data:, e só elas, além de 'self'", () => {
        expect(directive(buildCsp(), "img-src")).toEqual([
            "'self'",
            "data:",
            ...IMAGE_HOSTS,
        ]);
        expect(directive(buildCsp({ imageHosts: [] }), "img-src")).toEqual([
            "'self'",
            "data:",
        ]);
    });

    it("não repete diretivas", () => {
        const names = buildCsp({ apiUrl: "https://a.com" })
            .split("; ")
            .map((d) => d.split(" ")[0]);
        expect(new Set(names).size).toBe(names.length);
    });
});

describe("cspSnippet", () => {
    it("gera uma diretiva add_header válida para o nginx", () => {
        const snippet = cspSnippet({ apiUrl: "https://api.exemplo.com" });
        const match = snippet.match(
            /^add_header Content-Security-Policy "([^"]+)" always;\n$/,
        );
        expect(match).not.toBeNull();
        // Aspas dentro da política quebrariam o arquivo do nginx.
        expect(match![1]).not.toContain('"');
        expect(match![1]).toBe(buildCsp({ apiUrl: "https://api.exemplo.com" }));
    });
});
