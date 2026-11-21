import { useEffect, useRef, useState } from "react";

/**
 * HU24 CA08: quantos cards o catálogo mostra de cada vez. Doze cabem em
 * poucas rolagens no celular e formam linhas completas de 1, 2, 3 ou 4
 * colunas nas telas maiores.
 */
export const CATALOG_PAGE_SIZE = 12;

/**
 * Mostra a lista em partes ("Mostrar mais"), sem perder o lugar de quem
 * navega: ao revelar a próxima parte, o foco vai para o primeiro card novo
 * (teclado e leitor de tela, RNF04). Quando `resetKey` muda (nova busca),
 * volta para a primeira parte.
 */
export function useCatalogPages<T>(items: T[], resetKey: string) {
    const [shown, setShown] = useState(CATALOG_PAGE_SIZE);
    const [lastKey, setLastKey] = useState(resetKey);
    const firstNew = useRef<number | null>(null);
    const list = useRef<HTMLUListElement>(null);

    if (lastKey !== resetKey) {
        setLastKey(resetKey);
        setShown(CATALOG_PAGE_SIZE);
    }

    useEffect(() => {
        if (firstNew.current === null) return;
        const target =
            list.current?.querySelectorAll<HTMLElement>(":scope > li button")[
                firstNew.current
            ];
        firstNew.current = null;
        target?.focus();
    }, [shown]);

    const visible = items.slice(0, shown);
    return {
        visible,
        total: items.length,
        hasMore: items.length > visible.length,
        listRef: list,
        showMore: () => {
            firstNew.current = visible.length;
            setShown((current) => current + CATALOG_PAGE_SIZE);
        },
    };
}
