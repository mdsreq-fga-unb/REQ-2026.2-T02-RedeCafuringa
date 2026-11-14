import { cleanup, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
    fillProduct,
    fields,
    json,
    mockProductApi,
    openProduct,
    photo,
    product,
    session,
    submissions,
    submit,
} from "../fixtures/hu15";

// Integração com o backend da HU15 (POST /api/v1/products).
describe("HU15 — contrato com a API", () => {
    beforeEach(() => {
        localStorage.clear();
        sessionStorage.clear();
        window.location.hash = "";
    });

    afterEach(() => {
        cleanup();
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
        localStorage.clear();
        sessionStorage.clear();
        window.location.hash = "";
    });

    const keyOf = (init: RequestInit | undefined) =>
        new Headers(init?.headers).get("Idempotency-Key");

    it("CA07: reenvia com a mesma Idempotency-Key após falha de conexão", async () => {
        session();
        let attempts = 0;
        const api = mockProductApi(() => {
            if (++attempts === 1) throw new TypeError("Failed to fetch");
            return json(product, 201);
        });
        const { user } = await openProduct();
        await fillProduct(user);
        submit();
        await screen.findByRole("alert");
        submit();
        await waitFor(() => expect(submissions(api)).toHaveLength(2));

        const [first, second] = submissions(api).map(([, init]) => keyOf(init));
        expect(first).toMatch(/^[A-Za-z0-9_-]{8,64}$/);
        expect(second).toBe(first);
    });

    it("CA07: editar os dados gera outra chave (é outro cadastro)", async () => {
        session();
        const api = mockProductApi(() => {
            throw new TypeError("Failed to fetch");
        });
        const { user } = await openProduct();
        const f = await fillProduct(user);
        submit();
        await screen.findByRole("alert");
        await user.type(f.nome, " grande");
        submit();
        await waitFor(() => expect(submissions(api)).toHaveLength(2));

        const [first, second] = submissions(api).map(([, init]) => keyOf(init));
        expect(second).not.toBe(first);
    });

    it("CA04/RNF03: mostra a orientação devolvida pela API", async () => {
        session();
        mockProductApi(() =>
            json(
                {
                    statusCode: 413,
                    error: "Payload Too Large",
                    message: "Cada foto deve ter no máximo 5 MB",
                },
                413,
            ),
        );
        const { user } = await openProduct();
        await fillProduct(user);
        submit();
        expect((await screen.findByRole("alert")).textContent).toMatch(
            /Cada foto deve ter no máximo 5 MB/,
        );
        expect(fields().nome.value).toBe(product.nome);
    });

    it("aceita várias fotos (até 10) e envia todas na ordem", async () => {
        session();
        const api = mockProductApi();
        const { user } = await openProduct();
        await fillProduct(user);
        await user.upload(
            fields().fotos,
            Array.from({ length: 10 }, () => photo()),
        );
        submit();
        await waitFor(() => expect(submissions(api)).toHaveLength(1));
        const sent = (submissions(api)[0][1]!.body as FormData).getAll("fotos");
        expect(sent).toHaveLength(10);
    });

    it("CA04: recusa mais de 10 fotos antes de enviar", async () => {
        session();
        const api = mockProductApi();
        const { user } = await openProduct();
        await fillProduct(user);
        await user.upload(
            fields().fotos,
            Array.from({ length: 11 }, () => photo()),
        );
        submit();
        expect(await screen.findByText(/no máximo 10 fotos/)).toBeTruthy();
        expect(submissions(api)).toHaveLength(0);
    });
});
