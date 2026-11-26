import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AccountPage } from "@/features/account";

afterEach(() => {
    cleanup();
    localStorage.clear();
    vi.unstubAllGlobals();
});

function renderAccount(
    role: "producer" | "consumer" | "admin",
    demoContact = false,
) {
    const onNavigate = vi.fn();
    const draft = { whatsappNumber: "", authorized: false };
    render(
        <AccountPage
            role={role}
            consumerName=""
            settings={draft}
            draft={draft}
            saved={false}
            onDraftChange={vi.fn()}
            onSavedChange={vi.fn()}
            onSaveContact={vi.fn()}
            onNavigate={onNavigate}
            onSignOut={vi.fn()}
            demoContact={demoContact}
        />,
    );
    return { onNavigate };
}

const trajectoryButton = () =>
    screen.queryByRole("button", { name: "Minha trajetória" });

describe("conta da produtora — acesso à trajetória (HU12)", () => {
    it.each([
        ["com a API real", false],
        ["na demonstração", true],
    ])(
        "%s, o botão Minha trajetória abre o formulário desde o início",
        (_modo, demoContact) => {
            const { onNavigate } = renderAccount("producer", demoContact);

            fireEvent.click(trajectoryButton() as HTMLElement);

            expect(onNavigate).toHaveBeenCalledWith("/minha-trajetoria");
        },
    );

    it("o atalho de contato público continua levando direto ao campo de contato", () => {
        const { onNavigate } = renderAccount("producer");

        fireEvent.click(
            screen.getByRole("button", { name: "Configurar contato público" }),
        );

        expect(onNavigate).toHaveBeenCalledWith("/minha-trajetoria?contato=1");
    });

    it.each(["consumer", "admin"] as const)(
        "a conta %s não mostra o botão",
        (role) => {
            renderAccount(role);

            expect(trajectoryButton()).toBeNull();
        },
    );
});
