# Design implementado — Protótipo navegável Cafuringa

**Status:** documentação dos tokens e regras realmente implementados em `react/src/styles.css`.

## Referências

- Figma atual: [Rede Cafuringa • MVP mobile](https://www.figma.com/design/oBDkQHMsaFJiU97kxFL58w/Rede-Cafuringa-%25E2%2580%25A2-MVP-mobile?node-id=0-1), arquivo `oBDkQHMsaFJiU97kxFL58w`, canvas `0:1`.
- Implementação: [`react/src/main.jsx`](./react/src/main.jsx) e [`react/src/styles.css`](./react/src/styles.css).
- Prompt usado na execução: `C:\Users\italo\Downloads\PROMPT_cafuringa_react.md`.

O Figma continua sendo a referência visual atual. Este arquivo não transforma intenções do contrato antigo em regras: registra somente o que o CSS e os componentes atuais fornecem. Uma validação visual completa pode depender do acesso ao Figma MCP.

## Tokens CSS

Os valores abaixo estão declarados em `:root` e sobrescritos para o tema escuro por `[data-theme="dark"]` (ou pela preferência do sistema antes de uma escolha manual):

| Token | Valor | Uso observado |
|---|---|---|
| `--color-app-bg` | `#faf8f3` | fundo da aplicação |
| `--color-surface` | `#fff` | cards, campos e superfícies |
| `--color-text` / `--color-text-secondary` | `#2b2620` / `#6d655b` | texto principal e auxiliar |
| `--color-primary` | `#e87518` | marca, títulos, links e ação primária |
| `--color-border` | `#e3ddd2` | bordas e divisórias |
| `--color-warning-surface` / `--color-warning` | `#fff0a8` / `#765500` | avisos |
| `--color-danger` / `--color-success` | `#a83232` / `#188f35` | estados destrutivos e de sucesso |
| `--color-external-bg` | `#e6e4df` | área externa à moldura em telas maiores |
| `--color-focus` / `--color-overlay` | foco e sobreposição | foco visível e toast |

O CSS também define `font-family: "DM Sans", system-ui, sans-serif`, mas não importa a fonte do Google; na prática, a fonte depende de ela estar disponível localmente e cai para `system-ui`.

## Tema escuro

`@media (prefers-color-scheme: dark)` e `[data-theme="dark"]` substituem os tokens semânticos por uma paleta escura de alto contraste. A preferência do sistema só é usada na inicialização; o controle de aparência da tela de conta define a escolha manual em memória. Não há `localStorage` ou backend.

O controle alterna `data-theme` no elemento raiz e não desmonta o app, preservando rota, sessão e formulários.

## Tipografia e forma

- `h1`: 20px, line-height 1.25, laranja por padrão; títulos de detalhe/status podem usar `--text`.
- `h2`: 16px.
- Corpo: 14px, line-height 1.4.
- Texto auxiliar: 13px e `--muted`; header usa 11px.
- Marca: 16px, laranja e bold.
- Inputs, botões e avisos usam raio de 8px; cards usam raio de 10px; a moldura desktop usa raio de 28px.
- Bordas usam 1px `--line` quando definidas; os cards não recebem sombra.
- Placeholders de imagem são blocos com gradiente `#f6c76a` → `#7aa35a` e emoji centralizado; não há imagens externas.

## Componentes e estados visuais

- `Shell`: header, botão de voltar, `main` rolável, tabbar e toast.
- `Page`: largura máxima de 358px, centralizada dentro do app.
- `Button`: largura total, padding vertical de 11px, bold; variantes `outline`, `success` e `danger`; disabled usa opacidade reduzida.
- `Field`: label com asterisco por padrão e `input`, `textarea` ou `select`; pode ser somente leitura.
- `Search`: campo e botão de busca com emoji.
- `Card`: kicker de PRODUTO/EXPERIÊNCIA, nome, produtor/preço, placeholder e link “Conhecer →”.
- `Status`: ícone circular e título para sucesso, pendência, aceitação, recusa ou cancelamento.
- `notice`, `error`, `status` e `toast` comunicam estados sem depender somente de navegação. Toast é escuro, com texto branco, e desaparece após aproximadamente 2,2s.

## Layout responsivo

O app ocupa `100%` da viewport e `100dvh` em telas de 320px a 499px. O header tem 52px; o `main` é o único elemento com rolagem; a tabbar fica no rodapé. Há `env(safe-area-inset-top)` no shell. A partir de 500px, o body centraliza uma moldura de até 390px, com altura `min(844px, 96dvh)`, raio 28px e sombra `0 12px 40px rgba(0,0,0,.25)`.

Elementos interativos têm altura mínima de 44px. O foco visível usa `outline: 2px solid var(--orange)` com offset de 2px. `prefers-reduced-motion: reduce` remove transições e rolagem suave.

## Navegação visual

A tabbar do consumidor/visitante exibe Explorar, Notificações, Pré-reservas e Conta. A do produtor exibe Início, Notificações, Adicionar e Conta. A aba ativa usa laranja; as demais usam `--muted`. A barra é escondida nas telas de autenticação, cadastro, recuperação e administração.

## Limites conhecidos

- Não há paridade visual validada por screenshot nesta documentação.
- O Figma atual pode exigir acesso ao Figma MCP para confirmar medidas, fonte disponível, estados e comparação tela a tela.
- Não há biblioteca de ícones: a interface usa emojis e glifos.
- O código usa CSS global e JavaScript/JSX; não há design system publicado, variáveis Figma sincronizadas ou componentes Code Connect.
