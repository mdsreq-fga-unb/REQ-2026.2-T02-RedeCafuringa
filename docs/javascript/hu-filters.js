/* Busca e filtros locais do catálogo de Histórias de Usuário.
 * Metadados são lidos das tags de cada card; não existe lista duplicada.
 */
(function () {
  "use strict";

  function normalize(text) {
    return String(text || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function initHuFilters() {
    const panel = document.getElementById("hu-filters");
    const catalog = document.querySelector(".hu-catalog");
    if (!panel || !catalog || panel.dataset.initialized === "true") return;
    panel.dataset.initialized = "true";

    const search = panel.querySelector("#hu-search");
    const status = panel.querySelector("#hu-status-filter");
    const priority = panel.querySelector("#hu-priority-filter");
    const mvp = panel.querySelector("#hu-mvp-filter");
    const sorting = panel.querySelector("#hu-sort-filter");
    const reset = panel.querySelector("#hu-reset");
    const count = panel.querySelector("#hu-results-count");
    const empty = document.getElementById("hu-empty");

    const entries = Array.from(catalog.querySelectorAll("a.hu-card")).map((card, originalIndex) => {
      const title = card.querySelector("h3")?.textContent || "";
      const code = title.match(/HU\s*0*(\d+)/i);
      return {
        card,
        title: normalize(title),
        id: code ? Number(code[1]) : null,
        status: card.querySelector(".hu-status-execucao")
          ? "execucao"
          : card.querySelector(".hu-status-planejada")
            ? "planejada"
            : "",
        priority: normalize(card.querySelector(".hu-status-prioridade")?.textContent),
        mvp: Boolean(card.querySelector(".hu-status-mvp")),
        priorityOrder: Number(card.dataset.priorityOrder || 0),
        originalIndex,
      };
    });

    function update() {
      const query = normalize(search.value);
      const codeQuery = /^hu\s*0*(\d+)$/.exec(query);
      let visible = 0;

      entries.forEach((entry) => {
        const matchesSearch = !query || (
          codeQuery ? entry.id === Number(codeQuery[1]) : entry.title.includes(query)
        );
        const matchesStatus = !status.value || entry.status === status.value;
        const matchesPriority = !priority.value || entry.priority === priority.value;
        const matchesMvp = !mvp.value || entry.mvp === (mvp.value === "sim");
        const show = matchesSearch && matchesStatus && matchesPriority && matchesMvp;

        entry.card.hidden = !show;
        if (show) visible += 1;
      });

      // Sem ordem atribuída: mantém as 28 HUs fora do cronograma no fim.
      // A ordenação é aplicada a todos os cards, inclusive aos ocultos,
      // para que os filtros combinados não percam o comportamento esperado.
      const arranged = [...entries].sort((a, b) => {
        if (!sorting.value) return a.originalIndex - b.originalIndex;
        if (!a.priorityOrder && !b.priorityOrder) return a.originalIndex - b.originalIndex;
        if (!a.priorityOrder) return 1;
        if (!b.priorityOrder) return -1;
        return sorting.value === "asc"
          ? a.priorityOrder - b.priorityOrder
          : b.priorityOrder - a.priorityOrder;
      });
      arranged.forEach(({ card }) => catalog.appendChild(card));

      count.textContent = visible + " de " + entries.length +
        (entries.length === 1 ? " história exibida" : " histórias exibidas");
      if (empty) empty.hidden = visible !== 0;
    }

    search.addEventListener("input", update);
    [status, priority, mvp, sorting].forEach((select) =>
      select.addEventListener("change", update)
    );
    reset.addEventListener("click", () => {
      search.value = "";
      status.value = "";
      priority.value = "";
      mvp.value = "";
      sorting.value = "";
      update();
      search.focus();
    });

    update();
  }

  // Compatível com a navegação instantânea opcional do Material for MkDocs.
  if (typeof document$ !== "undefined") {
    document$.subscribe(initHuFilters);
  } else if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initHuFilters);
  } else {
    initHuFilters();
  }
})();
