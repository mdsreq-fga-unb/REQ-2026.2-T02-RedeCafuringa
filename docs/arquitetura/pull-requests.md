# Padrão de Pull Request

Todo PR do repositório segue o mesmo modelo. O objetivo é que quem revisa, seja dev, PO ou PM, entenda o PR **sem perguntar nada**: o que entrou, por quê, como foi provado e como testar.

O GitHub carrega o modelo sozinho ao abrir um PR (arquivo [`.github/pull_request_template.md`](https://github.com/mdsreq-fga-unb/REQ-2026.2-T02-RedeCafuringa/blob/dev/.github/pull_request_template.md)). Esta página explica cada seção; o fluxo de branches, commits e checks está em [Como contribuir](contribuindo.md).

## Princípios

1. **Quem lê não conhece o contexto.** Escreva para uma pessoa que não acompanhou o desenvolvimento.
2. **Evidência, não afirmação.** "Testes passando" só vale com o comando e a contagem (`339 testes`). Prints e respostas reais valem mais do que descrição.
3. **Rastreável.** Cada critério de aceitação da história aponta para o código e para o teste que o cobre.
4. **Nenhuma seção vazia.** Se não se aplica, escreva "Não se aplica" e o motivo em uma linha. Seção em branco parece esquecimento.
5. **Honesto sobre os limites.** O que ficou de fora, o que é instável e o que ainda é risco entram no PR, não na cabeça de quem o escreveu.
6. **Um PR, um assunto.** Se a descrição precisa de "e também", pense em dividir.

## Quais seções preencher

| Tipo de PR | Obrigatórias | Pode ser "Não se aplica" |
|---|---|---|
| **Funcionalidade (HU)** | todas | Acessibilidade, se não houver tela; Banco e infraestrutura, se não houver |
| **Correção (`fix`)** | Resumo, O que mudou, Como foi verificado, Riscos | Critérios de aceitação (descreva o comportamento esperado), Decisões |
| **Documentação** | Resumo, O que mudou, Como foi verificado (`docs-build`) | O restante |
| **Infra, CI, ferramentas** | Resumo, O que mudou, Como foi verificado, Riscos, deploy e reversão | Acessibilidade, Critérios |

## O que cada seção responde

| Seção | Pergunta que responde | Como preencher bem |
|---|---|---|
| **Resumo** | O que este PR entrega e por que importa? | 2 a 4 linhas, em linguagem de produto. Inclui a história e os requisitos (`HU12 · RF12 · RN07 · RNF11`) e a ordem de merge. |
| **O que mudou** | O que foi alterado, e onde? | Por camada (backend, front, contrato, banco e infra, docs). Tópicos curtos com o comportamento, não a lista de arquivos. |
| **Critérios de aceitação** | Cada critério da história foi atendido? | Uma linha por CA com o ponto do código e o teste. Se um CA não tem teste, o PR não está pronto. |
| **Decisões e trade-offs** | Por que foi feito assim? | O que foi escolhido, o que foi descartado e o motivo. Decisão do cliente leva a data. |
| **Segurança e privacidade** | Isso abre alguma brecha ou expõe dado pessoal? | Responda item a item. Dado pessoal (LGPD) nunca sai em resposta nem em log. |
| **Acessibilidade e responsividade** | Funciona por teclado, em tela pequena e com rede ruim? | Só para interface. Referência: RNF04, RNF05, RNF03. |
| **Como foi verificado** | Como sabemos que funciona? | Tabela com comando e resultado real. Registre também instabilidades dos testes. |
| **Guia de revisão e teste manual** | Como eu mesmo testo? | Passos numerados, usuários de teste e **casos de falha** (sem login, perfil errado, entrada inválida). |
| **Riscos, deploy e reversão** | O que pode quebrar e como desfazer? | Ação no deploy (variável, índice, migração), risco principal e como reverter. |
| **Fora do escopo** | O que ficou para depois? | O que não entrou de propósito e onde será tratado. |
| **Evidências** | Posso ver funcionando? | Prints, GIFs ou respostas da API, sem dado pessoal real. |
| **Checklist final** | O PR está em condições de revisão? | Marque só o que foi conferido. |

## O que torna um PR bom

- **O título diz o resultado**, no padrão de commit: `feat(hu12): trajetória e foto de perfil do produtor`.
- **Dá para revisar em partes.** Commits pequenos, com um assunto cada e, em funcionalidades, o teste antes da implementação (TDD).
- **A ordem de merge está dita.** Se outro PR precisa entrar antes, o texto traz o passo exato de integração.
- **O caminho feliz e o de falha estão no roteiro.** Quem revisa tenta quebrar, não só ver funcionar.
- **O contrato acompanha o código.** Mudou endpoint? Versão da API sobe, `./scripts/dev.sh contract` roda e os arquivos gerados vão no PR ([Versionamento e contrato](shared/contratos.md)).

## O que fazer antes de abrir

```bash
./scripts/dev.sh check                 # lint, formato, tipos, build e testes
./scripts/dev.sh test backend --e2e    # testes E2E do backend
./scripts/dev.sh contract              # contrato e tipos do front em dia (não pode gerar diferença)
git fetch && git merge origin/dev      # branch atualizada, sem conflito
```

Os resultados desses comandos entram na seção **Como foi verificado**.

## O que quem revisa confere

1. **Escopo:** o PR faz o que a história pede, e só isso?
2. **Critérios:** cada CA tem código e teste? Rode o roteiro de teste manual.
3. **Falhas:** tente os casos de falha listados e pelo menos um que não esteja na lista.
4. **Segurança e dados pessoais:** os itens marcados são verdadeiros?
5. **Contrato e docs:** versão da API, página da HU e referências estão em dia?
6. **Riscos:** o plano de deploy e de reversão é realista?
7. **Checks:** os 7 checks estão verdes (o GitHub bloqueia o merge sem isso).

## Modelo completo

O texto abaixo é o próprio arquivo do repositório, incluído aqui para consulta (fonte única: não é uma cópia).

```markdown
--8<-- ".github/pull_request_template.md"
```
