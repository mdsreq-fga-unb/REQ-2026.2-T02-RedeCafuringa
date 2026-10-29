/// <reference types="vite/client" />

// Variáveis expostas ao app. Tudo com prefixo VITE_ vai para o bundle e é PÚBLICO:
// nunca coloque segredos aqui. Veja app/.env.example.
interface ImportMetaEnv {
    readonly VITE_API_URL?: string;
    readonly VITE_USE_MOCK_AUTH?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
