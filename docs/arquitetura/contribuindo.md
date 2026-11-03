# Como contribuir

## Fluxo

A `dev` é o tronco de integração. Tudo entra nela por **pull request**; ninguém faz commit direto na `dev` nem na `main` (o repositório bloqueia).

```bash
./scripts/dev.sh branch feat/cadastro-produtor   # cria a branch a partir de origin/dev
# ...trabalhe, commite...
./scripts/dev.sh check                           # roda os mesmos passos do CI
git push -u origin feat/cadastro-produtor        # abra o PR para a dev
```

1. **Branch curta** a partir da `dev`, no formato `<tipo>/<descricao>` em minúsculas. Tipos: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `ci`, `style`, `perf`.
2. **Commits pequenos e atômicos**, um assunto por commit, listando os arquivos (nada de `git add -A`). Mensagens no padrão Conventional Commits, em português: `<tipo>(escopo): descrição`.
3. **PR para a `dev`** com título no mesmo padrão. A descrição diz o que muda, por quê, como foi verificado e o que fica de fora.
4. **Checks verdes**: o GitHub **bloqueia o merge** enquanto os 7 checks da tabela abaixo não passarem. Integre com **merge commit**, que preserva os commits e a autoria. A branch é apagada sozinha depois do merge.
5. A `main` recebe a `dev` por PR, quando houver entrega.

## Checks do PR

| Check | O que roda |
|---|---|
| `docs-build` | `mkdocs build` |
| `backend` | lint, format, typecheck, build, **contrato OpenAPI e referência da API em dia**, audit, testes, E2E, build e hadolint da imagem |
| `frontend` | **tipos do contrato em dia**, lint, format, typecheck, build, testes com cobertura mínima, audit |
| `docker-build (api\|app)` | build das imagens, Trivy (HIGH/CRITICAL), smoke test do app |
| `actionlint`, `shellcheck` | workflows e scripts |

Mudou um endpoint? Rode `./scripts/dev.sh contract` e commite os arquivos gerados; o CI reprova se faltar. Detalhes em [Contrato da API](shared/contratos.md).

## Regras de qualidade

- Sem segredo no repositório; `VITE_*` é público. O `.env` de verdade nunca é versionado, só o `.env.example`.
- Todo código novo vem com teste. A cobertura do app tem piso por métrica; não abaixe o piso para um PR passar.
- Acessibilidade WCAG 2.1 AA: use os tokens de cor do app (`--orange-text` para texto laranja, `--ink` sobre fundo laranja ou verde).
- Dados pessoais (LGPD): respostas nunca trazem hash de senha nem CPF completo; o cache offline nunca guarda resposta autenticada.
- Scripts em Bash precisam passar no `shellcheck` e funcionar no Git Bash do Windows.

## Ambiente local

Primeiros passos, variáveis e problemas comuns: [Frontend: operação](frontend/operacao.md) e [Backend: operação](backend/operacao.md).
