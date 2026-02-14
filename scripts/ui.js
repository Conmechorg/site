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
  function initYear() {
    const yById = document.getElementById("year");
    if (yById) yById.textContent = new Date().getFullYear();

    const yByData = document.querySelector("[data-year]");
    if (yByData) yByData.textContent = new Date().getFullYear();
  }

  // ---------- Back to top ----------
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

  // ---------- Partials ----------
  async function initPartials() {
    const headerHost = document.querySelector('[data-include="header"]');
    const footerHost = document.querySelector('[data-include="footer"]');
    if (!headerHost && !footerHost) return;

    async function loadInto(host, url) {
      if (!host) return;
      try {
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) return;
        host.innerHTML = await res.text();
      } catch (e) { /* silent */ }
    }

    await Promise.all([
      const v = "20260214-1"; // bump when you deploy
      loadInto(headerHost, `/partials/header.html?v=${v}`),
      loadInto(footerHost, `/partials/footer.html?v=${v}`),
    ]);
  }

  // ---------- Mobile nav toggle ----------
  function initMobileNav() {
    const header = document.querySelector(".site-header");
    const toggle = document.querySelector(".nav-toggle");
    const nav = document.getElementById("primaryNav") || document.querySelector(".nav");
    if (!header || !toggle || !nav) return;

    const close = () => {
      header.classList.remove("is-nav-open");
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    };

    const open = () => {
      header.classList.add("is-nav-open");
      nav.classList.add("is-open");
      toggle.setAttribute("aria-expanded", "true");
    };

    const isOpen = () => toggle.getAttribute("aria-expanded") === "true";

    toggle.addEventListener("click", (e) => {
      e.preventDefault();
      isOpen() ? close() : open();
    });

    nav.addEventListener("click", (e) => {
      const a = e.target.closest("a");
      if (!a) return;
      close();
    });

    document.addEventListener("click", (e) => {
      if (!isOpen()) return;
      if (e.target.closest(".site-header")) return;
      close();
    });

    window.addEventListener(
      "resize",
      () => {
        if (window.matchMedia("(min-width: 721px)").matches) close();
      },
      { passive: true }
    );

    close();
  }

  // ---------- Nav active ----------
  function initActiveNav() {
    const links = $$(".nav .nav-link");
    if (!links.length) return;

    const normalise = (p) => {
      const x = (p || "/").toLowerCase();
      if (x === "/") return "/index.html";
      return x;
    };

    const curPath = normalise(location.pathname || "/");

    // If home page, do not highlight any nav item
    if (curPath === "/index.html") {
      links.forEach((a) => {
        a.removeAttribute("aria-current");
        a.classList.remove("is-current");
      });
      return;
    }

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
      try { u = new URL(href, location.origin); } catch { return; }

      const linkPath = normalise(u.pathname || "/");
      if (linkPath === curPath) best = a;
    });

    if (best) {
      best.setAttribute("aria-current", "page");
      best.classList.add("is-current");
    }
  }

  // ---------- Signals ----------
  function initSignals() {
    const cards = $$(".signal-card");
    const pills = $$(".signals-pill");
    const expandAllBtn = document.getElementById("expandAll");
    const collapseAllBtn = document.getElementById("collapseAll");

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

    pills.forEach((btn) => {
      btn.addEventListener("click", () => {
        pills.forEach((p) => p.classList.remove("is-active"));
        btn.classList.add("is-active");
        applyFilter((btn.getAttribute("data-filter") || "all").toLowerCase());
      });
    });

    document.addEventListener("click", (e) => {
      const btn = e.target.closest(".signal-more");
      if (!btn) return;

      const card = btn.closest(".signal-card");
      if (!card) return;

      const isOpen = btn.getAttribute("aria-expanded") === "true";
      setExpanded(card, !isOpen);
    });

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

    applyFilter("all");
  }

  // ---------- Boot ----------
  document.addEventListener("DOMContentLoaded", async () => {
    await initPartials();

    initMobileNav();
    initActiveNav();
    initYear();
    initBackToTop();
    initSignals();
  });
})();
