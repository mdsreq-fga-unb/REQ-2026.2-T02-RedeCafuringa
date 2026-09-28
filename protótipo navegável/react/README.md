# Protótipo navegável React — Rede Cafuringa

Implementação demonstrativa do fluxo expandido **Território Vivo**, sem backend e sem integração financeira real.

## Executar localmente

Requisitos: Node.js 18+ e npm.

```bash
npm install
npm run dev
```

Abra a URL exibida pelo Vite (normalmente `http://localhost:5173`). Para validar a build:

```bash
npm run build
```

## Rotas de demonstração

A navegação usa hash e pode ser acessada diretamente:

- `#home` — landing page
- `#about` — missão e contexto da Rede Cafuringa
- `#how` — como funciona: descoberta até feedback
- `#explore` — busca, filtros, lista e mapa
- `#explore?kind=produto` — catálogo filtrado de produtos
- `#experiences` / `#experiences?kind=experiencia` — curadoria de experiências
- `#experiences?kind=workshop` — workshops filtrados
- `#detail-trilha`, `#detail-pousada`, `#detail-workshop`, `#detail-cesta` — detalhes por tipo
- `#reserve-trilha`, `#reserve-pousada`, `#reserve-workshop` — pré-reserva parametrizada + Pix simulado
- `#producer-profile-veredas`, `#producer-profile-ipe`, `#producer-profile-raizes`, `#producer-profile-cerrado` — perfis dos anfitriões
- `#contact-veredas` — contato demonstrativo com anfitrião
- `#assistant` — assistente determinístico de descoberta
- `#account`, `#requests`, `#notifications`, `#feedback` — conta, solicitações, avisos e feedback privado
- `#producer`, `#producer-request`, `#new-experience` — área do produtor, solicitação e cadastro com assistente mockado
- `#admin` — painel administrativo demonstrativo
- `#login`, `#forgot-password` — acesso e recuperação simulados
- Qualquer hash não reconhecido — tela 404 com links para início e exploração

## Decisões de protótipo

- Tokens são reutilizados diretamente de `../assets/design-tokens.css`.
- Ícones são SVG inline acessíveis; não há emojis estruturais.
- Leaflet + OpenStreetMap é usado no mapa. Se os tiles falharem, o mapa mantém uma camada visual de fallback e pins aproximados.
- Localização exata, disponibilidade confirmada, certificações e valores não são inventados.
- Pix, respostas do anfitrião e estados de conta são simulados localmente.
- Os arquivos do protótipo standalone não são modificados pela versão React; os tokens compartilhados ficam em `protótipo navegável/assets/`.
