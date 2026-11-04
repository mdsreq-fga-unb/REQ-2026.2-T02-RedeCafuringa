import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProfilePage } from "@/features/profile";

const maskedCpf = /\d{3}\.\d{3}\.\d{3}-\d{2}/;
const maskedCnpj = /\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/;
const rawDocument = /\d{11}|\d{14}/;
const documentLabel = /CPF|CNPJ/;

describe("ProfilePage — HU02, critério 11 (dados sigilosos)", () => {
    afterEach(() => {
        cleanup();
    });

    it.each([true, false])(
        "não mostra CPF nem CNPJ no perfil público (contato disponível: %s)",
        (contactAvailable) => {
            const { container } = render(
                <ProfilePage
                    contactAvailable={contactAvailable}
                    onNavigate={vi.fn()}
                    onStartContact={vi.fn()}
                />,
            );
            const text = container.textContent ?? "";

            expect(text).not.toMatch(maskedCpf);
            expect(text).not.toMatch(maskedCnpj);
            expect(text).not.toMatch(rawDocument);
            expect(text).not.toMatch(documentLabel);
        },
    );
});
