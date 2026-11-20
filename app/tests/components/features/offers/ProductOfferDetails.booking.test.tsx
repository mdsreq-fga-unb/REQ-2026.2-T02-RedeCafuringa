import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProductOfferDetails } from "@/features/offers/ProductOfferDetails";
import { getExperienceDetails } from "@/features/offers/catalogItems";
import { getProductDetails } from "@/features/offers/productDetailsService";
import { getPublicTrajectory } from "@/features/trajectory/trajectoryService";
import type { Product } from "@/features/offers/productTypes";

vi.mock("@/features/offers/catalogItems", () => ({
    getExperienceDetails: vi.fn(),
}));
vi.mock("@/features/offers/productDetailsService", () => ({
    getProductDetails: vi.fn(),
}));
vi.mock("@/features/trajectory/trajectoryService", () => ({
    getPublicTrajectory: vi.fn(),
}));

const item: Product = {
    id: "e1",
    name: "Trilha guiada da nascente",
    producerId: "p1",
    producerName: "Jefferson Sooma",
    description: "Caminhada até a nascente.",
    category: "Experiências",
    price: 45,
    unit: "pessoa",
    image: "",
    local: "Cafuringa, DF",
    duracao: "2 horas",
};

beforeEach(() => {
    vi.mocked(getExperienceDetails).mockResolvedValue(item);
    vi.mocked(getProductDetails).mockResolvedValue({
        ...item,
        category: "Produtos",
    });
    vi.mocked(getPublicTrajectory).mockResolvedValue(
        {} as Awaited<ReturnType<typeof getPublicTrajectory>>,
    );
});

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

const renderDetails = (
    props: { experience?: boolean; bookingAvailable?: boolean } = {},
) => {
    const onNavigate = vi.fn();
    render(
        <ProductOfferDetails
            id="e1"
            experience
            bookingAvailable
            onNavigate={onNavigate}
            {...props}
        />,
    );
    return onNavigate;
};

const bookingButton = () =>
    screen.queryByRole("button", { name: "Solicitar pré-reserva" });

describe("ProductOfferDetails: pré-reserva (HU44 CA01 e CA07)", () => {
    it("leva ao formulário de pré-reserva da experiência", async () => {
        const onNavigate = renderDetails();
        await screen.findByRole("heading", { name: item.name });
        await userEvent.click(bookingButton() as HTMLElement);
        expect(onNavigate).toHaveBeenCalledWith("/pre-reserva/e1");
    });

    it("não mostra o botão para quem não pode solicitar", async () => {
        renderDetails({ bookingAvailable: false });
        await screen.findByRole("heading", { name: item.name });
        expect(bookingButton()).toBeNull();
    });

    it("não mostra o botão no detalhe de um produto", async () => {
        renderDetails({ experience: false });
        await screen.findByRole("heading", { name: item.name });
        expect(bookingButton()).toBeNull();
    });

    it("não mostra o botão quando a experiência está indisponível (CA07)", async () => {
        vi.mocked(getExperienceDetails).mockResolvedValue(null);
        renderDetails();
        await screen.findByRole("alert");
        expect(bookingButton()).toBeNull();
    });
});
