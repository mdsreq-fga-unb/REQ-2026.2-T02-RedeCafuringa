# Como contribuir

## 1. Fluxo de contribuição

A branch `dev` é o tronco de integração do projeto. Todas as alterações devem entrar nela por meio de **pull requests (PRs)**. Não é permitido realizar commits diretamente nas branches `dev` ou `main`, conforme as regras de proteção configuradas no repositório.

### 1.1. Criando uma branch e trabalhando

Na raiz do repositório, execute:

```bash
./scripts/dev.sh branch feat/cadastro-produtor   # Cria uma branch a partir de origin/dev
# ... desenvolva e faça os commits ...
./scripts/dev.sh check                           # Executa as mesmas verificações do CI
git push -u origin feat/cadastro-produtor        # Publica a branch para abertura do PR
```

### 1.2. Etapas obrigatórias

1. **Crie uma branch curta.** A branch deve partir de `dev` e seguir o formato `tipo/descricao`, utilizando letras minúsculas.

   Tipos permitidos:

   - `feat`: nova funcionalidade;
   - `fix`: correção de defeito;
   - `docs`: documentação;
   - `chore`: tarefas de manutenção;
   - `refactor`: refatoração;
   - `test`: testes;
   - `ci`: integração contínua;
   - `style`: ajustes de estilo;
   - `perf`: melhorias de desempenho.

2. **Faça commits pequenos e atômicos.** Cada commit deve tratar de um único assunto. Adicione os arquivos explicitamente, evitando comandos genéricos como `git add -A`.

   As mensagens devem seguir o padrão Conventional Commits, em português:

   ```text
   <tipo>(escopo): descrição
   ```

3. **Abra um PR direcionado à branch `dev`.** O título deve seguir o mesmo padrão dos commits.

   O GitHub preenche automaticamente a descrição com o modelo do repositório. Todas as seções devem ser preenchidas conforme o [Padrão de Pull Request](pull-requests.md), incluindo:

   - O que mudou e por quê;
   - Critérios de aceitação;
   - Como a alteração foi verificada;
   - Guia de teste manual;
   - Riscos;
   - Itens que ficaram fora do escopo.

4. **Aguarde todos os checks obrigatórios.** O GitHub **bloqueia o merge** enquanto os 7 checks obrigatórios não forem aprovados.

   A integração deve utilizar **merge commit**, preservando os commits individuais e a autoria da equipe. Após o merge, a branch de trabalho é excluída automaticamente.

5. **Integre `dev` em `main` por PR.** A branch `main` recebe as alterações de `dev` quando houver uma entrega.

---

## 2. Checks do PR

Os pull requests direcionados às branches `dev` e `main` passam pelas seguintes verificações:

| Check | O que executa |
|---|---|
| `docs-build` | Build da documentação com `mkdocs build`. |
| `backend` | Lint, formatação, verificação de tipos, build, validação do contrato OpenAPI e da referência da API, auditoria de dependências, testes, testes E2E, build da imagem e Hadolint. |
| `frontend` | Validação dos tipos do contrato, lint, formatação, verificação de tipos, build, testes com cobertura mínima e auditoria de dependências. |
| `docker-build (api)` e `docker-build (app)` | Build das imagens, análise Trivy para vulnerabilidades HIGH/CRITICAL e smoke test do app. |
| `actionlint` e `shellcheck` | Validação dos workflows do GitHub Actions e dos scripts shell. |

### 2.1. Atualização do contrato da API

Sempre que um endpoint for alterado, execute:

```bash
./scripts/dev.sh contract
```

Faça commit dos arquivos gerados junto com as alterações. O CI reprova o PR caso os arquivos do contrato estejam ausentes ou desatualizados.

Consulte os detalhes em [Contrato da API](shared/contratos.md).

---

## 3. Regras de qualidade

Todo código enviado ao repositório deve respeitar as seguintes regras:

- **Segredos:** nenhum segredo deve ser versionado. Variáveis com prefixo `VITE_` são públicas. O arquivo `.env` real nunca deve ser enviado ao repositório; somente o `.env.example` deve ser versionado.
- **Testes:** todo código novo deve vir acompanhado de testes. A cobertura do frontend possui um percentual mínimo por métrica, que não deve ser reduzido para permitir a aprovação de um PR.
- **Acessibilidade:** a interface deve atender ao padrão WCAG 2.1 AA. Utilize os tokens de cor definidos no app:
  - `--orange-text` para textos em laranja;
  - `--ink` sobre fundos laranja ou verdes.
- **Proteção de dados pessoais (LGPD):**
  - Respostas da API nunca devem retornar hashes de senha nem CPF completo.
  - O cache offline nunca deve armazenar respostas autenticadas.
- **Scripts:** scripts Bash devem passar no `shellcheck` e funcionar no Git Bash do Windows.

---

## 4. Ambiente local

As instruções para configurar e utilizar o ambiente de desenvolvimento estão documentadas nas seguintes páginas:

- [Frontend: operação](frontend/operacao.md) — primeiros passos, variáveis de ambiente e problemas comuns do frontend.
- [Backend: operação](backend/operacao.md) — configuração, execução e operação do backend.