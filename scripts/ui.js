/* ============================
   CM Site UI — shared behaviors
   /scripts/ui.js
   ============================ */

(function () {
  "use strict";

  // ---------- Helpers ----------
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const $ = (sel, root = document) => root.querySelector(sel);

  // ---------- Footer year ----------
  // Supports: <span id="year"></span>  OR  <span data-year></span>
  function initYear() {
    const yById = document.getElementById("year");
    if (yById) yById.textContent = new Date().getFullYear();

    const yByData = document.querySelector("[data-year]");
    if (yByData) yByData.textContent = new Date().getFullYear();
  }

  // ---------- Back to top ----------
  // Supports: <button id="toTop" class="to-top">…</button>  OR  <button data-to-top class="to-top">…</button>
  function initBackToTop() {
    const btn = document.getElementById("toTop") || document.querySelector("[data-to-top]");
    if (!btn) return;

    const threshold = 60;

    function toggle() {
      const show = window.scrollY > threshold;
      btn.classList.toggle("is-visible", show);
    }

    window.addEventListener("scroll", toggle, { passive: true });
    toggle();

    btn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // ---------- Partials: header/footer injection ----------
  // Looks for: <div data-include="header"></div> and/or <div data-include="footer"></div>
  async function initPartials() {
    const headerHost = document.querySelector('[data-include="header"]');
    const footerHost = document.querySelector('[data-include="footer"]');

    // If no placeholders, nothing to do.
    if (!headerHost && !footerHost) return;

    async function loadInto(host, url) {
      if (!host) return;
      try {
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) return;
        host.innerHTML = await res.text();
      } catch (e) {
        // Silent fail — page still renders without partials
      }
    }

    // Root-relative paths so it works across pages
    await Promise.all([
      loadInto(headerHost, "/partials/header.html"),
      loadInto(footerHost, "/partials/footer.html"),
    ]);
  }

  // ---------- Nav: set current page ----------
  // Sets aria-current="page" on the best matching .nav-link
  // (Works after partial injection too.)
  function initActiveNav() {
    const links = $$(".nav .nav-link");
    if (!links.length) return;

    const path = (location.pathname || "/").toLowerCase();
    const isHome = path === "/" || path.endsWith("/index.html");

    // Clear previous
    links.forEach((a) => {
      a.removeAttribute("aria-current");
      a.classList.remove("is-current");
    });

    let best = null;

    links.forEach((a) => {
      if (a.hasAttribute("data-keep-active")) return;

      const href = (a.getAttribute("href") || "").trim();
      if (!href || href.startsWith("http") || href.startsWith("mailto:")) return;

      let u;
      try {
        u = new URL(href, location.origin);
      } catch {
        return;
      }

      const hrefPath = (u.pathname || "/").toLowerCase();

      if (isHome && (hrefPath === "/" || hrefPath.endsWith("/index.html"))) best = a;
      if (!isHome && hrefPath === path) best = a;
    });

    if (best) {
      best.setAttribute("aria-current", "page");
      best.classList.add("is-current");
    }
  }

  // ---------- Signals: filter + expand/collapse ----------
  function initSignals() {
    const cards = $$(".signal-card");
    const pills = $$(".signals-pill");
    const expandAllBtn = document.getElementById("expandAll");
    const collapseAllBtn = document.getElementById("collapseAll");

    // If the page doesn't have Signals markup, do nothing.
    if (!cards.length || !pills.length) return;

    function applyFilter(filter) {
      cards.forEach((card) => {
        const t = (card.getAttribute("data-type") || "").toLowerCase();
        const show = filter === "all" || t === filter;
        card.style.display = show ? "" : "none";
      });
    }

    function setExpanded(card, expanded) {
      const moreBtn = $(".signal-more", card);
      const detail = $(".signal-detail", card);
      if (!moreBtn || !detail) return;

      moreBtn.setAttribute("aria-expanded", expanded ? "true" : "false");
      detail.hidden = !expanded;

      const chev = $(".chev", moreBtn);
      if (chev) chev.textContent = expanded ? "▲" : "▼";
    }

    // Pills
    pills.forEach((btn) => {
      btn.addEventListener("click", () => {
        pills.forEach((p) => p.classList.remove("is-active"));
        btn.classList.add("is-active");
        applyFilter((btn.getAttribute("data-filter") || "all").toLowerCase());
      });
    });

    // Per-card "More"
    document.addEventListener("click", (e) => {
      const btn = e.target.closest(".signal-more");
      if (!btn) return;

      const card = btn.closest(".signal-card");
      if (!card) return;

      const isOpen = btn.getAttribute("aria-expanded") === "true";
      setExpanded(card, !isOpen);
    });

    // Expand/collapse all (only affects visible cards)
    if (expandAllBtn) {
      expandAllBtn.addEventListener("click", () => {
        cards.forEach((card) => {
          if (card.style.display === "none") return;
          setExpanded(card, true);
        });
      });
    }

    if (collapseAllBtn) {
      collapseAllBtn.addEventListener("click", () => {
        cards.forEach((card) => {
          if (card.style.display === "none") return;
          setExpanded(card, false);
        });
      });
    }

    // Default
    applyFilter("all");
  }

  // ---------- Boot ----------
  // IMPORTANT: partial injection must run before nav/year/toTop so those elements exist.
  document.addEventListener("DOMContentLoaded", async () => {
    await initPartials();

    // Now that header/footer may be injected, initialise UI on injected DOM
    initActiveNav();
    initYear();
    initBackToTop();
    initSignals();
  });
})();
