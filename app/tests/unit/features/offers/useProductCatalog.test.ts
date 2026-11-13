import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Product } from "@/features/offers/productTypes";
import { useProductCatalog } from "@/features/offers/useProductCatalog";

afterEach(cleanup);

const mel: Product = {
    id: "mel",
    name: "Mel do Cerrado",
    producerName: "Dona Maria",
    price: 32,
    unit: "unidade",
    image: "https://exemplo.com/mel.jpg",
};

describe("useProductCatalog", () => {
    it("começa carregando e depois entrega os produtos", async () => {
        const load = vi.fn().mockResolvedValue([mel]);
        const { result } = renderHook(() => useProductCatalog(load));

        expect(result.current.status).toBe("loading");
        expect(result.current.products).toEqual([]);

        await waitFor(() => expect(result.current.status).toBe("ready"));
        expect(result.current.products).toEqual([mel]);
    });

    it("fica pronto com lista vazia quando não há produtos (CA06)", async () => {
        const load = vi.fn().mockResolvedValue([]);
        const { result } = renderHook(() => useProductCatalog(load));

        await waitFor(() => expect(result.current.status).toBe("ready"));
        expect(result.current.products).toEqual([]);
    });

    it("sinaliza erro quando o carregamento falha (CA08)", async () => {
        const load = vi.fn().mockRejectedValue(new Error("falhou"));
        const { result } = renderHook(() => useProductCatalog(load));

        await waitFor(() => expect(result.current.status).toBe("error"));
        expect(result.current.products).toEqual([]);
    });

    it("tenta de novo ao acionar retry", async () => {
        const load = vi
            .fn<() => Promise<Product[]>>()
            .mockRejectedValueOnce(new Error("falhou"))
            .mockResolvedValueOnce([mel]);
        const { result } = renderHook(() => useProductCatalog(load));
        await waitFor(() => expect(result.current.status).toBe("error"));

        act(() => result.current.retry());
        expect(result.current.status).toBe("loading");

        await waitFor(() => expect(result.current.status).toBe("ready"));
        expect(load).toHaveBeenCalledTimes(2);
        expect(result.current.products).toEqual([mel]);
    });
});
