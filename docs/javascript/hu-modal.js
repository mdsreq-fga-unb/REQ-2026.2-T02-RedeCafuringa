/*
 * Janela modal para histórias de usuário do backlog Rede Cafuringa.
 * Mantém as tags de iteração como links normais e funciona com os
 * cards originais (<a.hu-card>) e os cards após o filtro de iteração
 * (<div.hu-card> + <a.hu-card-title-link>).
 *
 * Sem dependências externas. A documentação da HU é carregada do
 * próprio GitHub Pages (mesma origem) e exibida sem sair do backlog.
 */
(function () {
  "use strict";

  const MODAL_ID = "hu-detail-modal";
  let lastTrigger = null;
  let controller = null;

  function getModal() {
    let dialog = document.getElementById(MODAL_ID);
    if (dialog) return dialog;

    dialog = document.createElement("dialog");
    dialog.id = MODAL_ID;
    dialog.className = "hu-detail-modal";
    dialog.setAttribute("aria-labelledby", "hu-detail-modal-title");
    dialog.innerHTML = `
      <div class="hu-detail-modal__shell">
        <header class="hu-detail-modal__header">
          <h2 id="hu-detail-modal-title" class="hu-detail-modal__title">História de usuário</h2>
          <div class="hu-detail-modal__actions">
            <a class="hu-detail-modal__full-link" href="#" target="_blank" rel="noopener noreferrer">Abrir página completa</a>
            <button class="hu-detail-modal__close" type="button" aria-label="Fechar detalhes da história de usuário" title="Fechar (Esc)">×</button>
          </div>
        </header>
        <div class="hu-detail-modal__body md-typeset" id="hu-detail-modal-body" tabindex="0" aria-busy="false">
          <p role="status">Selecione uma história para ver os detalhes.</p>
        </div>
      </div>`;

    document.body.appendChild(dialog);

    dialog.querySelector(".hu-detail-modal__close").addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (event) => {
      // Fecha ao clicar fora do painel, no fundo escurecido.
      if (event.target === dialog) dialog.close();
    });
    dialog.addEventListener("close", () => {
      if (controller) controller.abort();
      controller = null;
      if (lastTrigger && lastTrigger.isConnected) lastTrigger.focus({ preventScroll: true });
      lastTrigger = null;
    });
    return dialog;
  }

  function resolveEmbeddedUrls(content, pageUrl) {
    // Links/imagens relativos devem ser resolvidos com base na página
    // carregada, não na URL do backlog que permanece na barra do navegador.
    const attributes = ["href", "src", "poster", "data-src"];
    content.querySelectorAll("[href], [src], [poster], [data-src], [srcset]").forEach((element) => {
      for (const attribute of attributes) {
        const value = element.getAttribute(attribute);
        if (!value || /^\s*(?:data:|javascript:|mailto:|tel:)/i.test(value)) continue;
        try { element.setAttribute(attribute, new URL(value, pageUrl).href); }
        catch (_) { /* Mantém a URL original se estiver malformada. */ }
      }
      const srcset = element.getAttribute("srcset");
      if (srcset) {
        element.setAttribute("srcset", srcset.replace(/(?:^|,)\s*([^,\s]+)(\s+[^,]*)?/g,
          (match, url, descriptor) => {
            try { return `${match.trimStart().startsWith(",") ? ", " : ""}${new URL(url, pageUrl).href}${descriptor || ""}`; }
            catch (_) { return match; }
          }));
      }
    });
  }

  async function openHu(link) {
    const dialog = getModal();
    const body = dialog.querySelector(".hu-detail-modal__body");
    const title = dialog.querySelector(".hu-detail-modal__title");
    const fullLink = dialog.querySelector(".hu-detail-modal__full-link");
    const pageUrl = new URL(link.href, window.location.href);
    const card = link.closest(".hu-card");

    // A modal só carrega arquivos do próprio Pages.
    if (pageUrl.origin !== window.location.origin) return;

    lastTrigger = link;
    title.textContent = card?.querySelector("h3")?.textContent?.trim() || "História de usuário";
    fullLink.href = pageUrl.href;
    body.replaceChildren();
    const loading = document.createElement("p");
    loading.setAttribute("role", "status");
    loading.textContent = "Carregando detalhes da história...";
    body.appendChild(loading);
    body.setAttribute("aria-busy", "true");
    body.scrollTop = 0;

    if (controller) controller.abort();
    controller = new AbortController();
    const currentController = controller;
    if (!dialog.open) dialog.showModal();
    dialog.querySelector(".hu-detail-modal__close").focus();

    try {
      const response = await fetch(pageUrl.href, {
        signal: currentController.signal,
        headers: { Accept: "text/html" },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const parsed = new DOMParser().parseFromString(await response.text(), "text/html");
      const article = parsed.querySelector(".md-content__inner");
      if (!article) throw new Error("Conteúdo da HU não encontrado na página");

      // Não executar scripts incorporados à página carregada.
      article.querySelectorAll("script, iframe, object, embed").forEach((node) => node.remove());
      article.querySelectorAll(".md-content__button, .md-source-file").forEach((node) => node.remove());
      resolveEmbeddedUrls(article, pageUrl);
      if (controller !== currentController || !dialog.open) return;
      body.replaceChildren(...Array.from(article.childNodes));
      body.scrollTop = 0;
    } catch (error) {
      if (error.name === "AbortError" || controller !== currentController) return;
      const message = document.createElement("p");
      message.setAttribute("role", "alert");
      message.textContent = "Não foi possível carregar os detalhes desta história. Use ‘Abrir página completa’ para acessá-la.";
      body.replaceChildren(message);
    } finally {
      if (controller === currentController) {
        body.setAttribute("aria-busy", "false");
        controller = null;
      }
    }
  }

  // Delegação: preserva o funcionamento quando o MkDocs usa navegação instantânea
  // e quando o filtro reordena os cards após cada busca.
  document.addEventListener("click", (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    if (!(event.target instanceof Element)) return;
    const link = event.target.closest(".hu-catalog a.hu-card, .hu-catalog a.hu-card-title-link");
    if (!link || !link.href || link.target === "_blank" || link.hasAttribute("download")) return;
    if (new URL(link.href, window.location.href).origin !== window.location.origin) return;
    event.preventDefault();
    event.stopPropagation();
    openHu(link);
  }, true);

  // Se o Material for navegar para outra seção, não mantenha a modal antiga.
  if (typeof document$ !== "undefined") {
    document$.subscribe(() => {
      const dialog = document.getElementById(MODAL_ID);
      if (dialog && dialog.open) dialog.close();
    });
  }
})();
