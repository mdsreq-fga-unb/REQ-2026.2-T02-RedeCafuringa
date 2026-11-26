import {
    act,
    cleanup,
    fireEvent,
    render,
    screen,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RuralCarousel } from "@/features/profile/RuralCarousel";

afterEach(() => {
    cleanup();
    vi.useRealTimers();
});

const MORRO =
    "Casa no alto de um morro coberto de Cerrado, com bananeira em primeiro plano";
const CHALE_FRENTE =
    "Chalé de tijolos com varanda de madeira e portas de vidro abertas, entre árvores do Cerrado";
const ESTRADA = "Estrada de terra vermelha cercada de árvores";
const CHAPADA = "Chapada vista da rodovia, com vegetação de Cerrado";
const CHALE_SOL =
    "Chalé de tijolos com varanda e rede, sob céu azul com raio de sol";
const SERRA = "Serra vista da estrada, com mata e capim seco";

describe("carrossel rural", () => {
    it("oferece navegação circular com botões e indicadores acessíveis", async () => {
        const user = userEvent.setup();
        render(<RuralCarousel />);
        expect(screen.getByRole("img", { name: MORRO })).toBeTruthy();
        await user.click(
            screen.getByRole("button", { name: "Próxima imagem" }),
        );
        expect(screen.getByRole("img", { name: CHALE_FRENTE })).toBeTruthy();
        expect(
            screen
                .getByRole("button", { name: "Ir para imagem 2" })
                .getAttribute("aria-current"),
        ).toBe("true");
        await user.click(
            screen.getByRole("button", { name: "Ir para imagem 6" }),
        );
        await user.click(
            screen.getByRole("button", { name: "Próxima imagem" }),
        );
        expect(screen.getByRole("img", { name: MORRO })).toBeTruthy();
        await user.click(
            screen.getByRole("button", { name: "Imagem anterior" }),
        );
        expect(screen.getByRole("img", { name: SERRA })).toBeTruthy();
    });

    it("responde às setas do teclado e ao deslize sem bloquear rolagem vertical", () => {
        render(<RuralCarousel />);
        const carousel = screen.getByRole("region", {
            name: "Paisagens da vida rural",
        });
        fireEvent.keyDown(carousel, { key: "ArrowRight" });
        expect(screen.getByRole("img", { name: CHALE_FRENTE })).toBeTruthy();
        fireEvent.touchStart(carousel, { touches: [{ clientX: 180 }] });
        fireEvent.touchEnd(carousel, { changedTouches: [{ clientX: 80 }] });
        expect(screen.getByRole("img", { name: ESTRADA })).toBeTruthy();
        fireEvent.touchStart(carousel, { touches: [{ clientX: 100 }] });
        fireEvent.touchEnd(carousel, { changedTouches: [{ clientX: 105 }] });
        expect(screen.getByRole("img", { name: ESTRADA })).toBeTruthy();
    });

    it("avança automaticamente sem botão de pausa e suspende ao interagir", () => {
        vi.useFakeTimers();
        render(<RuralCarousel />);
        expect(
            screen.queryByRole("button", { name: /pausar|reproduzir/i }),
        ).toBeNull();
        act(() => {
            vi.advanceTimersByTime(6000);
        });
        expect(screen.getByRole("img", { name: CHALE_FRENTE })).toBeTruthy();
        const carousel = screen.getByRole("region", {
            name: "Paisagens da vida rural",
        });
        fireEvent.mouseEnter(carousel);
        act(() => {
            vi.advanceTimersByTime(12000);
        });
        expect(screen.getByRole("img", { name: CHALE_FRENTE })).toBeTruthy();
        fireEvent.mouseLeave(carousel);
        act(() => {
            vi.advanceTimersByTime(6000);
        });
        expect(screen.getByRole("img", { name: ESTRADA })).toBeTruthy();
    });
    it("mantém título e navegação disponíveis se a foto falhar", () => {
        render(<RuralCarousel />);
        fireEvent.error(screen.getByRole("img"));
        expect(screen.queryByRole("img")).toBeNull();
        expect(
            screen.getByRole("heading", { name: "Servimos à terra" }),
        ).toBeTruthy();
        fireEvent.click(screen.getByRole("button", { name: "Próxima imagem" }));
        expect(screen.getByRole("img", { name: CHALE_FRENTE })).toBeTruthy();
    });

    it("mostra as seis fotos da APA em WebP leve, sem metadados e com versão para celular", () => {
        const { container } = render(<RuralCarousel />);
        const next = screen.getByRole("button", { name: "Próxima imagem" });
        for (let step = 0; step < 5; step++) fireEvent.click(next);
        const photos = Array.from(container.querySelectorAll("img"));
        expect(photos.map((photo) => photo.alt)).toEqual([
            MORRO,
            CHALE_FRENTE,
            ESTRADA,
            CHAPADA,
            CHALE_SOL,
            SERRA,
        ]);
        for (const photo of photos) {
            const src = photo.getAttribute("src") ?? "";
            expect(src).toMatch(/^\/images\/rural\/[a-z-]+-1200\.webp$/);
            const mobile = src.replace("-1200.webp", "-640.webp");
            expect(photo.getAttribute("srcset")).toBe(
                `${mobile} 640w, ${src} 1200w`,
            );
            expect(photo.getAttribute("sizes")).toBeTruthy();
            for (const [file, maxKb] of [
                [mobile, 60],
                [src, 160],
            ] as const) {
                const bytes = readFileSync(resolve(`public${file}`));
                expect(bytes.length).toBeLessThanOrEqual(maxKb * 1024);
                expect(bytes.includes("EXIF")).toBe(false);
                expect(bytes.includes("XMP ")).toBe(false);
            }
        }
    });

    it("baixa só a foto visível e a próxima, poupando dados em conexão rural", async () => {
        const user = userEvent.setup();
        const { container } = render(<RuralCarousel />);
        const loaded = () =>
            Array.from(container.querySelectorAll("img"))
                .filter((photo) => photo.hasAttribute("src"))
                .map((photo) => photo.alt);
        expect(loaded()).toEqual([MORRO, CHALE_FRENTE]);
        expect(
            Array.from(container.querySelectorAll("img:not([src])")).every(
                (photo) => !photo.hasAttribute("srcset"),
            ),
        ).toBe(true);
        await user.click(
            screen.getByRole("button", { name: "Próxima imagem" }),
        );
        expect(loaded()).toEqual([MORRO, CHALE_FRENTE, ESTRADA]);
        await user.click(
            screen.getByRole("button", { name: "Ir para imagem 5" }),
        );
        expect(loaded()).toEqual([
            MORRO,
            CHALE_FRENTE,
            ESTRADA,
            CHALE_SOL,
            SERRA,
        ]);
    });
});
