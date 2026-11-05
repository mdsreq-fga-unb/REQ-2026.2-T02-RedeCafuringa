import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AccountPage } from "@/features/account";

afterEach(() => {
    cleanup();
    localStorage.clear();
});

describe("configurações de contato da conta", () => {
    it("permite alterar consentimento e salvar o contato", () => {
        const onDraftChange = vi.fn();
        const onSaveContact = vi.fn((event: React.FormEvent) =>
            event.preventDefault(),
        );
        const draft = {
            whatsappNumber: "5561999999999",
            authorized: false,
        };

        render(
            <AccountPage
                role="producer"
                consumerName=""
                settings={draft}
                draft={draft}
                saved={false}
                onDraftChange={onDraftChange}
                onSavedChange={vi.fn()}
                onSaveContact={onSaveContact}
                onNavigate={vi.fn()}
                onSignOut={vi.fn()}
            />,
        );

        fireEvent.click(
            screen.getByText("Contato público", { selector: "summary" }),
        );
        fireEvent.click(screen.getByRole("checkbox"));
        expect(onDraftChange).toHaveBeenCalledWith({
            ...draft,
            authorized: true,
        });

        const form = screen
            .getByRole("button", { name: "Salvar contato" })
            .closest("form");
        expect(form).not.toBeNull();
        fireEvent.submit(form!);
        expect(onSaveContact).toHaveBeenCalledOnce();
    });

    it("exibe confirmação quando o contato autorizado está disponível", () => {
        render(
            <AccountPage
                role="producer"
                consumerName=""
                settings={{ whatsappNumber: "5561999999999", authorized: true }}
                draft={{ whatsappNumber: "5561999999999", authorized: true }}
                saved
                onDraftChange={vi.fn()}
                onSavedChange={vi.fn()}
                onSaveContact={vi.fn()}
                onNavigate={vi.fn()}
                onSignOut={vi.fn()}
            />,
        );

        fireEvent.click(
            screen.getByText("Contato público", { selector: "summary" }),
        );
        expect(screen.getByRole("status").textContent).toMatch(
            /Contato autorizado e disponível/,
        );
    });

    it("mostra e salva os dados principais do perfil produtor", () => {
        render(
            <AccountPage
                role="producer"
                consumerName="Maria"
                settings={{ whatsappNumber: "", authorized: false }}
                draft={{ whatsappNumber: "", authorized: false }}
                saved={false}
                onDraftChange={vi.fn()}
                onSavedChange={vi.fn()}
                onSaveContact={vi.fn()}
                onNavigate={vi.fn()}
                onSignOut={vi.fn()}
            />,
        );

        expect(
            screen.getByRole("heading", { name: "Olá, Maria" }),
        ).toBeTruthy();
        expect(screen.getByLabelText("Nome da iniciativa")).toHaveProperty(
            "placeholder",
            "Flor do campo",
        );
        fireEvent.change(screen.getByLabelText("Nome da iniciativa"), {
            target: { value: "Sítio Raízes" },
        });
        fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

        expect(localStorage.getItem("cafuringa-producer-initiative")).toBe(
            "Sítio Raízes",
        );
        expect(screen.getByRole("status").textContent).toBe(
            "Alterações salvas.",
        );
    });

    it("exibe os dados do consumidor e permite acessar o login de produtor", () => {
        const onNavigate = vi.fn();
        const onSignOut = vi.fn();

        render(
            <AccountPage
                role="consumer"
                consumerName="Gabriela Pereira da Silva"
                consumerEmail="gabriela@exemplo.com"
                consumerCpf="52998224725"
                settings={{ whatsappNumber: "", authorized: false }}
                draft={{ whatsappNumber: "", authorized: false }}
                saved={false}
                onDraftChange={vi.fn()}
                onSavedChange={vi.fn()}
                onSaveContact={vi.fn()}
                onNavigate={onNavigate}
                onSignOut={onSignOut}
            />,
        );

        expect(
            screen.getByRole("heading", { name: "Olá, Gabriela" }),
        ).toBeTruthy();
        expect(screen.getByLabelText("E-mail")).toHaveProperty(
            "value",
            "gabriela@exemplo.com",
        );
        expect(screen.getByLabelText("CPF")).toHaveProperty(
            "value",
            "529.982.247-25",
        );
        fireEvent.click(
            screen.getByRole("button", { name: "Acessar como produtor" }),
        );
        fireEvent.click(screen.getByRole("button", { name: "Sair da conta" }));

        expect(onNavigate).toHaveBeenCalledWith("/login/producer");
        expect(onSignOut).toHaveBeenCalledOnce();
    });
});

describe("conta do administrador — HU03", () => {
    it("identifica o perfil como Administrador, sem recursos de consumidor", () => {
        const draft = { whatsappNumber: "", authorized: false };
        render(
            <AccountPage
                role="admin"
                consumerName="Administrador"
                settings={draft}
                draft={draft}
                saved={false}
                onDraftChange={vi.fn()}
                onSavedChange={vi.fn()}
                onSaveContact={vi.fn()}
                onNavigate={vi.fn()}
                onSignOut={vi.fn()}
            />,
        );

        expect(
            screen.getByText("Administrador", { selector: ".eyebrow" }),
        ).toBeTruthy();
        expect(screen.queryByText("Consumidora")).toBeNull();
    });
});
