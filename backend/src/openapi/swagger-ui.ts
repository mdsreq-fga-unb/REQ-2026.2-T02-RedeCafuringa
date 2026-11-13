import type { SwaggerCustomOptions } from '@nestjs/swagger';

/**
 * Aparência e comportamento do Swagger UI (só fora de produção, ou atrás de
 * basic auth no Caddy). Não altera o contrato: o shared/openapi.json não muda
 * por causa daqui.
 *
 * Cores da marca vêm do app (app/src/App.css): tinta #1c332b, papel #faf9f4,
 * laranja de texto #b85600 (contraste AA sobre o papel). Fonte do sistema, sem
 * carregar nada de fora (a CSP do helmet continua intacta).
 */
const CUSTOM_CSS = `
:root {
  --cf-ink: #1c332b;
  --cf-paper: #faf9f4;
  --cf-orange: #ff8d28;
  --cf-orange-text: #b85600;
  --cf-line: #e4e1d6;
  --cf-muted: #55665f;
}

/* Barra superior genérica do Swagger: substituída pelo cabeçalho da descrição. */
.swagger-ui .topbar { display: none; }

body { background: var(--cf-paper); }
.swagger-ui,
.swagger-ui .info .title,
.swagger-ui .opblock-tag,
.swagger-ui .opblock .opblock-summary-description,
.swagger-ui .markdown p,
.swagger-ui .markdown li,
.swagger-ui table thead tr th,
.swagger-ui table thead tr td {
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}
.swagger-ui .wrapper { max-width: 1180px; padding: 0 24px; }

/* Cabeçalho: título, versão e descrição em um cartão. */
.swagger-ui .information-container { padding: 0; }
.swagger-ui .info {
  margin: 32px 0 24px;
  padding: 28px 32px;
  background: #fff;
  border: 1px solid var(--cf-line);
  border-top: 6px solid var(--cf-orange);
  border-radius: 14px;
  box-shadow: 0 1px 2px rgba(28, 51, 43, 0.06);
}
.swagger-ui .info .title { color: var(--cf-ink); font-size: 34px; font-weight: 800; }
.swagger-ui .info .title small { background: var(--cf-ink); border-radius: 999px; padding: 3px 10px; }
.swagger-ui .info .title small.version-stamp { background: var(--cf-orange-text); }
.swagger-ui .info .title small pre { color: #fff; font-weight: 600; }
.swagger-ui .info .renderedMarkdown h3 {
  margin: 26px 0 10px;
  padding-bottom: 6px;
  color: var(--cf-ink);
  font-size: 18px;
  border-bottom: 1px solid var(--cf-line);
}
.swagger-ui .info .renderedMarkdown p,
.swagger-ui .info .renderedMarkdown li { color: #2f403a; font-size: 14.5px; line-height: 1.6; }
.swagger-ui .info .renderedMarkdown ol { padding-left: 22px; }
.swagger-ui .info .renderedMarkdown table {
  width: 100%;
  border-collapse: collapse;
  margin: 8px 0 4px;
  font-size: 14px;
}
.swagger-ui .info .renderedMarkdown table th,
.swagger-ui .info .renderedMarkdown table td {
  padding: 8px 12px;
  border-bottom: 1px solid var(--cf-line);
  text-align: left;
  vertical-align: top;
}
.swagger-ui .info .renderedMarkdown table th { color: var(--cf-ink); background: var(--cf-paper); font-weight: 700; }
.swagger-ui .info .renderedMarkdown table td:first-child,
.swagger-ui .info .renderedMarkdown table th:first-child { width: 1%; white-space: nowrap; }
.swagger-ui .info .renderedMarkdown code {
  padding: 1px 6px;
  border-radius: 6px;
  background: #f1eee4;
  color: var(--cf-ink);
  font-size: 13px;
}
.swagger-ui .info a { color: var(--cf-orange-text); }

/* Servidor, filtro e botão de autorização. */
.swagger-ui .scheme-container {
  max-width: 1132px;
  margin: 0 auto 24px;
  padding: 16px 24px;
  background: #fff;
  border: 1px solid var(--cf-line);
  border-radius: 14px;
  box-shadow: none;
}
.swagger-ui .btn.authorize {
  color: #fff;
  background: var(--cf-ink);
  border-color: var(--cf-ink);
  border-radius: 999px;
  padding: 8px 20px;
}
.swagger-ui .btn.authorize svg { fill: #fff; }
.swagger-ui .btn.authorize span { color: #fff; }
.swagger-ui .filter-container .operation-filter-input {
  margin: 0 0 16px;
  padding: 10px 14px;
  border: 1px solid var(--cf-line);
  border-radius: 10px;
  background: #fff;
}

/* Grupos (tags) como seções. */
.swagger-ui .opblock-tag-section { margin-bottom: 18px; }
.swagger-ui .opblock-tag {
  padding: 14px 4px;
  color: var(--cf-ink);
  font-size: 22px;
  font-weight: 800;
  border-bottom: 2px solid var(--cf-line);
}
.swagger-ui .opblock-tag:hover { background: transparent; border-bottom-color: var(--cf-orange); }
.swagger-ui .opblock-tag small {
  margin-left: 14px;
  color: var(--cf-muted);
  font-size: 14px;
  font-weight: 400;
}

/* Operações: cartões arredondados, cores de método mantidas para leitura rápida. */
.swagger-ui .opblock {
  margin: 0 0 10px;
  border-radius: 10px;
  box-shadow: none;
  overflow: hidden;
}
.swagger-ui .opblock .opblock-summary { padding: 8px 12px; }
.swagger-ui .opblock .opblock-summary-method { min-width: 72px; border-radius: 6px; font-weight: 700; }
.swagger-ui .opblock .opblock-summary-path { font-weight: 600; }
.swagger-ui .opblock .opblock-summary-description { color: #2f403a; font-weight: 500; }
.swagger-ui .opblock-description-wrapper p { font-size: 14px; line-height: 1.6; }
.swagger-ui .btn.execute { background: var(--cf-ink); border-color: var(--cf-ink); }
.swagger-ui .btn.try-out__btn { border-radius: 999px; }

/* Modelos (schemas) ao fim, recolhidos. */
.swagger-ui section.models { border-radius: 14px; border-color: var(--cf-line); }
.swagger-ui section.models h4 { color: var(--cf-ink); }

/* Tema escuro do Swagger UI (botão de lâmpada). */
html.dark-mode body { background: #121a17; }
html.dark-mode .swagger-ui .info,
html.dark-mode .swagger-ui .scheme-container,
html.dark-mode .swagger-ui .filter-container .operation-filter-input {
  background: #18221e;
  border-color: #2c3a34;
}
html.dark-mode .swagger-ui .info { border-top-color: var(--cf-orange); }
html.dark-mode .swagger-ui .info .title,
html.dark-mode .swagger-ui .opblock-tag,
html.dark-mode .swagger-ui .info .renderedMarkdown h3,
html.dark-mode .swagger-ui .info .renderedMarkdown table th { color: #eef3ef; }
html.dark-mode .swagger-ui .info .renderedMarkdown p,
html.dark-mode .swagger-ui .info .renderedMarkdown li,
html.dark-mode .swagger-ui .info .renderedMarkdown table td,
html.dark-mode .swagger-ui .opblock .opblock-summary-description { color: #c9d4ce; }
html.dark-mode .swagger-ui .info .renderedMarkdown table th { background: #121a17; }
html.dark-mode .swagger-ui .info .renderedMarkdown code { background: #24322c; color: #eef3ef; }
html.dark-mode .swagger-ui .info a { color: #ffb066; }
html.dark-mode .swagger-ui .opblock-tag small { color: #9fb0a8; }
html.dark-mode .swagger-ui .btn.authorize,
html.dark-mode .swagger-ui .btn.execute { background: #ff8d28; border-color: #ff8d28; color: #1c332b; }
html.dark-mode .swagger-ui .btn.authorize svg { fill: #1c332b; }
html.dark-mode .swagger-ui .btn.authorize span { color: #1c332b; }
`;

export const SWAGGER_UI_OPTIONS: SwaggerCustomOptions = {
  customSiteTitle: 'Rede Cafuringa API · Documentação',
  customCss: CUSTOM_CSS,
  swaggerOptions: {
    // Abre com os grupos listados e as operações recolhidas: visão geral primeiro.
    docExpansion: 'list',
    // Campo de busca por grupo.
    filter: true,
    // O token sobrevive a um F5 (só neste navegador).
    persistAuthorization: true,
    displayRequestDuration: true,
    // Modelos no fim, recolhidos; exemplos à vista dentro de cada operação.
    defaultModelsExpandDepth: 0,
    defaultModelExpandDepth: 2,
    tryItOutEnabled: false,
    syntaxHighlight: { activated: true, theme: 'agate' },
  },
};
