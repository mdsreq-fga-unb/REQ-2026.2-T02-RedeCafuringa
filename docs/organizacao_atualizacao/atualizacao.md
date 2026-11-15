# Atualização de Requisitos e Histórico

<span class="version-badge">Unidade 02 · Organização e Atualização</span>

A proposta de atualização segue a abordagem híbrida e iterativa descrita nas [Estratégias de Engenharia de Software](../visao/estrategias.md): acolher mudanças, avaliar impactos, decidir o que passa a valer e atualizar os registros relacionados, preservando o histórico necessário.

## Fluxo de tratamento de mudanças

<div class="orc-flow" aria-label="Processo de atualização de requisitos">
  <div><span>01</span><strong>Identificar</strong><p>Feedback do cliente, teste, revisão ou nova demanda.</p></div>
  <div><span>02</span><strong>Analisar</strong><p>Verificar RFs, HUs, regras, critérios, MVP e dependências.</p></div>
  <div><span>03</span><strong>Decidir</strong><p>Registrar aprovação, adiamento ou recusa e a justificativa.</p></div>
  <div><span>04</span><strong>Propagar</strong><p>Atualizar declarações, relações, protótipo e planejamento afetados.</p></div>
  <div><span>05</span><strong>Comunicar</strong><p>Revisar por PR, informar envolvidos e vincular evidências.</p></div>
</div>

Esse fluxo é uma **rotina proposta/documentada**; não representa a afirmação de que toda mudança histórica já percorreu formalmente cada etapa.

## Fonte única de metadados e atualização automática

A sincronização estruturada **já está implementada** com uma fonte central e visões derivadas. Há **três fontes por responsabilidade**, em vez de copiar as mesmas informações em várias tabelas:

| Fonte de manutenção | O que editar nela | O que é atualizado no build do MkDocs |
|---|---|---|
| `docs/data/historias.json` | Título, RF relacionado, RNFs, regras, OE, CP, prioridade, escopo MVP, situação, ordem e iteração | Cards, tabela enriquecida, identificação das HUs, composição do MVP e HUs listadas no cronograma |
| [Requisitos de Software](../visao/requisitos_software.md) (`docs/visao/requisitos_software.md`) | Declaração e denominação vigente dos RFs, RNFs e regras | Nomes dos RFs nas fichas de identificação e na tabela derivada do MVP |
| [Páginas das HUs](../visao/historias_usuario.md) (`docs/visao/historias/HU*.md`) | Narrativa, critérios de aceitação, protótipos, DoR/DoD e demais detalhes da HU | Conteúdo completo da página da HU e da janela modal, que consulta essa mesma página |

**Não edite manualmente as tags dos cards, as linhas derivadas do MVP, as atribuições do cronograma nem o bloco de identificação gerado nas HUs.** Eles são apenas apresentações dos metadados mantidos em `historias.json`.

### Como realizar uma atualização

1. Identifique a HU e registre a mudança em issue ou PR, com justificativa e pessoas envolvidas.
2. Altere **uma vez** os atributos em `docs/data/historias.json` (ex.: `iteracao`, `prioridade`, `rnfs`). Se mudar a declaração de RF ou os critérios da HU, edite também **a fonte textual própria daquele conteúdo**.
3. Valide e atualize os snapshots rastreados no Git: `py -3 scripts/requisitos_unificados.py --sync --repo .`.
4. Execute `py -3 scripts/requisitos_unificados.py --check --repo .` e `py -3 -m mkdocs build --clean`. O hook `scripts/mkdocs_hooks.py` regenera as visões publicadas a partir das fontes a cada build.
5. Revise o diff, os efeitos no MVP e na iteração, e registre a decisão no PR. Após merge e deploy, as páginas publicadas consultam a mesma versão dos dados.

Uma alteração em um **atributo central** aparece automaticamente nas demais visões; **não** se trata de edição direta pelo navegador do Pages, que é um site estático. Trechos narrativos, protótipos e testes que sofram impacto continuam exigindo revisão humana — o gerador não presume decisões ou aprovações.

### Garantias de integridade

O validador bloqueia IDs duplicados, RF incoerente com a HU, 48 registros incompletos, ordens repetidas, atribuições de iteração a HUs fora do MVP e dados estruturados inválidos. A integração não substitui a validação de conteúdo com a equipe e o cliente.

---

## Histórico da repriorização do MVP — Issue #18

**Data do registro:** 13/11/2026. **Natureza:** proposta técnica de reavaliação para revisão da equipe e do cliente; não constitui aceite formal.

**Fórmula anterior:** `ET=(ES+CX+CP)/3`; `Média=(VN+ET)/2`. Esse cálculo favorecia histórias mais custosas.
**Fórmula revisada:** `IPA=(VN+5-ET)/2`, preservando `ET=(ES+CX+CP)/3`. Em todas as notas propostas, CP indica **demanda de capacidade técnica**, não disponibilidade da equipe. Quanto maior ES/CX/CP, maior o custo. Prioridade: Alta ≥ 3,00; Média ≥ 2,50; Baixa < 2,50.

A nova **ordem de implementação** primeiro respeita as iterações 6, 7 e 8 e as dependências funcionais; dentre as histórias liberadas pelos pré-requisitos, usa maior IPA e depois a posição anterior para desempate. A decisão de manter as 20 HUs e as iterações é provisória até replanejamento formal. Não foram recuperadas notas históricas individuais de VN, ES, CX e CP da fonte atual: foram preservadas **a classificação e a ordem anteriores**, sem atribuir ao cliente novas notas.

| Ordem anterior | História | Prioridade anterior | Nova ordem | Prioridade revisada | IPA |
|---:|---|---|---:|---|---:|
| 1º | [HU01](../visao/historias/HU1.md) — Cadastrar perfil de consumidor | Média | 1º | Alta | 3.67 |
| 2º | [HU02](../visao/historias/HU2.md) — Cadastrar perfil de produtor | Média | 2º | Alta | 3.50 |
| 3º | [HU03](../visao/historias/HU3.md) — Cadastrar usuário administrador | Média | 5º | Média | 2.50 |
| 4º | [HU04](../visao/historias/HU4.md) — Consultar usuários cadastrados | Alta | 6º | Média | 2.50 |
| 5º | [HU09](../visao/historias/HU9.md) — Autenticar usuário | Alta | 3º | Alta | 3.00 |
| 6º | [HU10](../visao/historias/HU10.md) — Recuperar acesso à conta | Alta | 7º | Média | 2.50 |
| 7º | [HU12](../visao/historias/HU12.md) — Registrar trajetória do produtor | Baixa | 4º | Média | 2.67 |
| 8º | [HU14](../visao/historias/HU14.md) — Consultar perfil de produtor | Alta | 14º | Média | 2.83 |
| 9º | [HU15](../visao/historias/HU15.md) — Cadastrar produto | Média | 8º | Alta | 3.17 |
| 10º | [HU19](../visao/historias/HU19.md) — Consultar catálogo de produtos | Alta | 9º | Alta | 3.50 |
| 11º | [HU20](../visao/historias/HU20.md) — Consultar detalhes do produto | Alta | 10º | Alta | 3.00 |
| 12º | [HU21](../visao/historias/HU21.md) — Cadastrar experiência | Alta | 11º | Alta | 3.00 |
| 13º | [HU24](../visao/historias/HU24.md) — Consultar catálogo de experiências | Alta | 12º | Alta | 3.33 |
| 14º | [HU36](../visao/historias/HU36.md) — Buscar ofertas | Alta | 13º | Alta | 3.00 |
| 15º | [HU39](../visao/historias/HU39.md) — Disponibilizar contato direto | Alta | 15º | Alta | 3.67 |
| 16º | [HU44](../visao/historias/HU44.md) — Solicitar pré-reserva de experiência | Alta | 16º | Média | 2.50 |
| 17º | [HU45](../visao/historias/HU45.md) — Consultar pré-reserva | Alta | 17º | Alta | 3.00 |
| 18º | [HU46](../visao/historias/HU46.md) — Cancelar pré-reserva | Média | 18º | Alta | 3.00 |
| 19º | [HU47](../visao/historias/HU47.md) — Responder pré-reserva de experiência | Média | 19º | Média | 2.83 |
| 20º | [HU48](../visao/historias/HU48.md) — Notificar alteração de pré-reserva | Média | 20º | Média | 2.50 |

### Notas técnicas propostas e fundamentos

| HU | VN | ES | CX | CP | ET | Justificativa técnica / fonte de inspeção |
|---|---:|---:|---:|---:|---:|---|
| HU01 | 4 | 2 | 2 | 1 | 1.67 | Cadastro de consumidor é base para acesso aos fluxos autenticados; implementação e validação moderadas. [HU01](../visao/historias/HU1.md) |
| HU02 | 4 | 2 | 2 | 2 | 2.00 | Perfil de produtor sustenta oferta, divulgação e gestão; custo moderado de dados e validações. [HU02](../visao/historias/HU2.md) |
| HU03 | 3 | 3 | 3 | 3 | 3.00 | Conta administrativa é importante para governança, mas envolve regras de privilégio e segurança. [HU03](../visao/historias/HU3.md) |
| HU04 | 3 | 3 | 3 | 3 | 3.00 | Consulta administrativa depende de autenticação e permissões, com cuidados de privacidade. [HU04](../visao/historias/HU4.md) |
| HU09 | 4 | 3 | 3 | 3 | 3.00 | Autenticação é pré-requisito dos fluxos privados; exige gestão de credenciais e segurança. [HU09](../visao/historias/HU9.md) |
| HU10 | 3 | 3 | 3 | 3 | 3.00 | Recuperação de acesso é complementar ao login, com requisitos de segurança e verificação. [HU10](../visao/historias/HU10.md) |
| HU12 | 2 | 2 | 2 | 1 | 1.67 | História do produtor enriquece conteúdo, mas depende do cadastro e tem menor urgência relativa. [HU12](../visao/historias/HU12.md) |
| HU14 | 3 | 2 | 3 | 2 | 2.33 | Consulta do perfil é relevante para descoberta, mas depende de perfil e trajetória cadastrados. [HU14](../visao/historias/HU14.md) |
| HU15 | 4 | 3 | 3 | 2 | 2.67 | Cadastro de produto é pré-requisito do catálogo; inclui validação de campos e associação ao produtor. [HU15](../visao/historias/HU15.md) |
| HU19 | 4 | 2 | 2 | 2 | 2.00 | Consulta do catálogo entrega valor diretamente, com complexidade menor após o cadastro de produtos. [HU19](../visao/historias/HU19.md) |
| HU20 | 3 | 2 | 2 | 2 | 2.00 | Detalhes de produto complementam catálogo existente e aproveitam sua fonte de dados. [HU20](../visao/historias/HU20.md) |
| HU21 | 4 | 3 | 3 | 3 | 3.00 | Cadastro de experiências é essencial para pré-reserva, com regras e dados próprios. [HU21](../visao/historias/HU21.md) |
| HU24 | 4 | 2 | 3 | 2 | 2.33 | Catálogo de experiências reutiliza cadastros e permite descoberta das ofertas. [HU24](../visao/historias/HU24.md) |
| HU36 | 4 | 3 | 3 | 3 | 3.00 | Busca de ofertas agrega produtos e experiências; integra índices, filtros e consultas. [HU36](../visao/historias/HU36.md) |
| HU39 | 4 | 2 | 2 | 1 | 1.67 | Contato direto usa link externo do WhatsApp, não chat interno; exige consentimento explícito. [HU39](../visao/historias/HU39.md) |
| HU44 | 4 | 4 | 4 | 4 | 4.00 | Pré-reserva completa envolve validações, estados e vínculo entre usuário e experiência; custo alto. [HU44](../visao/historias/HU44.md) |
| HU45 | 3 | 2 | 2 | 2 | 2.00 | Consulta de pré-reservas é necessária ao acompanhamento e depende do registro de solicitações. [HU45](../visao/historias/HU45.md) |
| HU46 | 3 | 2 | 2 | 2 | 2.00 | Cancelamento de pré-reserva reutiliza dados de solicitação e exige validações de titularidade. [HU46](../visao/historias/HU46.md) |
| HU47 | 3 | 2 | 3 | 2 | 2.33 | Resposta do produtor à pré-reserva exige autorização e atualização de estado. [HU47](../visao/historias/HU47.md) |
| HU48 | 3 | 3 | 3 | 3 | 3.00 | Notificação de alteração depende dos estados da pré-reserva e requer integração adicional. [HU48](../visao/historias/HU48.md) |

**Contagem histórica:** Alta 12; Média 7; Baixa 1. **Contagem revisada:** Alta 12; Média 8; Baixa 0.

---
## Pontos de controle ao longo do AUP

| Momento | Conferência | Registros de apoio |
|---|---|---|
| Planejamento | Prioridade, escopo, dependências e prontidão (DoR) | [Backlog](../visao/historias_usuario.md) e [DoR/DoD](../visao/dor_dod.md) |
| Decisão sobre mudança | Motivo, impacto, responsável e o entendimento que passa a vigorar | Issue, revisão, comunicação e PR, quando registrados |
| Revisão da iteração | Critérios, resultados, feedback e pendências (DoD) | [Evidências das iterações](../visao/cronograma.md) |
| Fechamento | Entregas, itens adiados/retirados e versão identificável | [Histórico de revisão](../index.md#historico-de-revisao) e repositório |

## Modelo para registrar uma mudança

> Este é um modelo para uso em uma issue ou registro de decisão. Não representa uma mudança aprovada ou já executada.

| Campo | Preenchimento sugerido |
|---|---|
| Referência | Identificador da issue, PR ou registro de reunião |
| Descoberta | Solicitação, problema ou evidência e sua origem |
| Situação anterior | Comportamento e registro antes da mudança |
| Decisão | Novo entendimento, justificativa, participantes e situação |
| Impacto | OEs, CPs, RFs, RNFs, RNs, HUs, critérios, dependências e iterações atingidos |
| Atualização | Arquivos, protótipo, código e testes alterados conforme o impacto |
| Comunicação | Quem foi informado, quando e por qual canal |
| Fechamento | Revisão, data/versão e pendências remanescentes |

---

<!-- ISSUE_17_BACKLOG_INICIO -->
## Gestão de dependências e limites operacionais do Backlog — Issue #17

> **Registro de revisão técnica:** 13/11/2026. Os vínculos são uma **proposta de precedência para integração e testes** e aguardam validação da equipe. A situação exibida no Backlog é a situação documental registrada, não prova de conclusão de código. Os responsáveis ainda não designados permanecem **A definir**. A revisão das 48 HUs foi atribuída à **Equipe ByteLab**, conforme decisão da equipe; dependências propostas ainda requerem validação.

### Encadeamento de entregas

- **Iteração 6 — identidade e base dos perfis:** cadastros de consumidor/produtor (HU01/HU02), autenticação (HU09), trajetória do produtor (HU12), cadastro administrativo (HU03), consulta administrativa (HU04) e recuperação de acesso (HU10). Para testar autenticação de ambos os perfis, é necessária base de cadastros reais ou massa de teste controlada; a precedência documenta a integração, sem afirmar que toda implementação depende de telas prontas.
- **Iteração 7 — oferta e descoberta:** cadastrar produtos/experiências (HU15/HU21) antes de consultá-los (HU19/HU20/HU24); a busca (HU36) integra dados de produtores, produtos e experiências. O perfil público (HU14) requer produtor e trajetória. O escopo de eventos é posterior à primeira entrega.
- **Iteração 8 — contato e pré-reservas:** HU39 usa o WhatsApp externo em perfis públicos autorizados, não chat interno; a pré-reserva HU44 depende de autenticação e de experiência cadastrada. HU45/HU46/HU47/HU48 dependem do registro e dos estados das solicitações.

A ordem de execução já fixada na Issue #18 **não foi alterada por esta revisão**. O Backlog passa a apresentar os vínculos de dependência por HU e os campos de gestão. HUs fora do MVP exibem **dependências a mapear** até seu refinamento.

### Ajuste do registro da Iteração 5

O apontamento da Issue #17 descreve uma **versão histórica** na qual a Iteração 5 selecionava HUs identificadas como HU15, HU04, HU05, HU08, HU09 e HU10. A numeração e o escopo das histórias foram posteriormente reorganizados: hoje HU15 significa **Cadastrar produto** e HU39 significa **Contato direto**. Conforme [registro existente da Iteração 5](../visao/evidencias/iteracao5.md), houve impedimento de aprovação de protótipo e a equipe não avançou significativamente na implementação. O [cronograma vigente](../visao/cronograma.md) mantém a Iteração 5 sem HUs atribuídas e distribui as 20 HUs do MVP entre as Iterações 6, 7 e 8. Isso registra a mudança sem atribuir entregas inexistentes.

### Alternativa operacional para correção, exclusão e moderação

Enquanto as histórias específicas de atualizar/excluir conteúdo e de moderação (como HU16, HU17, HU22, HU23 e HU07) estiverem fora do MVP, propõe-se o seguinte **procedimento manual assistido**, a ser aprovado pela equipe e cliente **antes do uso em produção**:

1. Receber a solicitação por um canal de suporte designado pela equipe; registrar um identificador, o item afetado e o motivo **sem expor dados pessoais em issues públicas**.
2. Confirmar a identidade/autorização do solicitante e obter validação de um responsável designado para conteúdos impróprios ou correções críticas.
3. Executar a correção ou indisponibilização **somente por mecanismo administrativo seguro efetivamente disponível e testado**, com registro de quem atuou, quando, o motivo e o resultado. Não pressupor edição direta no banco nem anunciar um painel inexistente.
4. Se **não existir mecanismo seguro de ocultação/correção**, a condição operacional é **não publicar novos conteúdos afetados** e registrar o bloqueio para entrega prioritária antes de disponibilizar publicamente o fluxo em produção. Para conteúdo já publicado sem retirada segura, tratar como impedimento de publicação e escalonar imediatamente à equipe responsável.
5. Confirmar o resultado com o solicitante, preservando evidências e privacidade. Reabrir o item se a solução não estiver disponível ou verificada.

**Pendências explícitas:** escolher canal oficial e equipe autorizada, testar o mecanismo seguro de ocultação e obter aprovação do Product Owner. Este texto documenta a **alternativa proposta**, não atesta uma capacidade já implementada ou aprovada.

### Recorte da busca RF36 / HU36

O RF36 descreve o escopo completo (produtores, produtos, experiências **e eventos**). A entrega inicial da HU36 no MVP abrange **produtores, produtos e experiências** existentes. Eventos ficam para uma versão posterior, dependentes do cadastro e catálogo correspondentes fora do MVP. Essa é uma **proposta de delimitação da entrega**, a validar antes de considerá-la acordada com o cliente.

**Próxima revisão:** preencher responsáveis reais a partir do Project; manter a Equipe ByteLab como revisora e validar dependências e alternativa operacional em reunião/review, registrar aceite e evidências na issue ou PR.
<!-- ISSUE_17_BACKLOG_FIM -->
