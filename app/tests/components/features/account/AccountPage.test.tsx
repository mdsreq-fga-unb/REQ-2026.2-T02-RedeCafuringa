import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AccountPage } from "@/features/account";

afterEach(cleanup);

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

        expect(screen.getByRole("status").textContent).toMatch(
            /Contato autorizado e disponível/,
        );
    });
});
