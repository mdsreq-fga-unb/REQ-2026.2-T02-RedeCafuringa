# Padrão de Pull Request

Todo PR do repositório segue o mesmo modelo. O objetivo é que qualquer pessoa responsável pela revisão — seja desenvolvedor (dev), Product Owner (PO) ou Product Manager (PM) — consiga entender o PR **sem precisar perguntar nada**: o que foi implementado, por que foi feito, como foi validado e como testar.

O GitHub carrega o modelo automaticamente ao abrir um PR. O arquivo está disponível em [` .github/pull_request_template.md`](https://github.com/mdsreq-fga-unb/REQ-2026.2-T02-RedeCafuringa/blob/dev/.github/pull_request_template.md).

Esta página explica cada seção do modelo. O fluxo de branches, commits e checks está documentado em [Como contribuir](contribuindo.md).

## 1. Princípios

1. **Quem lê não conhece o contexto.** Escreva para uma pessoa que não acompanhou o desenvolvimento.
2. **Evidência, não afirmação.** Dizer que os testes passaram só é válido quando acompanhado do comando executado e da quantidade de testes aprovados (por exemplo, `339 testes`). Prints e respostas reais valem mais do que descrições genéricas.
3. **Rastreabilidade.** Cada critério de aceitação da história deve apontar para o código e para o teste que o cobre.
4. **Nenhuma seção vazia.** Se uma seção não se aplicar, escreva "Não se aplica" e justifique em uma linha. Uma seção em branco pode parecer esquecida.
5. **Honestidade sobre os limites.** O que ficou de fora, o que está instável e os riscos existentes devem ser registrados no PR, e não ficar apenas com quem o escreveu.
6. **Um PR, um assunto.** Se a descrição precisa incluir expressões como "e também", avalie se o trabalho deve ser dividido em mais de um PR.

---

## 2. Quais seções preencher

As seções obrigatórias variam conforme o tipo de PR.

| Tipo de PR | Seções obrigatórias | Pode ser preenchido com "Não se aplica" |
|---|---|---|
| **Funcionalidade (HU)** | Todas | Acessibilidade, se não houver tela; banco de dados e infraestrutura, se não houver alterações nessas áreas |
| **Correção (`fix`)** | Resumo, O que mudou, Como foi verificado e Riscos | Critérios de aceitação (descrever o comportamento esperado) e Decisões |
| **Documentação** | Resumo, O que mudou e Como foi verificado (`docs-build`) | Demais seções |
| **Infraestrutura, CI e ferramentas** | Resumo, O que mudou, Como foi verificado, Riscos, Deploy e reversão | Acessibilidade e Critérios de aceitação |

---

## 3. O que cada seção responde

| Seção | Pergunta que responde | Como preencher bem |
|---|---|---|
| **Resumo** | O que este PR entrega e por que isso importa? | Escreva de 2 a 4 linhas, em linguagem de produto. Inclua a história e os requisitos relacionados (por exemplo, `HU12 · RF12 · RN07 · RNF11`) e a ordem de merge, quando aplicável. |
| **O que mudou** | O que foi alterado e em quais áreas? | Organize por camada (backend, frontend, contrato, banco de dados e infraestrutura, documentação). Utilize tópicos curtos que descrevam o comportamento implementado, e não apenas uma lista de arquivos. |
| **Critérios de aceitação** | Todos os critérios da história foram atendidos? | Apresente uma linha para cada critério de aceitação (CA), indicando o trecho do código relacionado e o teste correspondente. Se um CA não possui teste, o PR ainda não está pronto. |
| **Decisões e trade-offs** | Por que a solução foi implementada dessa forma? | Explique o que foi escolhido, quais alternativas foram descartadas e os motivos. Decisões tomadas pelo cliente devem incluir a data. |
| **Segurança e privacidade** | A alteração cria alguma vulnerabilidade ou expõe dados pessoais? | Responda a cada item da seção. Dados pessoais protegidos pela LGPD nunca devem ser expostos em respostas ou logs. |
| **Acessibilidade e responsividade** | A funcionalidade funciona por teclado, em telas pequenas e com conexão ruim? | Preencha quando houver alterações na interface. Utilize como referência os requisitos `RNF04`, `RNF05` e `RNF03`. |
| **Como foi verificado** | Quais evidências demonstram que a alteração funciona? | Apresente uma tabela com os comandos executados e seus resultados reais. Registre também eventuais instabilidades nos testes. |
| **Guia de revisão e teste manual** | Como a pessoa revisora pode testar a funcionalidade? | Descreva passos numerados, usuários de teste e **casos de falha**, como ausência de login, perfil incorreto e entrada inválida. |
| **Riscos, deploy e reversão** | O que pode quebrar e como desfazer a alteração? | Descreva as ações necessárias no deploy (variáveis, índices ou migrações), o principal risco e o procedimento de reversão. |
| **Fora do escopo** | O que ficou para uma implementação futura? | Liste o que não foi incluído intencionalmente e indique onde será tratado. |
| **Evidências** | É possível visualizar a funcionalidade em execução? | Inclua prints, GIFs ou respostas da API, sempre sem dados pessoais reais. |
| **Checklist final** | O PR está pronto para revisão? | Marque somente os itens que foram efetivamente conferidos. |

---

## 4. O que torna um PR bom

- **O título apresenta o resultado.** Utilize o padrão de commits, por exemplo: `feat(hu12): trajetória e foto de perfil do produtor`.
- **A revisão pode ser feita por partes.** Organize commits pequenos, cada um com um assunto. Em funcionalidades, siga TDD: escreva o teste antes da implementação.
- **A ordem de merge está explícita.** Se outro PR precisar ser integrado antes, descreva exatamente como realizar a integração.
- **O caminho feliz e os casos de falha estão documentados.** A pessoa revisora deve tentar identificar problemas, e não apenas confirmar que a funcionalidade funciona.
- **O contrato acompanha o código.** Quando um endpoint for alterado, atualize a versão da API, execute `./scripts/dev.sh contract` e inclua os arquivos gerados no PR. Consulte [Versionamento e contrato](shared/contratos.md).

---

## 5. O que fazer antes de abrir um PR

Antes de abrir o PR, execute os comandos abaixo na raiz do repositório:

```bash
./scripts/dev.sh check                 # Lint, formatação, tipos, build e testes
./scripts/dev.sh test backend --e2e    # Testes E2E do backend
./scripts/dev.sh contract              # Verifica se o contrato e os tipos do frontend estão atualizados
git fetch && git merge origin/dev      # Atualiza a branch com dev e verifica possíveis conflitos
```

Os resultados desses comandos devem ser registrados na seção **Como foi verificado** do PR.

---

## 6. O que a pessoa revisora deve conferir

1. **Escopo:** o PR implementa o que a história solicita e somente isso?
2. **Critérios de aceitação:** cada CA possui código e teste correspondentes? Execute também o roteiro de teste manual.
3. **Casos de falha:** teste os cenários de falha listados e pelo menos um cenário adicional.
4. **Segurança e dados pessoais:** as informações declaradas nessa seção correspondem ao comportamento real da implementação?
5. **Contrato e documentação:** a versão da API, a página da HU e as referências estão atualizadas?
6. **Riscos:** o plano de deploy e reversão é viável?
7. **Checks:** os 7 checks obrigatórios estão verdes? O GitHub bloqueia o merge caso algum deles não seja aprovado.

---

## 7. Modelo completo

O conteúdo abaixo incorpora o próprio arquivo do repositório por meio de inclusão do MkDocs. Assim, o arquivo original permanece como fonte única, evitando divergências entre a documentação e o modelo utilizado pelo GitHub.

```markdown
--8<-- ".github/pull_request_template.md"
```