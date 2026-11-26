import { beforeEach, describe, expect, it, vi } from "vitest";
import { getExperienceDetails } from "@/features/offers/catalogItems";
import { registerExperience } from "@/features/offers/experienceService";
import { getProductDetails } from "@/features/offers/productDetailsService";
import { registerProduct } from "@/features/offers/productService";

vi.mock("@/features/auth/authMode", () => ({ isMockAuthEnabled: true }));

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

const ID = "dQw4w9WgXcQ";
const photo = () => new File(["x"], "foto.png", { type: "image/png" });

beforeEach(() => {
    localStorage.clear();
    fetchMock.mockReset();
    localStorage.setItem("cafuringa-role", "producer");
    localStorage.setItem("cafuringa-token", "demo-token");
    localStorage.setItem("cafuringa-user-id", "demo-producer");
    localStorage.setItem("cafuringa-name", "Horta da Joana");
});

describe("vídeo do YouTube no detalhe (demonstração)", () => {
    it("o produto cadastrado com vídeo mostra o vídeo no detalhe", async () => {
        const saved = await registerProduct({
            nome: "Queijo minas",
            categoria: "Produtos",
            descricao: "Queijo curado no sítio.",
            preco: "30",
            gramas: "500",
            fotos: [photo()],
            videoUrl: `https://youtu.be/${ID}`,
        });

        expect((await getProductDetails(saved.id))?.videoId).toBe(ID);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("a experiência cadastrada com vídeo mostra o vídeo no detalhe", async () => {
        const saved = await registerExperience({
            nome: "Visita ao sítio",
            categoria: "Experiência",
            descricao: "Caminhada e degustação.",
            preco: "45",
            local: "Sítio Raízes",
            duracao: "2 horas",
            fotos: [photo()],
            videoUrl: `https://youtu.be/${ID}`,
        });

        expect((await getExperienceDetails(saved.id))?.videoId).toBe(ID);
    });

    it("sem vídeo, o detalhe não traz vídeo", async () => {
        const saved = await registerProduct({
            nome: "Queijo minas",
            categoria: "Produtos",
            descricao: "Queijo curado no sítio.",
            preco: "30",
            gramas: "500",
            fotos: [photo()],
        });

        expect((await getProductDetails(saved.id))?.videoId).toBeUndefined();
    });
});
