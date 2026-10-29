import { expect, it } from "vitest";

// Falha proposital para provar que o ruleset bloqueia o merge. NAO MERGEAR.
it("bloqueio de proposito", () => {
    expect(1).toBe(2);
});
