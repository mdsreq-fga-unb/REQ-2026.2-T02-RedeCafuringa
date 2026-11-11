/*
 * Visualizações Cards / Tabela do backlog — Rede Cafuringa.
 * A tabela é uma segunda apresentação dos MESMOS cards, sem duplicar
 * registros de HUs nem implementar filtros ou ordenação em paralelo.
 * Observa a visibilidade e a ordem definidas pelo hu-filters.js.
 */
(function () {
  "use strict";

  function appendBadgeCell(row, element, fallback) {
    const cell = document.createElement("td");
    if (element) {
      const badge = document.createElement("span");
      badge.className = element.className;
      badge.textContent = element.textContent.trim();
      cell.appendChild(badge);
    } else {
      cell.className = "hu-table__muted";
      cell.textContent = fallback || "—";
    }
    row.appendChild(cell);
  }

  function createRow(card) {
    const row = document.createElement("tr");
    row.className = "hu-table__row";
    const title = card.querySelector("h3")?.textContent?.trim() || "História de usuário";
    const detail = card.matches("a.hu-card[href]")
      ? card
      : card.querySelector("a.hu-card-title-link[href]");

    const titleCell = document.createElement("td");
    titleCell.className = "hu-table__story";
    if (detail) {
      const link = document.createElement("a");
      link.className = "hu-table-title-link";
      link.href = detail.href;
      link.textContent = title;
      link.title = "Ver detalhes da história de usuário em uma janela";
      titleCell.appendChild(link);
      // Clicar na linha também abre a HU, sem interferir em outros links.
      row.addEventListener("click", (event) => {
        if (event.target.closest("a, button") || event.defaultPrevented) return;
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        link.click();
      });
    } else {
      titleCell.textContent = title;
    }
    row.appendChild(titleCell);

    appendBadgeCell(row, card.querySelector(".hu-status-execucao, .hu-status-planejada"));
    appendBadgeCell(row, card.querySelector(".hu-status-prioridade"));
    appendBadgeCell(row, card.querySelector(".hu-status-mvp"), "Fora do MVP");
    appendBadgeCell(row, card.querySelector(".hu-status-ordem"));

    const iterationCell = document.createElement("td");
    const iteration = card.querySelector("a.hu-status-iteracao[href]");
    if (iteration) {
      const link = document.createElement("a");
      link.className = iteration.className;
      link.href = iteration.href;
      link.textContent = iteration.textContent.trim();
      link.title = iteration.title || "Abrir evidências da iteração";
      iterationCell.appendChild(link);
    } else {
      iterationCell.className = "hu-table__muted";
      iterationCell.textContent = "—";
    }
    row.appendChild(iterationCell);
    return row;
  }

  function initHuTable() {
    const panel = document.getElementById("hu-filters");
    const catalog = document.querySelector(".hu-catalog");
    if (!panel || !catalog || catalog.dataset.tableViewInitialized === "true") return;
    const cards = Array.from(catalog.querySelectorAll(":scope > .hu-card"));
    if (!cards.length) return;
    catalog.dataset.tableViewInitialized = "true";

    const switcher = document.createElement("div");
    switcher.className = "hu-view-switch";
    switcher.setAttribute("role", "group");
    switcher.setAttribute("aria-label", "Modo de visualização do backlog");
    switcher.innerHTML = `
      <span class="hu-view-switch__label">Visualização do backlog</span>
      <div class="hu-view-switch__buttons">
        <button type="button" class="hu-view-switch__button" data-hu-view="cards" aria-pressed="true">▦ Cards</button>
        <button type="button" class="hu-view-switch__button" data-hu-view="table" aria-pressed="false">☷ Tabela</button>
      </div>`;
    panel.before(switcher);

    const wrapper = document.createElement("div");
    wrapper.className = "hu-table-view";
    wrapper.id = "hu-table-view";
    wrapper.hidden = true;
    wrapper.setAttribute("role", "region");
    wrapper.setAttribute("aria-label", "Histórias de usuário em tabela");
    wrapper.setAttribute("tabindex", "0");

    const table = document.createElement("table");
    table.className = "hu-table";
    const head = document.createElement("thead");
    const headerRow = document.createElement("tr");
    ["História de usuário", "Situação", "Prioridade", "Escopo", "Ordem", "Iteração"].forEach((label) => {
      const th = document.createElement("th");
      th.scope = "col";
      th.textContent = label;
      headerRow.appendChild(th);
    });
    head.appendChild(headerRow);
    table.appendChild(head);
    const body = document.createElement("tbody");
    table.appendChild(body);
    wrapper.appendChild(table);
    catalog.prepend(wrapper);

    const rows = new Map(cards.map((card) => [card, createRow(card)]));
    let pendingSync = false;
    function sync() {
      // hu-filters.js reordena e oculta os cards. A tabela apenas os espelha.
      for (const card of catalog.querySelectorAll(":scope > .hu-card")) {
        const row = rows.get(card);
        if (!row) continue;
        row.hidden = card.hidden;
        body.appendChild(row);
      }
    }
    function scheduleSync() {
      if (pendingSync) return;
      pendingSync = true;
      requestAnimationFrame(() => {
        pendingSync = false;
        if (catalog.isConnected) sync();
      });
    }

    // Observa tanto a mudança do atributo hidden (filtro) quanto a
    // ordem dos cards no DOM (ordenação), sem alterar hu-filters.js.
    const observer = new MutationObserver(scheduleSync);
    observer.observe(catalog, { childList: true });
    cards.forEach((card) => observer.observe(card, {
      attributes: true, attributeFilter: ["hidden"],
    }));

    const buttons = Array.from(switcher.querySelectorAll("[data-hu-view]"));
    function setView(mode) {
      const useTable = mode === "table";
      catalog.classList.toggle("hu-catalog--table", useTable);
      wrapper.hidden = !useTable;
      buttons.forEach((button) => {
        button.setAttribute("aria-pressed", String(button.dataset.huView === mode));
      });
      // Sincroniza imediatamente ao alternar a visualização.
      if (useTable) sync();
    }
    buttons.forEach((button) => {
      button.addEventListener("click", () => setView(button.dataset.huView));
    });
    sync();
  }

  // MkDocs Material pode trocar o conteúdo sem recarregar a página.
  if (typeof document$ !== "undefined") {
    document$.subscribe(initHuTable);
  } else if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initHuTable);
  } else {
    initHuTable();
  }
})();
