import { describe, expect, it } from "vitest";
import { postLoginRoute } from "@/app/postLoginRoute";

describe("destino depois do login", () => {
    it.each([
        ["consumer", "/explorar"],
        ["producer", "/explorar"],
        ["admin", "/admin/acesso"],
    ] as const)(
        "leva %s à página principal do perfil (%s), não à Conta",
        (role, route) => {
            expect(postLoginRoute(role, null)).toBe(route);
        },
    );

    it("admin sempre vai ao painel, mesmo vindo de um pedido de contato", () => {
        expect(postLoginRoute("admin", "produto/mel")).toBe("/admin/acesso");
    });

    it.each([
        ["produto/mel", "/oferta/mel"],
        ["experiencia/queijos", "/oferta/queijos?tipo=experiencia"],
        [
            "produtor/64b0c0ffee0000000000abcd",
            "/produtor/64b0c0ffee0000000000abcd",
        ],
        ["perfil", "/perfil"],
        ["queijos", "/oferta/queijos"],
    ])("volta de um pedido de contato (%s) para %s", (subject, route) => {
        expect(postLoginRoute("consumer", subject)).toBe(route);
        expect(postLoginRoute("producer", subject)).toBe(route);
    });

    it.each([
        [
            "produto/a/../../admin/usuarios",
            "/oferta/a%2F..%2F..%2Fadmin%2Fusuarios",
        ],
        ["produtor/x?y=1", "/produtor/x%3Fy%3D1"],
    ])("codifica o identificador vindo da URL (%s)", (subject, route) => {
        expect(postLoginRoute("consumer", subject)).toBe(route);
    });

    it.each(["", "produto/", "experiencia/", "produtor/"])(
        "pedido de contato vazio (%j) cai na página principal",
        (subject) => {
            expect(postLoginRoute("consumer", subject)).toBe("/explorar");
        },
    );
});
