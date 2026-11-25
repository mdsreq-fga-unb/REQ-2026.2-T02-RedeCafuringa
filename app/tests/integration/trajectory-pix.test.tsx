import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
    callsTo,
    fillTrajectory,
    json,
    mockTrajectoryApi,
    openEditor,
    ownPath,
    ownTrajectory,
    seedSession,
} from "../fixtures/hu12";

vi.mock("@/features/auth/authMode", () => ({ isMockAuthEnabled: false }));

beforeEach(() => {
    // jsdom não implementa a abertura e o fechamento nativos de dialog.
    Object.defineProperties(HTMLDialogElement.prototype, {
        showModal: {
            configurable: true,
            value(this: HTMLDialogElement) {
                this.open = true;
            },
        },
        close: {
            configurable: true,
            value(this: HTMLDialogElement) {
                this.open = false;
            },
        },
    });
    localStorage.clear();
    sessionStorage.clear();
    window.location.hash = "";
});

afterEach(() => {
    cleanup();
    localStorage.clear();
    sessionStorage.clear();
    window.location.hash = "";
    vi.unstubAllGlobals();
});

const fields = () => ({
    type: screen.getByLabelText("Tipo da chave Pix") as HTMLSelectElement,
    key: screen.getByLabelText("Chave Pix") as HTMLInputElement,
    receiver: screen.getByLabelText(
        "Nome de quem recebe o Pix",
    ) as HTMLInputElement,
    public: screen.getByRole("checkbox", {
        name: "Mostrar minha chave Pix a quem tiver pré-reserva aceita",
    }) as HTMLInputElement,
});

const sentBody = (api: ReturnType<typeof mockTrajectoryApi>) =>
    JSON.parse(String(callsTo(api, ownPath, "PUT")[0][1]?.body));

const savedPix = {
    tipo: "email",
    chave: "maria@exemplo.com",
    nomeRecebedor: "Maria da Silva",
    publico: true,
    atualizadoEm: "2026-11-20T12:00:00.000Z",
};

describe("trajetória — Pix para receber o sinal", () => {
    it("explica onde a chave aparece", async () => {
        seedSession();
        mockTrajectoryApi();

        await openEditor();

        expect(
            screen.getByRole("group", { name: "Pix para receber o sinal" }),
        ).toBeTruthy();
        expect(
            screen.getByText(
                "A chave aparece só para quem tiver uma pré-reserva aceita com você, para pagar o sinal. Ela nunca aparece no seu perfil público.",
            ),
        ).toBeTruthy();
    });

    it("salva o Pix com a chave normalizada", async () => {
        seedSession();
        const api = mockTrajectoryApi();
        const { user } = await openEditor();
        fillTrajectory();
        const f = fields();

        await user.selectOptions(f.type, "cpf");
        fireEvent.change(f.key, { target: { value: "529.982.247-25" } });
        fireEvent.change(f.receiver, { target: { value: "Maria da Silva" } });
        await user.click(f.public);
        await user.click(screen.getByRole("button", { name: /salvar/i }));

        await waitFor(() =>
            expect(callsTo(api, ownPath, "PUT")).toHaveLength(1),
        );
        expect(sentBody(api).pix).toEqual({
            tipo: "cpf",
            chave: "52998224725",
            nomeRecebedor: "Maria da Silva",
            publico: true,
        });
    });

    it("chave que não combina com o tipo: orienta, foca o campo e não salva", async () => {
        seedSession();
        const api = mockTrajectoryApi();
        const { user } = await openEditor();
        fillTrajectory();
        const f = fields();

        await user.selectOptions(f.type, "email");
        fireEvent.change(f.key, { target: { value: "52998224725" } });
        fireEvent.change(f.receiver, { target: { value: "Maria da Silva" } });
        await user.click(screen.getByRole("button", { name: /salvar/i }));

        expect((await screen.findByRole("alert")).textContent).toBe(
            "Chave Pix inválida para o tipo escolhido.",
        );
        await waitFor(() => expect(document.activeElement).toBe(f.key));
        expect(f.key.getAttribute("aria-invalid")).toBe("true");
        expect(callsTo(api, ownPath, "PUT")).toHaveLength(0);
    });

    it("ao reabrir, mostra o Pix salvo", async () => {
        seedSession();
        mockTrajectoryApi({
            getOwn: () => json({ ...ownTrajectory, pix: savedPix }),
        });

        await openEditor();
        const f = fields();

        expect(f.type.value).toBe("email");
        expect(f.key.value).toBe("maria@exemplo.com");
        expect(f.receiver.value).toBe("Maria da Silva");
        expect(f.public.checked).toBe(true);
    });

    it("apagar o Pix salvo envia null para removê-lo", async () => {
        seedSession();
        const api = mockTrajectoryApi({
            getOwn: () => json({ ...ownTrajectory, pix: savedPix }),
        });
        const { user } = await openEditor();
        const f = fields();

        await user.selectOptions(f.type, "");
        fireEvent.change(f.key, { target: { value: "" } });
        fireEvent.change(f.receiver, { target: { value: "" } });
        await user.click(screen.getByRole("button", { name: /salvar/i }));

        await waitFor(() =>
            expect(callsTo(api, ownPath, "PUT")).toHaveLength(1),
        );
        expect(sentBody(api).pix).toBeNull();
    });

    it("RNF04: sem violações WCAG A/AA com o Pix preenchido e com erro", async () => {
        seedSession();
        mockTrajectoryApi();
        const { container, user } = await openEditor();
        fillTrajectory();
        fireEvent.change(fields().key, { target: { value: "abc" } });
        await user.click(screen.getByRole("button", { name: /salvar/i }));
        await screen.findAllByRole("alert");

        const report = await axe.run(container, {
            runOnly: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
            rules: { "color-contrast": { enabled: false } },
        });

        expect(report.violations).toEqual([]);
    });
});
