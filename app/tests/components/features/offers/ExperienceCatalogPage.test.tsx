import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import type { ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CATALOG_PAGE_SIZE } from "@/features/offers/catalogPagination";
import { ProductCatalogPage } from "@/features/offers/ProductCatalogPage";
import type { Product } from "@/features/offers/productTypes";

afterEach(cleanup);

const experience = (index: number, extra: Partial<Product> = {}): Product => ({
    id: `exp-${index}`,
    name: `Experiência ${index}`,
    producerName: `Sítio ${index}`,
    price: 45,
    unit: "pessoa",
    image: `https://exemplo.com/${index}.webp`,
    category: "Experiências",
    local: "Cafuringa, DF",
    duracao: "2 horas",
    ...extra,
});

function renderCatalog(
    products: Product[],
    props: Partial<ComponentProps<typeof ProductCatalogPage>> = {},
) {
    const onNavigate = vi.fn();
    const view = render(
        <ProductCatalogPage
            category="Experiências"
            products={products}
            onNavigate={onNavigate}
            {...props}
        />,
    );
    return { ...view, onNavigate };
}

describe("HU24 — catálogo de experiências", () => {
    it("CA01: apresenta o catálogo com título e um card por experiência", () => {
        renderCatalog([experience(1), experience(2)]);

        expect(
            screen.getByRole("heading", {
                level: 1,
                name: "Catálogo de Experiências",
            }),
        ).toBeTruthy();
        expect(screen.getAllByRole("listitem")).toHaveLength(2);
    });

    it("CA02: cada card resume tipo, nome, responsável, valor por pessoa e foto", () => {
        const { container } = renderCatalog([
            experience(1, {
                name: "Visita e Degustação de Queijos",
                producerName: "Jefferson Sooma",
            }),
        ]);

        const card = within(screen.getByRole("listitem"));
        expect(card.getByText("Experiência")).toBeTruthy();
        expect(card.getByText("Visita e Degustação de Queijos")).toBeTruthy();
        expect(card.getByText("Jefferson Sooma")).toBeTruthy();
        expect(card.getByText("R$ 45 / pessoa")).toBeTruthy();
        expect(card.getByText(/Conhecer/)).toBeTruthy();
        expect(container.querySelector("img")?.getAttribute("src")).toBe(
            "https://exemplo.com/1.webp",
        );
    });

    it("RNF06: só a foto do primeiro card carrega de imediato; as demais sob demanda", () => {
        const { container } = renderCatalog([
            experience(1),
            experience(2),
            experience(3),
        ]);

        const images = [...container.querySelectorAll("img")];
        expect(images.map((img) => img.getAttribute("loading"))).toEqual([
            "eager",
            "lazy",
            "lazy",
        ]);
        expect(images[0].getAttribute("fetchpriority")).toBe("high");
        expect(images[1].getAttribute("fetchpriority")).toBeNull();
    });

    it("CA04: avisa que não há experiências disponíveis", () => {
        renderCatalog([]);

        expect(screen.getByRole("status").textContent).toBe(
            "Não há experiências disponíveis no momento.",
        );
        expect(screen.queryByRole("list")).toBeNull();
        expect(screen.queryByRole("searchbox")).toBeNull();
    });

    it("CA05: abrir o card leva ao detalhe da experiência", async () => {
        const { onNavigate } = renderCatalog([experience(7)]);

        await userEvent.click(
            screen.getByRole("button", { name: /Experiência 7/ }),
        );

        expect(onNavigate).toHaveBeenCalledWith(
            "/oferta/exp-7?tipo=experiencia",
        );
    });

    it("CA07: mostra o responsável e omite a linha quando ele não está disponível", () => {
        const { container } = renderCatalog([
            experience(1, { producerName: "Sítio Boa Vista" }),
            experience(2, {
                producerName: "",
                producerLocation: "Núcleo Rural",
            }),
        ]);

        const producers = container.querySelectorAll(".product-producer");
        expect(producers).toHaveLength(1);
        expect(producers[0].textContent).toBe("Sítio Boa Vista");
        expect(container.textContent).not.toContain("Núcleo Rural");
    });

    describe("CA08: navegação por partes", () => {
        const many = Array.from({ length: CATALOG_PAGE_SIZE + 3 }, (_, i) =>
            experience(i + 1),
        );

        it("mostra a primeira parte e informa quantas existem", () => {
            renderCatalog(many);

            expect(screen.getAllByRole("listitem")).toHaveLength(
                CATALOG_PAGE_SIZE,
            );
            expect(
                screen.getByText(
                    `Mostrando ${CATALOG_PAGE_SIZE} de ${many.length} experiências`,
                ),
            ).toBeTruthy();
        });

        it("carrega o restante e leva o foco à primeira experiência nova", async () => {
            renderCatalog(many);
            const user = userEvent.setup();

            await user.click(
                screen.getByRole("button", {
                    name: "Mostrar mais experiências",
                }),
            );

            expect(screen.getAllByRole("listitem")).toHaveLength(many.length);
            expect(document.activeElement).toBe(
                screen
                    .getByText(`Experiência ${CATALOG_PAGE_SIZE + 1}`)
                    .closest("button"),
            );
            expect(
                screen.queryByRole("button", {
                    name: "Mostrar mais experiências",
                }),
            ).toBeNull();
            expect(
                screen.getByText(
                    `Mostrando ${many.length} de ${many.length} experiências`,
                ),
            ).toBeTruthy();
        });

        it("a busca considera o catálogo inteiro e volta à primeira parte", async () => {
            renderCatalog(many);
            const user = userEvent.setup();

            await user.type(
                screen.getByRole("searchbox", { name: "Buscar experiências" }),
                `Experiência ${many.length}`,
            );

            const cards = screen.getAllByRole("listitem");
            expect(cards).toHaveLength(1);
            expect(
                within(cards[0]).getByText(`Experiência ${many.length}`),
            ).toBeTruthy();
            expect(
                screen.queryByRole("button", {
                    name: "Mostrar mais experiências",
                }),
            ).toBeNull();
        });

        it("não mostra paginação quando tudo cabe em uma parte", () => {
            renderCatalog([experience(1)]);

            expect(screen.queryByText(/Mostrando/)).toBeNull();
            expect(
                screen.queryByRole("button", { name: /Mostrar mais/ }),
            ).toBeNull();
        });

        it("RNF04: sem violações WCAG A/AA detectáveis com paginação", async () => {
            const { container } = renderCatalog(many);
            const result = await axe.run(container, {
                runOnly: {
                    type: "tag",
                    values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
                },
                rules: { "color-contrast": { enabled: false } },
            });
            expect(result.violations.map((item) => item.id)).toEqual([]);
        });
    });
});
