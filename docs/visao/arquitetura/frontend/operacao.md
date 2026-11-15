# Infraestrutura - Bibliotecas

O app (`app/`) é um PWA desenvolvido em React 19 + Vite, servido em produção por nginx em uma imagem Docker. Esta página apresenta o roteiro inicial para quem está chegando ao projeto.

## 1. Primeiros passos

**Pré-requisitos:**
- Git (com Git Bash no Windows);
- Node na versão especificada no arquivo `.nvmrc`;
- Docker.

Execute os comandos abaixo na raiz do projeto:

```bash
./scripts/dev.sh setup     # Confere pré-requisitos, instala dependências e cria os arquivos de ambiente locais
./scripts/dev.sh up        # Inicia MongoDB, API e app
./scripts/dev.sh check     # Executa lint, format, typecheck, build e testes (mesmas etapas do CI)
./scripts/dev.sh help      # Exibe todos os comandos disponíveis
```

Após executar `up`, os serviços estarão disponíveis nos seguintes endereços:

- **Frontend:** [http://localhost:5173](http://localhost:5173)
- **API:** [http://localhost:3000](http://localhost:3000)

Para visualizar o frontend em condições semelhantes às de produção — com nginx, CSP e service worker — execute:

```bash
./scripts/dev.sh up --prod
```

Nesse modo, o app estará disponível na porta `8080`.

---

## 2. Variáveis de ambiente

As variáveis são definidas em `app/.env.example`. O comando `setup` copia esse arquivo para `app/.env.local`, que é ignorado pelo Git.

| Variável | Finalidade |
|---|---|
| `VITE_API_URL` | URL base da API, incluindo `/api/v1`. Quando vazia, utiliza a mesma origem. |
| `VITE_USE_MOCK_AUTH` | Quando definida como `true`, utiliza o login falso (somente em desenvolvimento). |

**Atenção:** todas as variáveis com prefixo `VITE_` são incorporadas ao bundle e ficam públicas. Nunca inclua senhas, tokens ou chaves nesses arquivos.

Valores inválidos impedem a inicialização e exibem uma mensagem na tela. Variáveis ausentes são aceitas.

---

## 3. Qualidade e validação

| Verificação | Comando ou localização |
|---|---|
| Lint, formatação (Prettier), verificação de tipos e build | `npm run lint`, `npm run format:check`, `npm run typecheck` e `npm run build`, em `app/` |
| Testes e cobertura (com piso por métrica) | `npm run test:coverage` |
| Acessibilidade WCAG 2.1 AA | `tests/a11y/` — axe nas rotas e verificação de contraste dos tokens de cor |
| Contrato da API | `npm run api:types`; consulte [Contrato da API](../shared/contratos.md). |

### 3.1. Uso de cores

- Utilize `--orange-text` (em vez de `--orange`) para textos.
- Utilize `--ink` sobre fundos laranja ou verdes.
- O teste de contraste sinaliza quando uma combinação de cores deixa de atender aos critérios de acessibilidade.

---

## 4. Imagens Docker

O workflow `Docker CI` valida as imagens em todos os pull requests, executando:

- Hadolint;
- Trivy;
- Smoke test.

Quando as alterações são integradas às branches `dev` ou `main`, o workflow publica as imagens no GitHub Container Registry (GHCR):

- `ghcr.io/mdsreq-fga-unb/rede-cafuringa-api`
- `ghcr.io/mdsreq-fga-unb/rede-cafuringa-app`

As imagens são publicadas para as arquiteturas `amd64` e `arm64`, com as seguintes tags:

| Tag | Condição |
|---|---|
| `dev` | Publicação a partir da branch `dev` |
| `sha-<curto>` | Identificador curto do commit |
| `latest` | Publicação a partir da branch `main` |
| `1.2.3` e `1.2` | Publicação de tags no padrão `v*` |

Para construir as mesmas imagens localmente, execute:

```bash
./scripts/dev.sh images
```

Para executar o smoke test:

```bash
./scripts/dev.sh smoke
```

---

## 5. Segurança e PWA

### 5.1. Content Security Policy (CSP)

A CSP é restritiva e gerada durante o build da imagem, por meio do arquivo `app/nginx/csp.ts`.

- Não utiliza `unsafe-inline` nem `unsafe-eval`.
- A diretiva `connect-src` libera somente a origem da API.
- As fotos de exemplo do Unsplash estão liberadas em `IMAGE_HOSTS`. Essa permissão deverá ser removida quando as imagens passarem a ser fornecidas pela API.

### 5.2. Fontes

As fontes são hospedadas diretamente no app por meio do `@fontsource`, sem necessidade de requisições a serviços de terceiros.

### 5.3. Cache offline

A configuração está em `src/pwa/runtime-caching.ts` e segue estas regras:

- Armazena em cache somente requisições GET públicas.
- Nunca armazena rotas `/auth/*`.
- Nunca armazena respostas de requisições que contenham o cabeçalho `Authorization`.
- Nunca armazena mutações.

### 5.4. Ícones

Para regenerar os ícones do PWA a partir do arquivo `app/public/folha-logo.svg`, execute:

```bash
npm run pwa:icons
```

---

## 6. Problemas comuns

| Sintoma | Causa e solução |
|---|---|
| `bad interpreter` em um arquivo `.sh` | Problema de fim de linha CRLF. O `.gitattributes` força LF. Execute `git add --renormalize .` para normalizar os arquivos. |
| `curl: (23) ... write` no Windows | O `curl.exe` não aceita `-o /dev/null`. Utilize o redirecionamento do próprio shell. |
| Python do Windows cria pastas em `C:\c\...` | Passe o caminho utilizando `cygpath -m`. O script `dev.sh` já realiza essa conversão. |
| Testes falham somente na sua máquina | Confira o conteúdo de `app/.env.local`. Os testes fixam as variáveis, mas scripts próprios podem não fazer isso. |
| Contrato aparece como desatualizado no CI | Execute `./scripts/dev.sh contract` e faça commit dos arquivos gerados. |

---

## 7. Fora de escopo (por enquanto)

As seguintes configurações de deploy ainda não foram implementadas:

- Deploy no Cloudflare Pages;
- Configuração de CORS para produção;
- Estratégia de rollback.