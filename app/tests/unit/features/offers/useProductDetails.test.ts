import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getProductById } from "@/features/offers/productService";
import type { ProductDetails } from "@/features/offers/productTypes";
import { useProductDetails } from "@/features/offers/useProductDetails";

vi.mock("@/features/offers/productService", () => ({
    getProductById: vi.fn(),
}));

const getProductByIdMock = vi.mocked(getProductById);

function makeProduct(id: string, name: string): ProductDetails {
    return {
        id,
        name,
        producerName: "Dona Maria",
        price: 32,
        unit: "unidade",
        image: "/imagem.jpg",
        available: true,
    };
}

function deferred<T>() {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>((res) => {
        resolve = res;
    });
    return { promise, resolve };
}

const mel = makeProduct("mel", "Mel do Cerrado");
const cesta = makeProduct("cesta", "Cesta da estação");

describe("useProductDetails", () => {
    beforeEach(() => {
        getProductByIdMock.mockReset();
    });
    afterEach(cleanup);

    it("começa carregando e passa a pronto com o produto", async () => {
        getProductByIdMock.mockResolvedValue(mel);

        const { result } = renderHook(() => useProductDetails("mel"));

        expect(result.current.status).toBe("loading");
        expect(result.current.product).toBeUndefined();

        await waitFor(() => expect(result.current.status).toBe("ready"));
        expect(result.current.product).toEqual(mel);
        expect(getProductByIdMock).toHaveBeenCalledWith("mel");
    });

    it("informa notFound quando o produto não existe (CA08)", async () => {
        getProductByIdMock.mockResolvedValue(null);

        const { result } = renderHook(() => useProductDetails("nao-existe"));

        await waitFor(() => expect(result.current.status).toBe("notFound"));
        expect(result.current.product).toBeUndefined();
    });

    it("informa error quando o serviço falha (CA09)", async () => {
        getProductByIdMock.mockRejectedValue(new Error("falha de rede"));

        const { result } = renderHook(() => useProductDetails("mel"));

        await waitFor(() => expect(result.current.status).toBe("error"));
        expect(result.current.product).toBeUndefined();
    });

    it("volta a carregar e busca o novo produto quando o id muda", async () => {
        getProductByIdMock
            .mockResolvedValueOnce(mel)
            .mockResolvedValueOnce(cesta);

        const { result, rerender } = renderHook(
            ({ id }) => useProductDetails(id),
            { initialProps: { id: "mel" } },
        );
        await waitFor(() => expect(result.current.product?.id).toBe("mel"));

        rerender({ id: "cesta" });

        expect(result.current.status).toBe("loading");
        expect(result.current.product).toBeUndefined();
        await waitFor(() => expect(result.current.product?.id).toBe("cesta"));
        expect(getProductByIdMock).toHaveBeenNthCalledWith(2, "cesta");
    });

    it("ignora a resposta atrasada de um id anterior", async () => {
        const atrasada = deferred<ProductDetails | null>();
        getProductByIdMock
            .mockReturnValueOnce(atrasada.promise)
            .mockResolvedValueOnce(cesta);

        const { result, rerender } = renderHook(
            ({ id }) => useProductDetails(id),
            { initialProps: { id: "mel" } },
        );
        rerender({ id: "cesta" });
        await waitFor(() => expect(result.current.product?.id).toBe("cesta"));

        await act(async () => {
            atrasada.resolve(mel);
            await atrasada.promise;
        });

        expect(result.current.product?.id).toBe("cesta");
        expect(result.current.status).toBe("ready");
    });
});