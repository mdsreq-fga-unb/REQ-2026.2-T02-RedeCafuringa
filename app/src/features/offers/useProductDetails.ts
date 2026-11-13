import { useEffect, useState } from "react";
import { getProductById } from "./productService";
import type { ProductDetails } from "./productTypes";

export type ProductDetailsStatus = "loading" | "ready" | "notFound" | "error";

export type ProductDetailsState = {
    status: ProductDetailsStatus;
    product?: ProductDetails;
};

type LoadedState = ProductDetailsState & { id: string };

export function useProductDetails(id: string): ProductDetailsState {
    const [state, setState] = useState<LoadedState>({
        id,
        status: "loading",
    });

    useEffect(() => {
        let active = true;

        async function load() {
            try {
                const product = await getProductById(id);
                if (!active) return;
                setState(
                    product
                        ? { id, status: "ready", product }
                        : { id, status: "notFound" },
                );
            } catch {
                if (active) setState({ id, status: "error" });
            }
        }

        void load();
        return () => {
            active = false;
        };
    }, [id]);

    if (state.id !== id) return { status: "loading" };
    return { status: state.status, product: state.product };
}