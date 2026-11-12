/* Backlog — visualizações Cards / Tabela a partir dos mesmos 48 registros.
 * Esta tabela não mantém cópias editáveis: espelha os cards gerados da fonte única.
 */
(function () {
  "use strict";

  const links = {
    rf: "../requisitos_software/#71-requisitos-funcionais",
    rnfs: "../requisitos_software/#72-requisitos-nao-funcionais",
    regras: "../requisitos_software/#73-lista-de-regras-de-negocio",
    cps: "../solucao/#23-caracteristicas-do-produto",
    oes: "../solucao/#22-objetivos-especificos-oe-do-produto"
  };
  function addChipGroup(container, label, raw, target) {
    const box = document.createElement("div");
    box.className = "hu-table__relation";
    const heading = document.createElement("strong");
    heading.textContent = label;
    box.appendChild(heading);
    const codes = (raw || "").trim().split(/\s+/).filter(Boolean);
    if (!codes.length) {
      const empty = document.createElement("span");
      empty.textContent = "—";
      box.appendChild(empty);
    }
    codes.forEach((code) => {
      const link = document.createElement("a");
      link.href = target;
      link.className = "hu-table__chip";
      link.textContent = code;
      link.title = "Consultar " + code + " na especificação";
      box.appendChild(link);
    });
    container.appendChild(box);
  }
  function appendBadge(target, item, selector, fallback) {
    const badge = item.querySelector(selector);
    if (badge) {
      const span = document.createElement("span");
      span.className = badge.className;
      span.textContent = badge.textContent.trim();
      target.appendChild(span);
    } else if (fallback) {
      const span = document.createElement("span");
      span.className = "hu-table__muted";
      span.textContent = fallback;
      target.appendChild(span);
    }
  }
  function makeRow(card) {
    const tr = document.createElement("tr");
    tr.className = "hu-table__row";
    const name = card.querySelector("h3")?.textContent?.trim() || "História";
    const detail = card.querySelector("a.hu-card-title-link[href]") || card.matches("a.hu-card[href]") && card;

    const title = document.createElement("td");
    title.className = "hu-table__story";
    const main = document.createElement("a");
    main.className = "hu-table-title-link";
    main.href = detail?.href || "#";
    main.textContent = name;
    main.title = "Ver história no pop-up";
    title.appendChild(main);
    tr.appendChild(title);
    tr.addEventListener("click", (event) => {
      if (event.target.closest("a,button,summary") || event.defaultPrevented || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      main.click();
    });

    const origin = document.createElement("td");
    addChipGroup(origin, "RF", card.dataset.rf, links.rf);
    addChipGroup(origin, "CP", card.dataset.cps, links.cps);
    addChipGroup(origin, "OE", card.dataset.oes, links.oes);
    tr.appendChild(origin);

    const relations = document.createElement("td");
    const detailBox = document.createElement("details");
    detailBox.className = "hu-table__details";
    const summary = document.createElement("summary");
    summary.textContent = "Ver vínculos";
    detailBox.appendChild(summary);
    addChipGroup(detailBox, "RNFs", card.dataset.rnfs, links.rnfs);
    addChipGroup(detailBox, "Regras", card.dataset.regras, links.regras);
    relations.appendChild(detailBox);
    tr.appendChild(relations);

    const delivery = document.createElement("td");
    delivery.className = "hu-table__stack";
    appendBadge(delivery,card,".hu-status-mvp","Fora do MVP");
    const iter = card.querySelector("a.hu-status-iteracao[href]");
    if(iter){
      const link=document.createElement("a");
      link.href=iter.href; link.className="hu-table__iteration";
      link.textContent=iter.textContent.trim();
      delivery.appendChild(link);
    }
    appendBadge(delivery,card,".hu-status-ordem");
    tr.appendChild(delivery);

    const state = document.createElement("td");
    state.className = "hu-table__stack";
    appendBadge(state,card,".hu-status-prioridade");
    appendBadge(state,card,".hu-status-execucao, .hu-status-planejada");
    tr.appendChild(state);
    return tr;
  }

  function init() {
    const panel=document.getElementById("hu-filters");
    const catalog=document.querySelector(".hu-catalog");
    if(!panel || !catalog || catalog.dataset.tableViewInitialized==="true") return;
    const cards=Array.from(catalog.querySelectorAll(":scope > .hu-card"));
    if(cards.length!==48) return;
    catalog.dataset.tableViewInitialized="true";

    const switcher=document.createElement("div");
    switcher.className="hu-view-switch";
    switcher.setAttribute("role","group");
    switcher.setAttribute("aria-label","Modo de visualização do backlog");
    switcher.innerHTML='<span class="hu-view-switch__label">Visualização do backlog</span><div class="hu-view-switch__buttons"><button type="button" class="hu-view-switch__button" data-hu-view="cards" aria-pressed="true">▦ Cards</button><button type="button" class="hu-view-switch__button" data-hu-view="table" aria-pressed="false">☷ Tabela</button></div>';
    panel.before(switcher);

    const wrapper=document.createElement("div");
    wrapper.className="hu-table-view hu-table-view--integrated";
    wrapper.id="hu-table-view";
    wrapper.hidden=true;
    wrapper.setAttribute("role","region");
    wrapper.setAttribute("aria-label","Visão integrada das histórias do backlog");
    wrapper.setAttribute("tabindex","0");
    const table=document.createElement("table");
    table.className="hu-table";
    const thead=document.createElement("thead");
    const head=document.createElement("tr");
    ["História de usuário","RF e origem","RNFs e regras","Entrega","Prioridade e situação"].forEach((label) => {
      const th=document.createElement("th");th.scope="col";th.textContent=label;head.appendChild(th);
    });
    thead.appendChild(head);table.appendChild(thead);
    const body=document.createElement("tbody");table.appendChild(body);wrapper.appendChild(table);catalog.prepend(wrapper);

    const rows=new Map(cards.map(card=>[card,makeRow(card)]));
    function sync() {
      for(const card of catalog.querySelectorAll(":scope > .hu-card")){
        const row=rows.get(card);
        if(!row) continue;
        row.hidden=card.hidden;
        body.appendChild(row);
      }
    }
    let pending=false;
    const observer=new MutationObserver(()=>{
      if(pending)return;
      pending=true;
      requestAnimationFrame(()=>{pending=false;if(catalog.isConnected)sync();});
    });
    observer.observe(catalog,{childList:true});
    cards.forEach(card=>observer.observe(card,{attributes:true,attributeFilter:["hidden"]}));

    const buttons=Array.from(switcher.querySelectorAll("[data-hu-view]"));
    function setView(mode){
      const tableMode=mode==="table";
      catalog.classList.toggle("hu-catalog--table",tableMode);
      wrapper.hidden=!tableMode;
      buttons.forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.huView===mode)));
      if(tableMode)sync();
    }
    buttons.forEach(b=>b.addEventListener("click",()=>setView(b.dataset.huView)));
    sync();
  }
  if(typeof document$!=="undefined") document$.subscribe(init);
  else if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);
  else init();
})();
