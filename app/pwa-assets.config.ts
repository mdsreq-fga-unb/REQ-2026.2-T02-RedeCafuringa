import {
    defineConfig,
    minimal2023Preset,
} from "@vite-pwa/assets-generator/config";

// Gera os ícones do PWA a partir do logo da marca: npm run pwa:icons
// Os PNGs gerados ficam versionados em public/; o build não depende desta ferramenta.
const PAPER = "#faf9f4"; // cor de fundo da marca (--paper em App.css)

export default defineConfig({
    preset: {
        ...minimal2023Preset,
        // Fundo transparente para os ícones "any".
        transparent: {
            ...minimal2023Preset.transparent,
            padding: 0.15,
        },
        // Maskable: o sistema recorta (círculo, squircle...). Todo o desenho precisa
        // caber no círculo central de raio 40% do lado, sobre fundo opaco. Medido:
        // padding 0.3 ficava fora (227 px > 205 px); 0.4 fica dentro (195 px).
        maskable: {
            ...minimal2023Preset.maskable,
            padding: 0.4,
            resizeOptions: { background: PAPER, fit: "contain" },
        },
        apple: {
            ...minimal2023Preset.apple,
            padding: 0.25,
            resizeOptions: { background: PAPER, fit: "contain" },
        },
    },
    images: ["public/folha-logo.svg"],
});
