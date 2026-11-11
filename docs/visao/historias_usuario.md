
<span class="version-badge">Unidade 02</span>


<section class="hu-filters" id="hu-filters" aria-label="Pesquisar e filtrar histórias de usuário">
  <div class="hu-filters__grid">
    <div class="hu-filters__field hu-filters__field--search">
      <label for="hu-search">Buscar história</label>
      <input id="hu-search" type="search" placeholder="Ex.: HU09, cadastro, produtor" autocomplete="off">
    </div>
    <div class="hu-filters__field">
      <label for="hu-status-filter">Situação</label>
      <select id="hu-status-filter">
        <option value="">Todas</option>
        <option value="execucao">Em execução</option>
        <option value="planejada">Planejado</option>
      </select>
    </div>
    <div class="hu-filters__field">
      <label for="hu-priority-filter">Prioridade</label>
      <select id="hu-priority-filter">
        <option value="">Todas</option>
        <option value="alta">Alta</option>
        <option value="media">Média</option>
        <option value="baixa">Baixa</option>
      </select>
    </div>
    <div class="hu-filters__field">
      <label for="hu-mvp-filter">Escopo</label>
      <select id="hu-mvp-filter">
        <option value="">Todas</option>
        <option value="sim">MVP</option>
        <option value="nao">Fora do MVP</option>
      </select>
    </div>
    <div class="hu-filters__field">
      <label for="hu-iteration-filter">Iteração</label>
      <select id="hu-iteration-filter">
        <option value="">Todas as iterações</option>
        <option value="6">Iteração 6</option>
        <option value="7">Iteração 7</option>
        <option value="8">Iteração 8</option>
      </select>
    </div>
    <div class="hu-filters__field">
      <label for="hu-sort-filter">Priorização</label>
      <select id="hu-sort-filter">
        <option value="">Ordem original (HU)</option>
        <option value="asc">Crescente (1º → 20º)</option>
        <option value="desc">Decrescente (20º → 1º)</option>
      </select>
    </div>
  </div>
  <div class="hu-filters__footer">
    <p id="hu-results-count" role="status" aria-live="polite" aria-atomic="true">48 histórias disponíveis</p>
    <button id="hu-reset" type="button">Limpar filtros</button>
  </div>
</section>

<div class="section-cards hu-catalog">

<div class="hu-card" data-priority-order="1" data-iteration="6" >
  <div class="hu-card-header">
    <div class="hu-card-status">
      <span class="hu-status hu-status-execucao">Em execução</span>
      <span class="hu-status hu-status-mvp">MVP</span>
      <span class="hu-status hu-status-prioridade">Média</span>
      <span class="hu-status hu-status-ordem" title="Ordem de implementação — Iteração 6">1º</span>
      <a class="hu-status hu-status-iteracao" href="../evidencias/iteracao6/" title="Ver evidências da Iteração 6">Iteração 6</a>
    </div>
    <h3><a class="hu-card-title-link" href="../historias/HU1/">HU01 — Cadastrar perfil de consumidor</a></h3>
  </div>
</div>

<div class="hu-card" data-priority-order="2" data-iteration="6" >
  <div class="hu-card-header">
    <div class="hu-card-status">
      <span class="hu-status hu-status-execucao">Em execução</span>
      <span class="hu-status hu-status-mvp">MVP</span>
      <span class="hu-status hu-status-prioridade">Média</span>
      <span class="hu-status hu-status-ordem" title="Ordem de implementação — Iteração 6">2º</span>
      <a class="hu-status hu-status-iteracao" href="../evidencias/iteracao6/" title="Ver evidências da Iteração 6">Iteração 6</a>
    </div>
    <h3><a class="hu-card-title-link" href="../historias/HU2/">HU02 — Cadastrar perfil de produtor</a></h3>
  </div>
</div>

<div class="hu-card" data-priority-order="3" data-iteration="6" >
  <div class="hu-card-header">
    <div class="hu-card-status">
      <span class="hu-status hu-status-execucao">Em execução</span>
      <span class="hu-status hu-status-mvp">MVP</span>
      <span class="hu-status hu-status-prioridade">Média</span>
      <span class="hu-status hu-status-ordem" title="Ordem de implementação — Iteração 6">3º</span>
      <a class="hu-status hu-status-iteracao" href="../evidencias/iteracao6/" title="Ver evidências da Iteração 6">Iteração 6</a>
    </div>
    <h3><a class="hu-card-title-link" href="../historias/HU3/">HU03 — Cadastrar usuário administrador</a></h3>
  </div>
</div>

<div class="hu-card" data-priority-order="4" data-iteration="6" >
  <div class="hu-card-header">
    <div class="hu-card-status">
      <span class="hu-status hu-status-execucao">Em execução</span>
      <span class="hu-status hu-status-mvp">MVP</span>
      <span class="hu-status hu-status-prioridade">Alta</span>
      <span class="hu-status hu-status-ordem" title="Ordem de implementação — Iteração 6">4º</span>
      <a class="hu-status hu-status-iteracao" href="../evidencias/iteracao6/" title="Ver evidências da Iteração 6">Iteração 6</a>
    </div>
    <h3><a class="hu-card-title-link" href="../historias/HU4/">HU04 — Consultar usuários cadastrados</a></h3>
  </div>
</div>

<a class="hu-card" href="../historias/HU5/">
  <div class="hu-card-header">
    <div class="hu-card-status">
      <span class="hu-status hu-status-planejada">Planejado</span>
      <span class="hu-status hu-status-prioridade">Baixa</span>
    </div>
    <h3>HU05 — Excluir usuário</h3>
  </div>
</a>

<a class="hu-card" href="../historias/HU6/">
  <div class="hu-card-header">
    <div class="hu-card-status">
      <span class="hu-status hu-status-planejada">Planejado</span>
      <span class="hu-status hu-status-prioridade">Alta</span>
    </div>
    <h3>HU06 — Consultar conteúdos cadastrados</h3>
  </div>
</a>

<a class="hu-card" href="../historias/HU7/">
  <div class="hu-card-header">
    <div class="hu-card-status">
      <span class="hu-status hu-status-planejada">Planejado</span>
      <span class="hu-status hu-status-prioridade">Baixa</span>
    </div>
    <h3>HU07 — Remover conteúdo inadequado</h3>
  </div>
</a>

<a class="hu-card" href="../historias/HU8/">
  <div class="hu-card-header">
    <div class="hu-card-status">
      <span class="hu-status hu-status-planejada">Planejado</span>
      <span class="hu-status hu-status-prioridade">Baixa</span>
    </div>
    <h3>HU08 — Atualizar informações institucionais</h3>
  </div>
</a>

<div class="hu-card" data-priority-order="5" data-iteration="6" >
  <div class="hu-card-header">
    <div class="hu-card-status">
      <span class="hu-status hu-status-execucao">Em execução</span>
      <span class="hu-status hu-status-mvp">MVP</span>
      <span class="hu-status hu-status-prioridade">Alta</span>
      <span class="hu-status hu-status-ordem" title="Ordem de implementação — Iteração 6">5º</span>
      <a class="hu-status hu-status-iteracao" href="../evidencias/iteracao6/" title="Ver evidências da Iteração 6">Iteração 6</a>
    </div>
    <h3><a class="hu-card-title-link" href="../historias/HU9/">HU09 — Autenticar usuário</a></h3>
  </div>
</div>

<div class="hu-card" data-priority-order="6" data-iteration="6" >
  <div class="hu-card-header">
    <div class="hu-card-status">
      <span class="hu-status hu-status-execucao">Em execução</span>
      <span class="hu-status hu-status-mvp">MVP</span>
      <span class="hu-status hu-status-prioridade">Alta</span>
      <span class="hu-status hu-status-ordem" title="Ordem de implementação — Iteração 6">6º</span>
      <a class="hu-status hu-status-iteracao" href="../evidencias/iteracao6/" title="Ver evidências da Iteração 6">Iteração 6</a>
    </div>
    <h3><a class="hu-card-title-link" href="../historias/HU10/">HU10 — Recuperar acesso à conta</a></h3>
  </div>
</div>

<a class="hu-card" href="../historias/HU11/">
  <div class="hu-card-header">
    <div class="hu-card-status">
      <span class="hu-status hu-status-planejada">Planejado</span>
      <span class="hu-status hu-status-prioridade">Baixa</span>
    </div>
    <h3>HU11 — Excluir conta</h3>
  </div>
</a>

<div class="hu-card" data-priority-order="7" data-iteration="6" >
  <div class="hu-card-header">
    <div class="hu-card-status">
      <span class="hu-status hu-status-execucao">Em execução</span>
      <span class="hu-status hu-status-mvp">MVP</span>
      <span class="hu-status hu-status-prioridade">Baixa</span>
      <span class="hu-status hu-status-ordem" title="Ordem de implementação — Iteração 6">7º</span>
      <a class="hu-status hu-status-iteracao" href="../evidencias/iteracao6/" title="Ver evidências da Iteração 6">Iteração 6</a>
    </div>
    <h3><a class="hu-card-title-link" href="../historias/HU12/">HU12 — Registrar trajetória do produtor</a></h3>
  </div>
</div>

<a class="hu-card" href="../historias/HU13/">
  <div class="hu-card-header">
    <div class="hu-card-status">
      <span class="hu-status hu-status-planejada">Planejado</span>
      <span class="hu-status hu-status-prioridade">Média</span>
    </div>
    <h3>HU13 — Atualizar perfil de produtor</h3>
  </div>
</a>

<div class="hu-card" data-priority-order="8" data-iteration="7" >
  <div class="hu-card-header">
    <div class="hu-card-status">
      <span class="hu-status hu-status-execucao">Em execução</span>
      <span class="hu-status hu-status-mvp">MVP</span>
      <span class="hu-status hu-status-prioridade">Alta</span>
      <span class="hu-status hu-status-ordem" title="Ordem de implementação — Iteração 7">8º</span>
      <a class="hu-status hu-status-iteracao" href="../evidencias/iteracao7/" title="Ver evidências da Iteração 7">Iteração 7</a>
    </div>
    <h3><a class="hu-card-title-link" href="../historias/HU14/">HU14 — Consultar perfil de produtor</a></h3>
  </div>
</div>

<div class="hu-card" data-priority-order="9" data-iteration="7" >
  <div class="hu-card-header">
    <div class="hu-card-status">
      <span class="hu-status hu-status-execucao">Em execução</span>
      <span class="hu-status hu-status-mvp">MVP</span>
      <span class="hu-status hu-status-prioridade">Média</span>
      <span class="hu-status hu-status-ordem" title="Ordem de implementação — Iteração 7">9º</span>
      <a class="hu-status hu-status-iteracao" href="../evidencias/iteracao7/" title="Ver evidências da Iteração 7">Iteração 7</a>
    </div>
    <h3><a class="hu-card-title-link" href="../historias/HU15/">HU15 — Cadastrar produto</a></h3>
  </div>
</div>

<a class="hu-card" href="../historias/HU16/">
  <div class="hu-card-header">
    <div class="hu-card-status">
      <span class="hu-status hu-status-planejada">Planejado</span>
      <span class="hu-status hu-status-prioridade">Média</span>
    </div>
    <h3>HU16 — Atualizar produto</h3>
  </div>
</a>

<a class="hu-card" href="../historias/HU17/">
  <div class="hu-card-header">
    <div class="hu-card-status">
      <span class="hu-status hu-status-planejada">Planejado</span>
      <span class="hu-status hu-status-prioridade">Baixa</span>
    </div>
    <h3>HU17 — Excluir produto</h3>
  </div>
</a>

<a class="hu-card" href="../historias/HU18/">
  <div class="hu-card-header">
    <div class="hu-card-status">
      <span class="hu-status hu-status-planejada">Planejado</span>
      <span class="hu-status hu-status-prioridade">Média</span>
    </div>
    <h3>HU18 — Informar disponibilidade de produto</h3>
  </div>
</a>

<div class="hu-card" data-priority-order="10" data-iteration="7" >
  <div class="hu-card-header">
    <div class="hu-card-status">
      <span class="hu-status hu-status-execucao">Em execução</span>
      <span class="hu-status hu-status-mvp">MVP</span>
      <span class="hu-status hu-status-prioridade">Alta</span>
      <span class="hu-status hu-status-ordem" title="Ordem de implementação — Iteração 7">10º</span>
      <a class="hu-status hu-status-iteracao" href="../evidencias/iteracao7/" title="Ver evidências da Iteração 7">Iteração 7</a>
    </div>
    <h3><a class="hu-card-title-link" href="../historias/HU19/">HU19 — Consultar catálogo de produtos</a></h3>
  </div>
</div>

<div class="hu-card" data-priority-order="11" data-iteration="7" >
  <div class="hu-card-header">
    <div class="hu-card-status">
      <span class="hu-status hu-status-execucao">Em execução</span>
      <span class="hu-status hu-status-mvp">MVP</span>
      <span class="hu-status hu-status-prioridade">Alta</span>
      <span class="hu-status hu-status-ordem" title="Ordem de implementação — Iteração 7">11º</span>
      <a class="hu-status hu-status-iteracao" href="../evidencias/iteracao7/" title="Ver evidências da Iteração 7">Iteração 7</a>
    </div>
    <h3><a class="hu-card-title-link" href="../historias/HU20/">HU20 — Consultar detalhes do produto</a></h3>
  </div>
</div>

<div class="hu-card" data-priority-order="12" data-iteration="7" >
  <div class="hu-card-header">
    <div class="hu-card-status">
      <span class="hu-status hu-status-execucao">Em execução</span>
      <span class="hu-status hu-status-mvp">MVP</span>
      <span class="hu-status hu-status-prioridade">Alta</span>
      <span class="hu-status hu-status-ordem" title="Ordem de implementação — Iteração 7">12º</span>
      <a class="hu-status hu-status-iteracao" href="../evidencias/iteracao7/" title="Ver evidências da Iteração 7">Iteração 7</a>
    </div>
    <h3><a class="hu-card-title-link" href="../historias/HU21/">HU21 — Cadastrar experiência</a></h3>
  </div>
</div>

<a class="hu-card" href="../historias/HU22/">
  <div class="hu-card-header">
    <div class="hu-card-status">
      <span class="hu-status hu-status-planejada">Planejado</span>
      <span class="hu-status hu-status-prioridade">Média</span>
    </div>
    <h3>HU22 — Atualizar experiência</h3>
  </div>
</a>

<a class="hu-card" href="../historias/HU23/">
  <div class="hu-card-header">
    <div class="hu-card-status">
      <span class="hu-status hu-status-planejada">Planejado</span>
      <span class="hu-status hu-status-prioridade">Baixa</span>
    </div>
    <h3>HU23 — Excluir experiência</h3>
  </div>
</a>

<div class="hu-card" data-priority-order="13" data-iteration="7" >
  <div class="hu-card-header">
    <div class="hu-card-status">
      <span class="hu-status hu-status-execucao">Em execução</span>
      <span class="hu-status hu-status-mvp">MVP</span>
      <span class="hu-status hu-status-prioridade">Alta</span>
      <span class="hu-status hu-status-ordem" title="Ordem de implementação — Iteração 7">13º</span>
      <a class="hu-status hu-status-iteracao" href="../evidencias/iteracao7/" title="Ver evidências da Iteração 7">Iteração 7</a>
    </div>
    <h3><a class="hu-card-title-link" href="../historias/HU24/">HU24 — Consultar catálogo de experiências</a></h3>
  </div>
</div>

<a class="hu-card" href="../historias/HU25/">
  <div class="hu-card-header">
    <div class="hu-card-status">
      <span class="hu-status hu-status-planejada">Planejado</span>
      <span class="hu-status hu-status-prioridade">Alta</span>
    </div>
    <h3>HU25 — Consultar detalhes da experiência</h3>
  </div>
</a>

<a class="hu-card" href="../historias/HU26/">
  <div class="hu-card-header">
    <div class="hu-card-status">
      <span class="hu-status hu-status-planejada">Planejado</span>
      <span class="hu-status hu-status-prioridade">Média</span>
    </div>
    <h3>HU26 — Cadastrar evento</h3>
  </div>
</a>

<a class="hu-card" href="../historias/HU27/">
  <div class="hu-card-header">
    <div class="hu-card-status">
      <span class="hu-status hu-status-planejada">Planejado</span>
      <span class="hu-status hu-status-prioridade">Baixa</span>
    </div>
    <h3>HU27 — Atualizar evento</h3>
  </div>
</a>

<a class="hu-card" href="../historias/HU28/">
  <div class="hu-card-header">
    <div class="hu-card-status">
      <span class="hu-status hu-status-planejada">Planejado</span>
      <span class="hu-status hu-status-prioridade">Baixa</span>
    </div>
    <h3>HU28 — Excluir evento</h3>
  </div>
</a>

<a class="hu-card" href="../historias/HU29/">
  <div class="hu-card-header">
    <div class="hu-card-status">
      <span class="hu-status hu-status-planejada">Planejado</span>
      <span class="hu-status hu-status-prioridade">Média</span>
    </div>
    <h3>HU29 — Consultar catálogo de eventos</h3>
  </div>
</a>

<a class="hu-card" href="../historias/HU30/">
  <div class="hu-card-header">
    <div class="hu-card-status">
      <span class="hu-status hu-status-planejada">Planejado</span>
      <span class="hu-status hu-status-prioridade">Média</span>
    </div>
    <h3>HU30 — Consultar detalhes do evento</h3>
  </div>
</a>

<a class="hu-card" href="../historias/HU31/">
  <div class="hu-card-header">
    <div class="hu-card-status">
      <span class="hu-status hu-status-planejada">Planejado</span>
      <span class="hu-status hu-status-prioridade">Alta</span>
    </div>
    <h3>HU31 — Auxiliar cadastro de ofertas</h3>
  </div>
</a>

<a class="hu-card" href="../historias/HU32/">
  <div class="hu-card-header">
    <div class="hu-card-status">
      <span class="hu-status hu-status-planejada">Planejado</span>
      <span class="hu-status hu-status-prioridade">Baixa</span>
    </div>
    <h3>HU32 — Apresentar informações da Cafuringa</h3>
  </div>
</a>

<a class="hu-card" href="../historias/HU33/">
  <div class="hu-card-header">
    <div class="hu-card-status">
      <span class="hu-status hu-status-planejada">Planejado</span>
      <span class="hu-status hu-status-prioridade">Baixa</span>
    </div>
    <h3>HU33 — Consultar guia de boas práticas</h3>
  </div>
</a>

<a class="hu-card" href="../historias/HU34/">
  <div class="hu-card-header">
    <div class="hu-card-status">
      <span class="hu-status hu-status-planejada">Planejado</span>
      <span class="hu-status hu-status-prioridade">Baixa</span>
    </div>
    <h3>HU34 — Notificar novos eventos</h3>
  </div>
</a>

<a class="hu-card" href="../historias/HU35/">
  <div class="hu-card-header">
    <div class="hu-card-status">
      <span class="hu-status hu-status-planejada">Planejado</span>
      <span class="hu-status hu-status-prioridade">Alta</span>
    </div>
    <h3>HU35 — Visualizar ofertas no mapa</h3>
  </div>
</a>

<div class="hu-card" data-priority-order="14" data-iteration="7" >
  <div class="hu-card-header">
    <div class="hu-card-status">
      <span class="hu-status hu-status-execucao">Em execução</span>
      <span class="hu-status hu-status-mvp">MVP</span>
      <span class="hu-status hu-status-prioridade">Alta</span>
      <span class="hu-status hu-status-ordem" title="Ordem de implementação — Iteração 7">14º</span>
      <a class="hu-status hu-status-iteracao" href="../evidencias/iteracao7/" title="Ver evidências da Iteração 7">Iteração 7</a>
    </div>
    <h3><a class="hu-card-title-link" href="../historias/HU36/">HU36 — Buscar ofertas</a></h3>
  </div>
</div>

<a class="hu-card" href="../historias/HU37/">
  <div class="hu-card-header">
    <div class="hu-card-status">
      <span class="hu-status hu-status-planejada">Planejado</span>
      <span class="hu-status hu-status-prioridade">Média</span>
    </div>
    <h3>HU37 — Filtrar ofertas</h3>
  </div>
</a>

<a class="hu-card" href="../historias/HU38/">
  <div class="hu-card-header">
    <div class="hu-card-status">
      <span class="hu-status hu-status-planejada">Planejado</span>
      <span class="hu-status hu-status-prioridade">Média</span>
    </div>
    <h3>HU38 — Buscar ofertas por localização</h3>
  </div>
</a>

<div class="hu-card" data-priority-order="15" data-iteration="8" >
  <div class="hu-card-header">
    <div class="hu-card-status">
      <span class="hu-status hu-status-execucao">Em execução</span>
      <span class="hu-status hu-status-mvp">MVP</span>
      <span class="hu-status hu-status-prioridade">Alta</span>
      <span class="hu-status hu-status-ordem" title="Ordem de implementação — Iteração 8">15º</span>
      <a class="hu-status hu-status-iteracao" href="../evidencias/iteracao8/" title="Ver evidências da Iteração 8">Iteração 8</a>
    </div>
    <h3><a class="hu-card-title-link" href="../historias/HU39/">HU39 — Disponibilizar contato direto</a></h3>
  </div>
</div>

<a class="hu-card" href="../historias/HU40/">
  <div class="hu-card-header">
    <div class="hu-card-status">
      <span class="hu-status hu-status-planejada">Planejado</span>
      <span class="hu-status hu-status-prioridade">Baixa</span>
    </div>
    <h3>HU40 — Enviar feedback</h3>
  </div>
</a>

<a class="hu-card" href="../historias/HU41/">
  <div class="hu-card-header">
    <div class="hu-card-status">
      <span class="hu-status hu-status-planejada">Planejado</span>
      <span class="hu-status hu-status-prioridade">Baixa</span>
    </div>
    <h3>HU41 — Visualizar feedback</h3>
  </div>
</a>

<a class="hu-card" href="../historias/HU42/">
  <div class="hu-card-header">
    <div class="hu-card-status">
      <span class="hu-status hu-status-planejada">Planejado</span>
      <span class="hu-status hu-status-prioridade">Baixa</span>
    </div>
    <h3>HU42 — Editar feedback</h3>
  </div>
</a>

<a class="hu-card" href="../historias/HU43/">
  <div class="hu-card-header">
    <div class="hu-card-status">
      <span class="hu-status hu-status-planejada">Planejado</span>
      <span class="hu-status hu-status-prioridade">Baixa</span>
    </div>
    <h3>HU43 — Excluir feedback</h3>
  </div>
</a>

<div class="hu-card" data-priority-order="16" data-iteration="8" >
  <div class="hu-card-header">
    <div class="hu-card-status">
      <span class="hu-status hu-status-execucao">Em execução</span>
      <span class="hu-status hu-status-mvp">MVP</span>
      <span class="hu-status hu-status-prioridade">Alta</span>
      <span class="hu-status hu-status-ordem" title="Ordem de implementação — Iteração 8">16º</span>
      <a class="hu-status hu-status-iteracao" href="../evidencias/iteracao8/" title="Ver evidências da Iteração 8">Iteração 8</a>
    </div>
    <h3><a class="hu-card-title-link" href="../historias/HU44/">HU44 — Solicitar pré-reserva de experiência</a></h3>
  </div>
</div>

<div class="hu-card" data-priority-order="17" data-iteration="8" >
  <div class="hu-card-header">
    <div class="hu-card-status">
      <span class="hu-status hu-status-execucao">Em execução</span>
      <span class="hu-status hu-status-mvp">MVP</span>
      <span class="hu-status hu-status-prioridade">Alta</span>
      <span class="hu-status hu-status-ordem" title="Ordem de implementação — Iteração 8">17º</span>
      <a class="hu-status hu-status-iteracao" href="../evidencias/iteracao8/" title="Ver evidências da Iteração 8">Iteração 8</a>
    </div>
    <h3><a class="hu-card-title-link" href="../historias/HU45/">HU45 — Consultar pré-reserva</a></h3>
  </div>
</div>

<div class="hu-card" data-priority-order="18" data-iteration="8" >
  <div class="hu-card-header">
    <div class="hu-card-status">
      <span class="hu-status hu-status-execucao">Em execução</span>
      <span class="hu-status hu-status-mvp">MVP</span>
      <span class="hu-status hu-status-prioridade">Média</span>
      <span class="hu-status hu-status-ordem" title="Ordem de implementação — Iteração 8">18º</span>
      <a class="hu-status hu-status-iteracao" href="../evidencias/iteracao8/" title="Ver evidências da Iteração 8">Iteração 8</a>
    </div>
    <h3><a class="hu-card-title-link" href="../historias/HU46/">HU46 — Cancelar pré-reserva</a></h3>
  </div>
</div>

<div class="hu-card" data-priority-order="19" data-iteration="8" >
  <div class="hu-card-header">
    <div class="hu-card-status">
      <span class="hu-status hu-status-execucao">Em execução</span>
      <span class="hu-status hu-status-mvp">MVP</span>
      <span class="hu-status hu-status-prioridade">Média</span>
      <span class="hu-status hu-status-ordem" title="Ordem de implementação — Iteração 8">19º</span>
      <a class="hu-status hu-status-iteracao" href="../evidencias/iteracao8/" title="Ver evidências da Iteração 8">Iteração 8</a>
    </div>
    <h3><a class="hu-card-title-link" href="../historias/HU47/">HU47 — Responder pré-reserva de experiência</a></h3>
  </div>
</div>

<div class="hu-card" data-priority-order="20" data-iteration="8" >
  <div class="hu-card-header">
    <div class="hu-card-status">
      <span class="hu-status hu-status-execucao">Em execução</span>
      <span class="hu-status hu-status-mvp">MVP</span>
      <span class="hu-status hu-status-prioridade">Média</span>
      <span class="hu-status hu-status-ordem" title="Ordem de implementação — Iteração 8">20º</span>
      <a class="hu-status hu-status-iteracao" href="../evidencias/iteracao8/" title="Ver evidências da Iteração 8">Iteração 8</a>
    </div>
    <h3><a class="hu-card-title-link" href="../historias/HU48/">HU48 — Notificar alteração de pré-reserva</a></h3>
  </div>
</div>
</div>

<p id="hu-empty" class="hu-empty" hidden>Nenhuma história corresponde à busca. Experimente outros termos ou limpe os filtros.</p>
