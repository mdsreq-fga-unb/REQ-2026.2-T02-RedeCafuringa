import type { SwaggerCustomOptions } from '@nestjs/swagger';

/**
 * Aparência e comportamento do Swagger UI (só fora de produção, ou atrás de
 * basic auth no Caddy). Não altera o contrato: o shared/openapi.json não muda
 * por causa daqui.
 *
 * Mesmo tema do site de documentação (docs/stylesheets/extra.css, paleta
 * "nativo"): laranja do cabeçalho, canela nos destaques, fundo marfim, Lora nos
 * títulos e Inter no texto, nos temas claro e escuro. Se a paleta do site
 * mudar, atualize os tokens abaixo junto.
 *
 * Contraste: texto claro só sobre a canela (#B85C2E, ≥ 4,5:1); sobre o laranja
 * vai o texto escuro, como no modo escuro do site.
 */
const CUSTOM_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Lora:wght@600;700&family=Inter:wght@400;500;600;700&display=swap');

:root {
  --nativo-black: #2B2118;
  --nativo-evergreen: #D97732;
  --nativo-sage: #E9B949;
  --nativo-cream: #FFF8ED;
  --nativo-cinnamon: #B85C2E;
  --nativo-ivory: #FFFCF7;
  --nativo-success: #6F8F4E;
  --nativo-font-heading: 'Lora', Georgia, serif;
  --nativo-font-body: 'Inter', system-ui, sans-serif;

  --sw-bg: var(--nativo-ivory);
  --sw-card: #ffffff;
  --sw-line: #F0E2CC;
  --sw-text: var(--nativo-black);
  --sw-muted: #6b5848;
  --sw-code-bg: #F7E4C5;
  --sw-link: var(--nativo-cinnamon);
  --sw-button: var(--nativo-cinnamon);
  --sw-button-text: var(--nativo-ivory);
}

html.dark-mode {
  --sw-bg: #241B14;
  --sw-card: #2D2118;
  --sw-line: #3E2F23;
  --sw-text: #e8ddd0;
  --sw-muted: #b9a896;
  --sw-code-bg: #33251A;
  --sw-link: #F0A365;
  --sw-button: var(--nativo-evergreen);
  --sw-button-text: var(--nativo-black);
}

/* Cabeçalho igual ao do site: barra laranja com o nome em Lora. Some o logo
   e o campo de URL do Swagger; fica a lâmpada que alterna claro/escuro. */
.swagger-ui .topbar,
html.dark-mode .swagger-ui .topbar {
  padding: 12px 0;
  background: var(--nativo-evergreen);
  box-shadow: 0 2px 12px rgba(4, 50, 34, 0.35);
}
.swagger-ui .topbar .topbar-wrapper { align-items: center; }
.swagger-ui .topbar .topbar-wrapper > .link,
.swagger-ui .topbar .download-url-wrapper { display: none; }
.swagger-ui .topbar .topbar-wrapper::before {
  content: 'Rede Cafuringa  ·  Documentação da API';
  flex: 1;
  color: var(--nativo-cream);
  font-family: var(--nativo-font-heading);
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 0.03em;
  white-space: pre;
}
.swagger-ui .topbar .dark-mode-toggle button svg { fill: var(--nativo-cream); }

body { background: var(--sw-bg); }
.swagger-ui,
.swagger-ui .opblock .opblock-summary-description,
.swagger-ui .renderedMarkdown p,
.swagger-ui .renderedMarkdown li,
.swagger-ui table thead tr th,
.swagger-ui table thead tr td,
.swagger-ui .btn,
.swagger-ui select,
.swagger-ui input {
  font-family: var(--nativo-font-body);
}
.swagger-ui .info .title,
.swagger-ui .opblock-tag,
.swagger-ui .info .renderedMarkdown h3,
.swagger-ui section.models h4 {
  font-family: var(--nativo-font-heading);
}
.swagger-ui .wrapper { max-width: 1180px; padding: 0 24px; }

/* Cartão de apresentação. */
.swagger-ui .information-container { padding: 0; }
.swagger-ui .info {
  margin: 32px 0 24px;
  padding: 28px 32px;
  background: var(--sw-card);
  border: 1px solid var(--sw-line);
  border-top: 6px solid var(--nativo-evergreen);
  border-radius: 14px;
  box-shadow: 0 1px 3px rgba(43, 33, 24, 0.06);
}
.swagger-ui .info .title { color: var(--sw-text); font-size: 34px; font-weight: 700; }
.swagger-ui .info .title small { background: var(--nativo-black); border-radius: 999px; padding: 3px 10px; }
html.dark-mode .swagger-ui .info .title small {
  background: var(--nativo-black);
}
.swagger-ui .info .title small.version-stamp,
html.dark-mode .swagger-ui .info .title small.version-stamp { background: var(--nativo-cinnamon); }
.swagger-ui .info .title small pre { color: var(--nativo-ivory); font-family: var(--nativo-font-body); font-weight: 600; }
.swagger-ui .info .renderedMarkdown h3 {
  margin: 26px 0 10px;
  padding-bottom: 6px;
  color: var(--sw-text);
  font-size: 19px;
  border-bottom: 2px solid var(--sw-line);
}
.swagger-ui .info .renderedMarkdown p,
.swagger-ui .info .renderedMarkdown li { color: var(--sw-text); font-size: 14.5px; line-height: 1.7; }
.swagger-ui .info .renderedMarkdown ol { padding-left: 22px; }
.swagger-ui .info .renderedMarkdown table { width: 100%; border-collapse: collapse; margin: 8px 0 4px; font-size: 14px; }
.swagger-ui .info .renderedMarkdown table th,
.swagger-ui .info .renderedMarkdown table td {
  padding: 8px 12px;
  border-bottom: 1px solid var(--sw-line);
  color: var(--sw-text);
  text-align: left;
  vertical-align: top;
}
.swagger-ui .info .renderedMarkdown table th { background: var(--sw-bg); font-weight: 700; }
.swagger-ui .info .renderedMarkdown table td:first-child,
.swagger-ui .info .renderedMarkdown table th:first-child { width: 1%; white-space: nowrap; }
.swagger-ui .info .renderedMarkdown code,
html.dark-mode .swagger-ui .info .renderedMarkdown code {
  padding: 1px 6px;
  border-radius: 6px;
  background: var(--sw-code-bg);
  color: var(--sw-text);
  font-size: 13px;
}
.swagger-ui .info a,
.swagger-ui .info .renderedMarkdown a { color: var(--sw-link); }

/* Servidor, busca e autorização. */
.swagger-ui .scheme-container {
  max-width: 1132px;
  margin: 0 auto 24px;
  padding: 16px 24px;
  background: var(--sw-card);
  border: 1px solid var(--sw-line);
  border-radius: 14px;
  box-shadow: none;
}
.swagger-ui .scheme-container .servers-title,
.swagger-ui .scheme-container label { color: var(--sw-text); }
.swagger-ui .btn.authorize,
.swagger-ui .btn.execute {
  color: var(--sw-button-text);
  background: var(--sw-button);
  border-color: var(--sw-button);
}
.swagger-ui .btn.authorize { border-radius: 999px; padding: 8px 20px; }
.swagger-ui .btn.authorize span { color: var(--sw-button-text); }
.swagger-ui .btn.authorize svg { fill: var(--sw-button-text); }
.swagger-ui .btn.try-out__btn { border-radius: 999px; }
.swagger-ui .filter-container .operation-filter-input {
  margin: 0 0 16px;
  padding: 10px 14px;
  border: 1px solid var(--sw-line);
  border-radius: 10px;
  background: var(--sw-card);
  color: var(--sw-text);
}

/* Grupos (tags) como seções. */
.swagger-ui .opblock-tag-section { margin-bottom: 18px; }
.swagger-ui .opblock-tag {
  padding: 14px 4px;
  color: var(--sw-text);
  font-size: 22px;
  font-weight: 700;
  border-bottom: 2px solid var(--sw-line);
}
.swagger-ui .opblock-tag:hover { background: transparent; border-bottom-color: var(--nativo-evergreen); }
.swagger-ui .opblock-tag small {
  margin-left: 14px;
  color: var(--sw-muted);
  font-family: var(--nativo-font-body);
  font-size: 14px;
  font-weight: 400;
}

/* Operações: cartões arredondados; cores dos métodos mantidas para leitura rápida. */
.swagger-ui .opblock { margin: 0 0 10px; border-radius: 10px; box-shadow: none; overflow: hidden; }
.swagger-ui .opblock .opblock-summary { padding: 8px 12px; }
.swagger-ui .opblock .opblock-summary-method { min-width: 72px; border-radius: 6px; font-weight: 700; }
.swagger-ui .opblock .opblock-summary-path { font-weight: 600; }
.swagger-ui .opblock .opblock-summary-description { color: var(--sw-text); font-weight: 500; }
.swagger-ui .opblock-description-wrapper p { font-size: 14px; line-height: 1.6; }

/* Modelos (schemas) no fim, recolhidos. */
.swagger-ui section.models { border-radius: 14px; border-color: var(--sw-line); background: var(--sw-card); }
.swagger-ui section.models h4 { color: var(--sw-text); }
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
