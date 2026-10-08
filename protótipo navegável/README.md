# Protótipo navegável — Rede Cafuringa

## O que é

Aplicação demonstrativa do MVP mobile da Rede Cafuringa, implementada em React. O código cobre os percursos principais de consumidor, produtor e administrador: autenticação demo, cadastro, descoberta de produtos e experiências, pré-reserva, resposta do produtor, cancelamento, notificações, gestão de ofertas e consulta administrativa.

É um protótipo local de apresentação e validação de fluxos, não uma aplicação de produção.

## Fontes de referência

- **Implementação executável:** [`react/src/`](./react/src/).
- **Prompt de implementação:** `C:\Users\italo\Downloads\PROMPT_cafuringa_react.md`.
- **Figma atual:** [Rede Cafuringa • MVP mobile](https://www.figma.com/design/oBDkQHMsaFJiU97kxFL58w/Rede-Cafuringa-%25E2%2580%25A2-MVP-mobile?node-id=0-1), arquivo `oBDkQHMsaFJiU97kxFL58w`, canvas `0:1`.
- [`DESIGN.md`](./DESIGN.md) registra os tokens e padrões efetivamente presentes no CSS.

O prompt e o Figma orientam o produto; quando houver dúvida sobre o comportamento disponível, prevalece o código executado.

## Stack e execução

- React `18.3.1` + React DOM;
- Vite `5.4.8`;
- `react-router-dom` `6.28.0` com `BrowserRouter`;
- JavaScript/JSX e CSS global em `src/styles.css` (não TypeScript, CSS Modules ou Tailwind);
- ESLint 9;
- testes Node.js sem framework, em `tests/flow-model.test.mjs`.

```bash
cd "protótipo navegável/react"
npm install
npm run dev
npm run lint
npm run test
npm run build
```

`npm run build` gera `react/dist/`. O script `npm run preview` também existe para servir o build localmente.

## Rotas implementadas

Todas as rotas são renderizadas dentro do `Shell`, que fornece cabeçalho, área rolável, voltar e tabbar quando aplicável.

| Área | Rotas |
|---|---|
| Entrada | `/`, `/entrar`, `/admin`, `/login/:role` |
| Cadastro e recuperação | `/cadastro/consumidor`, `/cadastro/produtor`, `/cadastro/produtor/trajetoria`, `/conta-criada/:role`, `/recuperar`, `/recuperar/enviado`, `/nova-senha` |
| Descoberta | `/resultados?q=`, `/catalogo/produtos`, `/catalogo/experiencias`, `/produtor/:id`, `/produtor/:id/catalogo`, `/oferta/:id` |
| Consumidor | `/reservar/:offerId`, `/reserva-enviada/:id`, `/pre-reservas`, `/pre-reservas/:id`, `/pre-reservas/:id/cancelar`, `/pre-reservas/:id/cancelada`, `/notificacoes`, `/conta` |
| Produtor | `/painel/ofertas`, `/painel/notificacoes`, `/painel/notificacoes/:id`, `/painel/notificacoes/:id/recusar`, `/painel/resposta-enviada`, `/painel/adicionar`, `/painel/adicionar/produto`, `/painel/adicionar/experiencia`, `/painel/oferta-publicada/:id`, `/painel/conta` |
| Admin | `/admin/usuarios`, `/admin/usuarios/:id` |

Os estados pendente, aceito, recusado e cancelado são variações de telas/rotas de detalhe; não são 45 páginas independentes. A implementação navega pelos estados previstos no prompt, mas não deve ser descrita como um produto com 45 telas autônomas.

## Perfis demo e contas seed

Na tela de login, os campos são preenchidos com uma conta demo, mas a entrada valida de fato perfil, e-mail e senha contra o estado em memória.

| Perfil | E-mail | Senha | Nome |
|---|---|---|---|
| Consumidor | `gabriela@exemplo.com` | `12345678` | Gabriela Pereira da Silva |
| Consumidor | `ana@exemplo.com` | `12345678` | Ana Oliveira |
| Consumidor | `carlos@exemplo.com` | `12345678` | Carlos de Andrade |
| Consumidor | `maria@exemplo.com` | `10203040` | Maria Das Graças Bezerra |
| Consumidor | `francisco@exemplo.com` | `10203040` | Francisco Pereira dos Santos |
| Produtor | `raizes@exemplo.com` | `12345678` | Maria Silva / Sítio Raízes |
| Produtor | `olga@exemplo.com` | `12345678` | Olga Ferreira / Ervas da Olga |
| Produtor | `francisco.lima@exemplo.com` | `12345678` | Francisco Lima / Queijaria Serra Azul |
| Produtor | `raizes2@exemplo.com` | `10203040` | Ana Júlia / Sítio Raízes |
| Produtor | `joao@exemplo.com` | `10203040` | João Emanual da Costa / Horta do João |
| Admin | `admin@exemplo.com` | `12345678` | Admin |

As ofertas seed são Mel do Cerrado, Cesta da estação, Pomada de Ervas Medicinais, Sabores e caminhos do Cerrado, Visita e Degustação de Queijos, Manhã de agroecologia e Visita Ecológica Guiada. Há quatro pré-reservas seed (`CAF-0121` a `CAF-0124`) com estados pendente, aceito e recusado.

## Fluxos e regras observáveis

- **Consumidor:** explorar, buscar, filtrar catálogos, abrir oferta/perfil, solicitar pré-reserva, acompanhar notificações, cancelar e visualizar mensagens/status.
- **Produtor:** consultar suas ofertas, receber pré-reservas, aceitar ou recusar com mensagem, cadastrar produto/experiência, visualizar a oferta publicada e editar dados básicos da conta.
- **Admin:** entrar pelo acesso administrativo, buscar usuários não-admin, abrir detalhes somente leitura e sair do painel.
- O estado é compartilhado entre os perfis durante a sessão: uma nova pré-reserva aparece no painel do produtor e a resposta altera a visão do consumidor.
- `Require` redireciona visitantes para `/entrar` e impede acesso por perfil incompatível, exibindo toast.
- A tabbar do consumidor/visitante tem Explorar, Notificações, Pré-reservas e Conta. A do produtor tem Início, Notificações, Adicionar e Conta. Ela não aparece nas rotas de autenticação/cadastro/recuperação nem no admin.
- O header mostra Entrar para visitante na raiz e o primeiro nome para usuário logado. A moldura oferece `← Voltar` fora das raízes e telas de autenticação.
- A área de conta oferece o controle acessível de aparência (Claro/Escuro), com `role="switch"`, teclado/toque e atualização global imediata.

## Estado, persistência e limitações

Usuários, ofertas, pré-reservas, usuário logado e toast vivem em `useReducer`/estado React inicializado no carregamento. Não há API, backend, `fetch`, `localStorage`, banco, persistência remota ou sincronização entre abas/dispositivos. Recarregar a página restaura os seeds e perde cadastros, ofertas, respostas e login criados na sessão.

O tema também vive somente em memória. Na primeira renderização, usa `prefers-color-scheme` como valor inicial quando disponível; depois de uma escolha manual, a seleção permanece durante a sessão e atravessa rotas sem alterar login, rota ou dados de formulário.

WhatsApp, e-mail, recuperação e pagamento são simulações; não há upload real de fotos, disponibilidade real, cobrança, Pix, mapa, autenticação real ou gestão administrativa completa. Alguns feedbacks usam `alert()` nativo em vez de mensagens inline, e alguns caminhos usam `location.href`/`history.back`, o que pode recarregar a aplicação e apagar o estado em memória. O helper isolado `transitionReservation` em `flow-model.js` retorna `rejected` para o evento `reject`, enquanto o estado usado pelos componentes é `refused`; isso é uma inconsistência coberta pelo teste atual e um risco para futuras reutilizações do helper.

## Responsividade e acessibilidade

O layout é mobile first, com mínimo de 320px, conteúdo rolável apenas no `main`, safe area, alvos de pelo menos 44px e moldura centralizada de até 390px a partir de 500px. Há labels associados, elementos semânticos, foco visível, `lang="pt-BR"`, título do documento, `role="alert"` em erros React e suporte a `prefers-reduced-motion`. Isso não é certificação WCAG; contraste, leitor de tela, zoom e todos os estados ainda precisam de validação dedicada.

## Relação com o Figma e validação visual

As telas e a nomenclatura seguem o arquivo Figma atual indicado nas fontes de referência. A relação é de referência de produto e layout, não de Code Connect. A validação visual completa — screenshots comparativos, tipografia, espaçamento, dimensões e todos os estados — pode depender do acesso ao Figma MCP. Não se deve declarar paridade visual completa sem essa inspeção.
