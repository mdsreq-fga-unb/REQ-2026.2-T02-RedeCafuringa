import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "@/app/App";

/** Estabelece a sessão pelo login; dados salvos no navegador não autenticam admin. */
export async function renderAdminApp(route = window.location.hash) {
    window.location.hash = "#/admin/entrar";
    const rendered = render(<App />);
    fireEvent.change(screen.getByLabelText("E-mail"), {
        target: { value: "admin@exemplo.com" },
    });
    fireEvent.change(screen.getByLabelText("Senha"), {
        target: { value: "senha123" },
    });
    await userEvent
        .setup()
        .click(screen.getByRole("button", { name: "Entrar" }));
    await screen.findByRole("heading", { name: "Funções do administrador" });
    await act(async () => {
        window.location.hash = route;
        window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    return rendered;
}
