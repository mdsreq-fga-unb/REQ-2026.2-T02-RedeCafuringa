import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProfilePage } from "@/features/profile";

afterEach(cleanup);

describe("página de perfil", () => {
    it("não exibe contato quando o número não está autorizado", () => {
        render(
            <ProfilePage
                contactAvailable={false}
                onNavigate={vi.fn()}
                onStartContact={vi.fn()}
            />,
        );

        expect(
            screen.queryByRole("button", { name: "Conversar pelo WhatsApp" }),
        ).toBeNull();
    });

    it("exibe e aciona o contato quando ele está disponível", () => {
        const onStartContact = vi.fn();
        render(
            <ProfilePage
                contactAvailable
                onNavigate={vi.fn()}
                onStartContact={onStartContact}
            />,
        );

        fireEvent.click(
            screen.getByRole("button", { name: "Conversar pelo WhatsApp" }),
        );

        expect(onStartContact).toHaveBeenCalledOnce();
    });
});
