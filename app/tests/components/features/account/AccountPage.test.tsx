import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AccountPage } from "@/features/account";

afterEach(() => {
    cleanup();
    localStorage.clear();
    vi.unstubAllGlobals();
});

describe("configurações de contato da conta", () => {
    it("HU39/CA03: com a API real, aponta para Minha trajetória em vez de guardar o número no aparelho", () => {
        const onNavigate = vi.fn();
        const draft = { whatsappNumber: "", authorized: false };
        render(
            <AccountPage
                role="producer"
                consumerName=""
                settings={draft}
                draft={draft}
                saved={false}
                onDraftChange={vi.fn()}
                onSavedChange={vi.fn()}
                onSaveContact={vi.fn()}
                onNavigate={onNavigate}
                onSignOut={vi.fn()}
                demoContact={false}
            />,
        );

        expect(
            screen.queryByLabelText("WhatsApp com código do país"),
        ).toBeNull();
        expect(
            screen.queryByRole("button", { name: "Salvar contato" }),
        ).toBeNull();
        expect(
            screen.getByText(/autorize a divulgação em Minha trajetória/),
        ).toBeTruthy();
        fireEvent.click(
            screen.getByRole("button", { name: "Configurar contato público" }),
        );
        expect(onNavigate).toHaveBeenCalledWith("/minha-trajetoria?contato=1");
    });

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
                demoContact
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
                demoContact
            />,
        );

        expect(screen.getByRole("status").textContent).toMatch(
            /Contato autorizado e disponível/,
        );
    });

    it("mostra e salva os dados principais do perfil produtor", async () => {
        const profile = {
            nomeIniciativa: "Horta da Maria",
            categoriaOfertada: "Experiências",
            formasPagamento: ["Dinheiro", "Cartão de débito"],
        };
        localStorage.setItem("cafuringa-token", "producer-token");
        const fetchMock = vi.fn<typeof fetch>(async (url, request) => {
            if (
                new Headers(request?.headers).get("Authorization") !==
                "Bearer producer-token"
            )
                return new Response(null, { status: 401 });
            if (String(url) === "/api/v1/producers/me/trajectory")
                return Response.json({ fotoUrl: "/producers/maria/photo" });
            return request?.method === "PUT"
                ? new Response(null, { status: 204 })
                : Response.json(profile);
        });
        vi.stubGlobal("fetch", fetchMock);
        render(
            <AccountPage
                role="producer"
                userId="produtor-maria"
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
        expect(
            (
                await screen.findByRole("img", { name: "Sua foto de perfil" })
            ).getAttribute("src"),
        ).toBe("/api/v1/producers/maria/photo");
        const initiative = await screen.findByRole("textbox", {
            name: /nome da iniciativa/i,
        });
        expect(initiative).toHaveProperty("value", profile.nomeIniciativa);
        expect(
            screen.getByRole("combobox", { name: /categoria/i }),
        ).toHaveProperty("value", profile.categoriaOfertada);
        expect(
            screen.getByRole("checkbox", { name: "Cartão de débito" }),
        ).toHaveProperty("checked", true);
        expect(screen.getByRole("checkbox", { name: "Pix" })).toHaveProperty(
            "checked",
            false,
        );
        fireEvent.change(initiative, { target: { value: "Sítio Raízes" } });
        fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

        expect(await screen.findByText("Alterações salvas.")).toBeTruthy();
        const [url, request] = fetchMock.mock.calls.find(
            ([, init]) => init?.method === "PUT",
        )!;
        expect(url).toBe("/api/v1/users/producers/me");
        expect(request?.method).toBe("PUT");
        expect(JSON.parse(String(request?.body))).toEqual({
            ...profile,
            nomeIniciativa: "Sítio Raízes",
        });
    });

    it.each([
        ["52998224725", "529.982.247-25"],
        ["***.982.247-**", "***.982.247-**"],
    ])("exibe os dados da consumidora com CPF %s", (cpf, displayedCpf) => {
        const onNavigate = vi.fn();
        const onSignOut = vi.fn();

        render(
            <AccountPage
                role="consumer"
                consumerName="Gabriela Pereira da Silva"
                consumerEmail="gabriela@exemplo.com"
                consumerCpf={cpf}
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
        expect(screen.getByText("Gabriela Pereira da Silva")).toBeTruthy();
        expect(screen.getByText("gabriela@exemplo.com")).toBeTruthy();
        expect(screen.getByText(displayedCpf)).toBeTruthy();
        expect(
            screen.queryByRole("button", {
                name: "Acessar como produtora",
            }),
        ).toBeNull();
        expect(
            screen.queryByRole("heading", { name: "Explore a Cafuringa" }),
        ).toBeNull();
        fireEvent.click(screen.getByRole("button", { name: "Sair da conta" }));

        expect(onSignOut).toHaveBeenCalledOnce();
    });
});

describe("conta do administrador — HU03", () => {
    it("identifica o perfil como Administrador, sem recursos de consumidor", () => {
        const draft = { whatsappNumber: "", authorized: false };
        render(
            <AccountPage
                role="admin"
                consumerName="Administradora"
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
            screen.getByText("Administradora", { selector: ".eyebrow" }),
        ).toBeTruthy();
        expect(screen.queryByText("Consumidora")).toBeNull();
    });
});
