import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./app/App.tsx";
import { EnvError, loadEnv } from "./shared/config/env";

const root = document.getElementById("root")!;

try {
    loadEnv();
    createRoot(root).render(
        <StrictMode>
            <App />
        </StrictMode>,
    );
} catch (error) {
    if (!(error instanceof EnvError)) throw error;
    // Configuração de build inválida: mostra o motivo em vez de uma tela em branco.
    console.error(error.message);
    root.setAttribute("role", "alert");
    root.textContent = error.message;
}
