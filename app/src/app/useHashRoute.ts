import { useEffect, useState } from "react";

const getInitialRoute = () => {
    const requested = window.location.hash.slice(1) || "/escolher-perfil";
    return [
        "/perfil",
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
        "/cadastro/consumidor",
        "/conta-criada/consumer",
        "/conta-criada/producer",
        "/notificacoes",
        "/reservas",
    ].includes(requested.split("?")[0]) || requested.startsWith("/oferta/")
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

    const navigate = (path: string) => {
        window.location.hash = path;
    };

    return { route, navigate };
}
