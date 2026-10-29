import { expect, it } from "vitest";

// Falha proposital para provar que o frontend-ci bloqueia PR vermelho. NAO MERGEAR.
it("ci vermelho de proposito", () => {
    expect(1).toBe(2);
});
