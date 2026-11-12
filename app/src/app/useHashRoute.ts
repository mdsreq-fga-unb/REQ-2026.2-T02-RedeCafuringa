import { useCallback, useEffect, useState } from "react";

const getInitialRoute = () => {
    const requested = window.location.hash.slice(1) || "/escolher-perfil";
    return [
        "/perfil",
        "/explorar",
        "/admin/acesso",
        "/admin/entrar",
        "/cadastro/administrador",
        "/conta-criada/admin",
        "/catalogo",
        "/entrar",
        "/recuperar-acesso",
        "/nova-senha",
        "/conta",
        "/escolher-perfil",
        "/login/consumer",
        "/login/producer",
        "/cadastro",
        "/cadastro/trajetoria",
        "/minha-trajetoria",
        "/cadastro/consumidor",
        "/conta-criada/consumer",
        "/conta-criada/producer",
        "/notificacoes",
        "/reservas",
    ].includes(requested.split("?")[0]) ||
        requested.startsWith("/oferta/") ||
        /^\/produtor\/[^/?]+$/.test(requested.split("?")[0]) ||
        /^\/admin\/usuarios(?:\/[^/?]+)?$/.test(requested.split("?")[0])
        ? requested
        : "/escolher-perfil";
};

export function useHashRoute() {
    const [route, setRoute] = useState(getInitialRoute);

    useEffect(() => {
        const syncRoute = () => setRoute(getInitialRoute());
        window.addEventListener("hashchange", syncRoute);
        return () => window.removeEventListener("hashchange", syncRoute);
    }, []);

    const navigate = useCallback((path: string) => {
        window.location.hash = path;
        // Alterar para o mesmo hash não emite hashchange. Sincroniza também
        // o estado da tela para que Início/Explorar nunca preserve uma tela antiga.
        setRoute(getInitialRoute());
    }, []);

    return { route, navigate };
}
