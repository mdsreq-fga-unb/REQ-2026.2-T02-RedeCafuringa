import { cleanup, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as fixture from "../fixtures/hu21";

vi.mock("@/features/auth/authMode", () => ({ isMockAuthEnabled: false }));

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

const sent = (api: ReturnType<typeof fixture.mockExperienceApi>) =>
    fixture.submissions(api)[0][1]!.body as FormData;

const depositBox = () =>
    screen.getByRole("checkbox", {
        name: "Pedir sinal de 50% por Pix para garantir a vaga",
    }) as HTMLInputElement;

describe("cadastro de experiência — sinal e pagamento no dia", () => {
    it("por padrão, pede sinal e não lista formas", async () => {
        fixture.session();
        const api = fixture.mockExperienceApi();
        const { user } = await fixture.openExperience();
        await fixture.fillExperience(user);

        expect(depositBox().checked).toBe(true);
        fixture.submit();

        await screen.findByRole("status");
        expect(sent(api).get("exigeSinal")).toBe("true");
        expect(sent(api).has("formasPagamentoNoDia")).toBe(false);
    });

    it("a produtora tira o sinal e marca as formas aceitas no dia", async () => {
        fixture.session();
        const api = fixture.mockExperienceApi();
        const { user } = await fixture.openExperience();
        await fixture.fillExperience(user);

        await user.click(depositBox());
        const methods = screen.getByRole("group", {
            name: "Formas aceitas no dia",
        });
        await user.click(screen.getByRole("checkbox", { name: "Dinheiro" }));
        await user.click(screen.getByRole("checkbox", { name: "Pix" }));
        expect(methods).toBeTruthy();
        fixture.submit();

        await screen.findByRole("status");
        expect(sent(api).get("exigeSinal")).toBe("false");
        expect(sent(api).get("formasPagamentoNoDia")).toBe("pix,dinheiro");
    });

    it("o aviso explica o risco de não pedir sinal", async () => {
        fixture.session();
        fixture.mockExperienceApi();
        const { user } = await fixture.openExperience();
        await fixture.fillExperience(user);

        await user.click(depositBox());

        expect(
            screen.getByText(
                "Sem sinal, a vaga fica garantida mesmo que a pessoa não compareça.",
            ),
        ).toBeTruthy();
    });

    it("cadastro de produto não mostra as opções de sinal", async () => {
        const products = await import("../fixtures/hu15");
        products.session();
        products.mockProductApi();
        await products.openProduct();

        expect(
            screen.queryByRole("checkbox", {
                name: "Pedir sinal de 50% por Pix para garantir a vaga",
            }),
        ).toBeNull();
    });
});
