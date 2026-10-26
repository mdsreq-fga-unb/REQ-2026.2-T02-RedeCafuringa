import { useEffect, useState } from "react";

const getInitialRoute = () => {
    const requested = window.location.hash.slice(1) || "/perfil";
    return ["/perfil", "/catalogo", "/entrar", "/conta"].includes(
        requested.split("?")[0],
    ) || requested.startsWith("/oferta/")
        ? requested
        : "/perfil";
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
