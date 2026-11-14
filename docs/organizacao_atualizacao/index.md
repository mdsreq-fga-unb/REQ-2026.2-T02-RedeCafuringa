# Organização e Atualização de Requisitos

<span class="version-badge">Unidade 02 · Engenharia de Requisitos</span>

Esta seção apresenta como a equipe **ByteLab** organiza, consulta, acompanha e revisa os requisitos da **Rede Cafuringa** durante as iterações do *Agile Unified Process* (AUP). A proposta distingue o que já está documentado do que ainda precisa ser consolidado para manter o escopo coerente e rastreável.

<div class="orc-jump-grid">
  <a class="orc-jump-card" href="../visao/historias_usuario/">
    <span class="orc-jump-eyebrow">Consulta única</span>
    <strong>Backlog — Cards e Tabela</strong>
    <span>Consulte as 48 HUs e seus vínculos em uma única visualização, com busca e filtros.</span>
    <span class="orc-jump-action">Abrir backlog →</span>
  </a>
  <a class="orc-jump-card" href="rastreabilidade/">
    <span class="orc-jump-eyebrow">Relações</span>
    <strong>Rastreabilidade</strong>
    <span>Percorra a origem, as regras, os critérios e a entrega de uma história.</span>
    <span class="orc-jump-action">Consultar vínculos →</span>
  </a>
  <a class="orc-jump-card" href="atualizacao/">
    <span class="orc-jump-eyebrow">Evolução</span>
    <strong>Gestão de mudanças</strong>
    <span>Veja como analisar, decidir, registrar e comunicar atualizações.</span>
    <span class="orc-jump-action">Ver processo →</span>
  </a>
</div>

!!! info "Fonte de manutenção sincronizada"

    Os atributos estruturados das HUs são mantidos em `docs/data/historias.json`. O Backlog, a Tabela, as identificações das HUs, o MVP e o cronograma são **visões geradas** automaticamente no build; não há outra lista editável desses atributos.


## Estrutura de rastreabilidade

A árvore abaixo é **navegável**: selecione qualquer caixa para abrir a documentação correspondente. As setas expressam um percurso de consulta e **não afirmam que todos os vínculos individuais estejam completos**.

<div class="orc-trace-tree" aria-label="Árvore de rastreabilidade navegável">
  <div class="orc-trace-level">
    <a class="orc-trace-node orc-trace-node--source" href="../visao/cenario/">
      <small>Contexto</small><strong>Problema e necessidades</strong><span>Cenário da Rede Cafuringa</span>
    </a>
  </div>
  <div class="orc-trace-arrow" aria-hidden="true">↓</div>
  <div class="orc-trace-level">
    <a class="orc-trace-node" href="../visao/solucao/#22-objetivos-especificos-oe-do-produto">
      <small>Origem</small><strong>Objetivos específicos (OE)</strong><span>Resultados desejados</span>
    </a>
  </div>
  <div class="orc-trace-arrow" aria-hidden="true">↓</div>
  <div class="orc-trace-level">
    <a class="orc-trace-node" href="../visao/solucao/#23-caracteristicas-do-produto">
      <small>Visão</small><strong>Características do produto (CP)</strong><span>Capacidades esperadas</span>
    </a>
  </div>
  <div class="orc-trace-arrow" aria-hidden="true">↓</div>
  <div class="orc-trace-level orc-trace-level--branches">
    <a class="orc-trace-node" href="../visao/requisitos_software/#71-requisitos-funcionais">
      <small>Comportamentos</small><strong>Requisitos funcionais (RF)</strong><span>O que o sistema deve fazer</span>
    </a>
    <a class="orc-trace-node" href="../visao/requisitos_software/#72-requisitos-nao-funcionais">
      <small>Restrições</small><strong>Requisitos não funcionais (RNF)</strong><span>Qualidades e limites</span>
    </a>
    <a class="orc-trace-node" href="../visao/requisitos_software/#73-lista-de-regras-de-negocio">
      <small>Condições</small><strong>Regras de negócio (RN)</strong><span>Regras do domínio</span>
    </a>
  </div>
  <div class="orc-trace-arrow" aria-hidden="true">↓</div>
  <div class="orc-trace-level">
    <a class="orc-trace-node" href="../visao/historias_usuario/">
      <small>Recortes de valor</small><strong>Histórias de usuário (HU)</strong><span>Critérios, relações, DoR e DoD</span>
    </a>
  </div>
  <div class="orc-trace-arrow" aria-hidden="true">↓</div>
  <div class="orc-trace-level orc-trace-level--branches">
    <a class="orc-trace-node" href="../visao/mvp/#101-criterios-de-priorizacao-do-backlog">
      <small>Decisão</small><strong>Priorização</strong><span>Método e critérios</span>
    </a>
    <a class="orc-trace-node" href="../visao/mvp/#102-requisitos-do-mvp">
      <small>Escopo</small><strong>MVP</strong><span>Seleção do incremento</span>
    </a>
    <a class="orc-trace-node" href="../visao/cronograma/">
      <small>Execução</small><strong>Iterações e evidências</strong><span>Planejamento e registros</span>
    </a>
  </div>
  <div class="orc-trace-arrow" aria-hidden="true">↓</div>
  <div class="orc-trace-level">
    <a class="orc-trace-node orc-trace-node--source" href="../#historico-de-revisao">
      <small>Memória</small><strong>Histórico de revisão</strong><span>Versões, alterações e responsáveis</span>
    </a>
  </div>
</div>

## Responsabilidade de cada fonte

<div class="orc-source-list">
  <div><strong>Visão do produto</strong><p><a href="../visao/solucao/">Objetivos e características</a> que explicam a origem e a finalidade.</p></div>
  <div><strong>Requisitos</strong><p><a href="../visao/requisitos_software/">RFs, RNFs e regras de negócio</a> que expressam os comportamentos e condições.</p></div>
  <div><strong>Backlog</strong><p><a href="../visao/historias_usuario/">HUs e atributos de planejamento</a> que orientam as entregas.</p></div>
  <div><strong>Decisões e evidências</strong><p><a href="../visao/cronograma/">Iterações</a>, <a href="../#historico-de-revisao">histórico</a> e <a href="atualizacao/">registro de mudanças</a>.</p></div>
</div>

## Como verificar na prática

Uma forma de avaliar a organização é abrir a <a href="../visao/historias/HU1/">HU01</a>, seguir o RF e a origem, consultar os critérios na página da história e verificar o planejamento correspondente. Para examinar impactos, use o <a href="atualizacao/#modelo-para-registrar-uma-mudanca">modelo de mudança</a> e verifique se a decisão alcançou os artefatos afetados.

**Referência conceitual:** material do Capítulo 12 da disciplina, sobre organização, atualização, relações e histórico de requisitos. A aplicação apresentada usa os registros efetivamente disponíveis no projeto.
