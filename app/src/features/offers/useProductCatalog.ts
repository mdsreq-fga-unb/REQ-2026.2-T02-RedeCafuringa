import { useCallback, useEffect, useState } from "react";
import { listProducts } from "./productService";
import type { Product } from "./productTypes";
import { DEMO_OFFERS_KEY, OFFERS_CHANGED } from "./publishedOffers";
export type CatalogStatus = "loading" | "ready" | "error";

type CatalogState = {
    status: CatalogStatus;
    products: Product[];
};

export function useProductCatalog(
    load: () => Promise<Product[]> = listProducts,
) {
    const [state, setState] = useState<CatalogState>({
        status: "loading",
        products: [],
    });
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        let active = true;
        load().then(
            (products) => {
                if (active) setState({ status: "ready", products });
            },
            () => {
                if (active) setState({ status: "error", products: [] });
            },
        );
        return () => {
            active = false;
        };
    }, [load, attempt]);

    const retry = useCallback(() => {
        setState({ status: "loading", products: [] });
        setAttempt((current) => current + 1);
    }, []);

    useEffect(() => {
        const changed = (event: StorageEvent) => {
            if (event.key === DEMO_OFFERS_KEY || event.key === null) retry();
        };
        window.addEventListener(OFFERS_CHANGED, retry);
        window.addEventListener("storage", changed);
        return () => {
            window.removeEventListener(OFFERS_CHANGED, retry);
            window.removeEventListener("storage", changed);
        };
    }, [retry]);

    return { ...state, retry };
}
