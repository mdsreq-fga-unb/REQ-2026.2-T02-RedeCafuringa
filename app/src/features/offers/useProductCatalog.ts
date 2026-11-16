import { useCallback, useEffect, useState } from "react";
import { listProducts } from "./productService";
import type { Product } from "./productTypes";
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

    return { ...state, retry };
}
