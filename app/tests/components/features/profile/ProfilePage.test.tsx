import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProfilePage } from "@/features/profile";

afterEach(cleanup);

const CONTACT = /Conversar pelo WhatsApp/;

describe("página de perfil", () => {
    it("não exibe contato quando o número não está autorizado", () => {
        render(<ProfilePage onNavigate={vi.fn()} />);

        expect(screen.queryByRole("link", { name: CONTACT })).toBeNull();
        expect(screen.queryByRole("button", { name: CONTACT })).toBeNull();
    });

    it("exibe o link de contato quando ele está disponível", () => {
        const url = "https://wa.me/5561999999999?text=Ol%C3%A1";
        render(<ProfilePage contactUrl={url} onNavigate={vi.fn()} />);

        expect(
            screen.getByRole("link", { name: CONTACT }).getAttribute("href"),
        ).toBe(url);
    });
});
