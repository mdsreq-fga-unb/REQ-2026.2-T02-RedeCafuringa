import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";
import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { apiCacheRule } from "./src/pwa/runtime-caching.ts";

// Cor de fundo da marca (--paper em App.css). Usada no manifesto e no <meta theme-color>.
const BRAND_COLOR = "#faf9f4";

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), "VITE_");
    const apiRule = apiCacheRule(env.VITE_API_URL ?? "");

    return {
        resolve: {
            alias: {
                "@": fileURLToPath(new URL("./src", import.meta.url)),
            },
        },
        test: {
            environment: "jsdom",
            include: ["tests/**/*.test.{ts,tsx}"],
            // Testes herméticos: ignoram o arquivo de ambiente local (que o
            // ./scripts/dev.sh setup cria com o login falso ligado). Cada teste que
            // precisa de outro valor usa vi.stubEnv.
            env: {
                VITE_API_URL: "",
                VITE_USE_MOCK_AUTH: "false",
            },
            coverage: {
                provider: "v8",
                reporter: ["text-summary", "lcov"],
                include: ["src/**/*.{ts,tsx}"],
                exclude: ["src/**/*.d.ts", "src/**/index.ts"],
                // Piso ~5 pontos abaixo da cobertura atual
                // (88,1% / 89,3% / 73,9% / 88,8%): impede regressão sem travar o time.
                // Suba aos poucos, nunca abaixe para fazer um PR passar.
                thresholds: {
                    statements: 83,
                    branches: 85,
                    functions: 68,
                    lines: 83,
                },
            },
        },
        plugins: [
            react(),
            VitePWA({
                registerType: "autoUpdate",
                manifest: {
                    id: "/",
                    name: "Rede Cafuringa",
                    short_name: "Cafuringa",
                    description:
                        "Tecnologia, agricultura familiar e preservação ambiental na APA de Cafuringa.",
                    lang: "pt-BR",
                    dir: "ltr",
                    start_url: "/",
                    scope: "/",
                    display: "standalone",
                    orientation: "portrait",
                    background_color: BRAND_COLOR,
                    theme_color: BRAND_COLOR,
                    categories: ["shopping", "lifestyle"],
                    // Gerados por `npm run pwa:icons` a partir de public/folha-logo.svg.
                    icons: [
                        {
                            src: "pwa-64x64.png",
                            sizes: "64x64",
                            type: "image/png",
                        },
                        {
                            src: "pwa-192x192.png",
                            sizes: "192x192",
                            type: "image/png",
                        },
                        {
                            src: "pwa-512x512.png",
                            sizes: "512x512",
                            type: "image/png",
                        },
                        {
                            src: "maskable-icon-512x512.png",
                            sizes: "512x512",
                            type: "image/png",
                            purpose: "maskable",
                        },
                    ],
                },
                workbox: {
                    globPatterns: [
                        "**/*.{js,css,html,ico,png,svg,woff2,webmanifest}",
                    ],
                    cleanupOutdatedCaches: true,
                    // Offline: toda navegação cai no app shell (index.html) pré-cacheado.
                    navigateFallback: "/index.html",
                    // Se a API for servida na mesma origem sob /api/, nunca devolva o
                    // index.html no lugar de uma resposta da API.
                    navigateFallbackDenylist: [/^\/api\//],
                    // Dados da API: ver src/pwa/runtime-caching.ts. Sem URL de API válida
                    // não há regra, e nada de rede é cacheado.
                    runtimeCaching: apiRule ? [apiRule] : [],
                },
            }),
        ],
    };
});
