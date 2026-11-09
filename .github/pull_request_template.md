<!--
Template padrão de PR da Rede Cafuringa. Guia completo, com exemplos: docs "Padrão de Pull Request"
(Engenharia > Padrão de Pull Request, no site do projeto).

Regras rápidas:
- Título no padrão de commit: <tipo>(escopo): descrição curta. Ex.: feat(hu12): trajetória e foto de perfil do produtor
- Nenhuma seção fica em branco. Se não se aplica, escreva "Não se aplica" e o motivo em uma linha.
- Apague os comentários como este antes de enviar.
- Em PR de documentação ou ajuste pequeno, preencha o Resumo, "O que mudou" e "Como foi verificado" e marque o resto como "Não se aplica".
-->

## Resumo

<!-- 2 a 4 linhas: o que este PR entrega e por que importa para o usuário ou para o time. -->

**História / requisito:** <!-- ex.: HU12 · RF12 · RN07 · RNF11. Em PR sem história, escreva o motivo (bug, dívida técnica, infra). -->

**Tipo:** <!-- marque um -->
- [ ] Funcionalidade (`feat`)
- [ ] Correção (`fix`)
- [ ] Documentação (`docs`)
- [ ] Infraestrutura, CI ou ferramentas (`chore`, `ci`)
- [ ] Refatoração, testes ou estilo (`refactor`, `test`, `style`)

**Dependências e ordem de merge:** <!-- "Independente" ou "Entra depois do PR nº X porque ...". Se outro PR precisa vir antes, diga o passo de integração. -->

## O que mudou

<!-- Por camada, em tópicos curtos. Apague as camadas que não foram tocadas. -->

### Backend
-

### Frontend
-

### Contrato da API (OpenAPI)
<!-- Rotas novas, campos novos, erros. Versão `OPENAPI_VERSION` anterior → nova. Quebra o contrato? Veja docs "Versionamento e contrato". -->
-

### Banco de dados, infraestrutura e configuração
<!-- Coleções, índices, variáveis de ambiente novas, Caddy/Docker, migração. Diga se exige ação no deploy. -->
-

### Documentação
-

## Critérios de aceitação

<!-- Uma linha por critério da HU. Todo critério precisa de código e de teste. Em PR sem história, liste o comportamento esperado. -->

| Critério | Onde está implementado | Teste que cobre |
|---|---|---|
| CA01 — | | |

## Decisões e trade-offs

<!-- O que foi escolhido, o que foi descartado e por quê. Decisão que o cliente tomou: cite a data. -->

| Decisão | Motivo | Alternativa descartada |
|---|---|---|
| | | |

## Segurança e privacidade

<!-- Responda cada item com "Sim, como" ou "Não se aplica". Referência: docs "Segurança e auditoria". -->

- [ ] **Autorização:** só quem deve acessa cada rota (perfil e titularidade, RNF08)
- [ ] **Entrada:** toda entrada é validada no servidor; sem concatenar consulta com dado do usuário
- [ ] **Dados pessoais (LGPD, RNF11):** nenhuma resposta nem log traz senha, hash, CPF completo, token ou e-mail de terceiro
- [ ] **Segredos:** nada de chave, senha ou `.env` real no repositório; variáveis novas estão no `.env.example`
- [ ] **Dependências:** `npm audit` sem vulnerabilidade alta ou crítica

## Acessibilidade e responsividade

<!-- Só para mudança de interface (RNF04 e RNF05). Caso contrário: "Não se aplica". -->

- [ ] Navegação por teclado, foco visível e rótulos nos campos
- [ ] Contraste WCAG 2.1 AA (use os tokens de cor do app)
- [ ] Testado em tela estreita (celular) e com conexão lenta
- [ ] Mensagens de erro orientam o que fazer (RNF03)

## Como foi verificado

<!-- Cole a saída real, com contagens. "Passou" sem número não vale. -->

| Verificação | Comando | Resultado |
|---|---|---|
| Lint, formato, tipos e build | `./scripts/dev.sh check` | |
| Testes do backend (unitários) | `./scripts/dev.sh check` | N testes |
| Testes E2E do backend | `./scripts/dev.sh test backend --e2e` | N testes |
| Testes do app, com acessibilidade | `./scripts/dev.sh check` | N testes |
| Contrato sem diferença | `./scripts/dev.sh contract && git status --short shared app/src/shared` | sem diferença |
| Navegador real (se houver interface) | `./scripts/dev.sh up` | roteiro abaixo |

**Limitações conhecidas dos testes:** <!-- instabilidade, o que não foi coberto. Se não houver: "Nenhuma". -->

## Guia de revisão e teste manual

<!-- Passo a passo para quem revisa conseguir reproduzir sozinho, sem perguntar. -->

**Preparação:** <!-- ex.: ./scripts/dev.sh setup, ./scripts/dev.sh up, usuários de teste. -->

**Roteiro:**
1. 
2. 

**Casos de falha para tentar:** <!-- ex.: sem login, perfil errado, arquivo inválido, rede lenta. O que deve acontecer em cada um. -->
-

**Onde olhar primeiro no código:** <!-- 2 ou 3 arquivos que concentram a lógica. -->
-

## Riscos, deploy e reversão

<!-- O que pode dar errado, como perceber e como desfazer. -->

- **Ação no deploy:** <!-- variável nova, índice, migração, nenhuma -->
- **Risco:** 
- **Reversão:** <!-- ex.: reverter o merge basta; ou "exige apagar a coleção X" -->

## Fora do escopo e próximos passos

<!-- O que de propósito não entrou e onde isso será tratado (HU, issue). -->
-

## Evidências

<!-- Prints ou GIFs de interface; trechos de resposta da API. Nunca inclua dado pessoal real. -->

## Checklist final

- [ ] A branch está atualizada com a `dev` e sem conflito
- [ ] Os 7 checks do PR estão verdes
- [ ] Cada commit tem um assunto só e a mensagem segue o padrão (`tipo(escopo): descrição`)
- [ ] Todo código novo tem teste (em TDD, o commit de teste vem antes da implementação)
- [ ] O contrato foi regenerado e a versão da API subiu, se a API mudou
- [ ] A documentação foi atualizada (página da HU, segurança, operação, conforme o caso)
- [ ] Nenhuma dependência de ordem de merge ficou sem explicação
