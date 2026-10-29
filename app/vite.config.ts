import { defineConfig } from "vitest/config";
import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
    resolve: {
        alias: {
            "@": fileURLToPath(new URL("./src", import.meta.url)),
        },
    },
    test: {
        environment: "jsdom",
        include: ["tests/**/*.test.{ts,tsx}"],
        // Testes herméticos: ignoram .env.local (que o ./scripts/dev.sh setup cria
        // com o login falso ligado). Cada teste que precisa de outro valor usa vi.stubEnv.
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
                name: "Meu App",
                short_name: "MeuApp",
                lang: "pt-BR",
                start_url: "/",
                display: "standalone",
                background_color: "#ffffff",
                theme_color: "#0f172a",
                icons: [
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
                        src: "pwa-512x512.png",
                        sizes: "512x512",
                        type: "image/png",
                        purpose: "maskable",
                    },
                ],
            },
        }),
    ],
});
