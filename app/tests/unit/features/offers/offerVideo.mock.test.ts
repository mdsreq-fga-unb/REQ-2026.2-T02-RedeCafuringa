import { beforeEach, describe, expect, it, vi } from "vitest";
import { registerExperience } from "@/features/offers/experienceService";
import { registerProduct } from "@/features/offers/productService";

vi.mock("@/features/auth/authMode", () => ({ isMockAuthEnabled: true }));

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

const photo = () => new File(["x"], "foto.png", { type: "image/png" });

const product = {
    nome: "Queijo minas",
    categoria: "Produtos",
    descricao: "Queijo curado no sítio.",
    preco: "30",
    gramas: "500",
    fotos: [photo()],
};

const experience = {
    nome: "Visita ao sítio",
    categoria: "Experiência",
    descricao: "Caminhada e degustação.",
    preco: "45",
    local: "Sítio Raízes",
    duracao: "2 horas",
    fotos: [photo()],
};

beforeEach(() => {
    localStorage.clear();
    fetchMock.mockReset();
    localStorage.setItem("cafuringa-role", "producer");
    localStorage.setItem("cafuringa-token", "demo-token");
    localStorage.setItem("cafuringa-user-id", "demo-producer");
    localStorage.setItem("cafuringa-name", "Horta da Joana");
});

describe("vídeo do YouTube no cadastro (demonstração)", () => {
    it("produto guarda só o id do vídeo, como a API", async () => {
        const saved = await registerProduct({
            ...product,
            videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s",
        });

        expect(saved.videoId).toBe("dQw4w9WgXcQ");
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("experiência guarda só o id do vídeo, como a API", async () => {
        const saved = await registerExperience({
            ...experience,
            videoUrl: "https://youtu.be/dQw4w9WgXcQ",
        });

        expect(saved.videoId).toBe("dQw4w9WgXcQ");
    });

    it("sem link, a oferta fica sem vídeo", async () => {
        expect((await registerProduct(product)).videoId).toBeNull();
        expect((await registerExperience(experience)).videoId).toBeNull();
    });
});
